import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function bar(percent: number, color: string, height = 8): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="background:${color};width:${percent}%;height:${height}px;border-radius:4px 0 0 4px;"></td>
        <td style="background:#f0f0f5;height:${height}px;border-radius:0 4px 4px 0;"></td>
      </tr>
    </table>`;
}

function stackedBar(segments: { pct: number; color: string }[], height = 10): string {
  let cells = '';
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.pct <= 0) continue;
    const radiusL = i === 0 ? '5px 0 0 5px' : '0';
    const radiusR = i === segments.length - 1 ? '0 5px 5px 0' : '0';
    cells += `<td style="background:${s.color};width:${s.pct}%;height:${height}px;border-radius:${radiusL};border-top-right-radius:${radiusR};border-bottom-right-radius:${radiusR};"></td>`;
  }
  const usedPct = segments.reduce((s, seg) => s + seg.pct, 0);
  if (usedPct < 100) {
    cells += `<td style="background:#f0f0f5;height:${height}px;border-radius:0 5px 5px 0;"></td>`;
  }
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${cells}</tr></table>`;
}

function formatDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calcDuration(start: string, end: string): number | null {
  if (!start || !end) return null;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return diff >= 0 ? diff : null;
}

// ── Main handler ─────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.body as { projectId?: string };
    if (!projectId) {
      return res.status(400).json({ error: 'Missing projectId' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const emailTo = process.env.EMAIL_TO;

    const missing = [
      !supabaseUrl && 'SUPABASE_URL',
      !supabaseKey && 'SUPABASE_SERVICE_ROLE_KEY',
      !resendKey && 'RESEND_API_KEY',
      !emailTo && 'EMAIL_TO',
    ].filter(Boolean);

    if (missing.length > 0) {
      return res.status(500).json({ error: 'Missing environment variables', missing });
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Fetch project, entries, and tasks
    const [
      { data: project, error: projectError },
      { data: entries },
      { data: tasks },
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('entries').select('*').eq('project_id', projectId).order('date'),
      supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at'),
    ]);

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // ── Computed values ──────────────────────────────────────────────────

    const totalSpent = (entries ?? []).reduce((s: number, e: { price: number }) => s + (e.price ?? 0), 0);
    const entryCount = (entries ?? []).length;
    const taskTotal = (tasks ?? []).length;
    const taskDone = (tasks ?? []).filter((t: { completed: boolean }) => t.completed).length;
    const taskPct = pct(taskDone, taskTotal);

    const startDate: string = project.start_date ?? '';
    const finishDate: string = project.finish_date ?? '';
    const duration = calcDuration(startDate, finishDate);

    // Category breakdown
    const categoryMap = new Map<string, number>();
    for (const e of (entries ?? []) as { category: string; price: number }[]) {
      const cat = e.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + (e.price ?? 0));
    }
    const categories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1]);

    const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

    // ── Build email HTML ─────────────────────────────────────────────────

    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const P = '16px';

    // Entry rows
    let entryRows = '';
    for (const e of (entries ?? []) as { date: string; store: string; description: string; category: string; price: number; is_pending: boolean }[]) {
      const label = [e.store, e.description].filter(Boolean).join(' — ') || 'No description';
      const cat = e.category || 'Uncategorized';
      entryRows += `
        <tr>
          <td style="padding:5px 0;border-bottom:1px solid #f5f5fa;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding-right:16px;">
                  <div style="font-size:13px;color:#333;">${label}${e.is_pending ? ' <span style="font-size:10px;color:#f59e0b;font-weight:600;">PENDING</span>' : ''}</div>
                  <div style="font-size:11px;color:#999;margin-top:1px;">${formatDate(e.date)} &middot; ${cat}</div>
                </td>
                <td style="font-size:13px;font-weight:600;color:#0a0a14;text-align:right;white-space:nowrap;padding-left:16px;">
                  ${fmt(e.price ?? 0)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }

    // Category breakdown bars
    let categoryRows = '';
    for (let i = 0; i < categories.length; i++) {
      const [cat, amount] = categories[i];
      const catPct = pct(amount, totalSpent);
      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      categoryRows += `
        <tr>
          <td style="padding:6px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="font-size:12px;color:#555;padding-bottom:4px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:5px;vertical-align:middle;"></span>
                  ${cat}
                </td>
                <td style="font-size:12px;font-weight:600;color:#0a0a14;text-align:right;padding-bottom:4px;">${fmt(amount)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-bottom:2px;">${bar(catPct, color, 6)}</td>
              </tr>
            </table>
          </td>
        </tr>`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width: 480px) {
      .wrapper { padding: 12px 4px !important; }
      .card { border-radius: 8px !important; }
      .inner { padding-left: 14px !important; padding-right: 14px !important; }
      .big-num { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;">
    <tr><td align="center" class="wrapper" style="padding:24px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);" class="card">

        <!-- Header -->
        <tr>
          <td class="inner" style="background:#f8f8fc;padding:24px ${P};text-align:center;border-bottom:2px solid #e8e8f0;">
            <div style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#22c55e;margin-bottom:6px;">Project Complete</div>
            <div style="font-size:22px;font-weight:700;color:#0a0a14;letter-spacing:-0.5px;">${project.name}</div>
            <div style="font-size:12px;color:#999;margin-top:4px;">${dateStr}</div>
          </td>
        </tr>

        <!-- Big numbers -->
        <tr>
          <td class="inner" style="padding:20px ${P} 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td width="33%" style="text-align:center;padding:10px 2px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Total Spent</div>
                  <div class="big-num" style="font-size:22px;font-weight:800;color:#0a0a14;">${fmt(totalSpent)}</div>
                </td>
                <td width="33%" style="text-align:center;padding:10px 2px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Duration</div>
                  <div class="big-num" style="font-size:22px;font-weight:800;color:#0a0a14;">${duration !== null ? `${duration}d` : '—'}</div>
                </td>
                <td width="33%" style="text-align:center;padding:10px 2px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Entries</div>
                  <div class="big-num" style="font-size:22px;font-weight:800;color:#0a0a14;">${entryCount}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Dates row -->
        <tr>
          <td class="inner" style="padding:12px ${P} 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8f8fc;border-radius:8px;">
              <tr>
                <td width="50%" style="padding:10px 14px;text-align:center;border-right:1px solid #eeeef5;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:2px;">Started</div>
                  <div style="font-size:14px;font-weight:600;color:#0a0a14;">${formatDate(startDate)}</div>
                </td>
                <td width="50%" style="padding:10px 14px;text-align:center;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:2px;">Finished</div>
                  <div style="font-size:14px;font-weight:600;color:#22c55e;">${formatDate(finishDate)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${taskTotal > 0 ? `
        <!-- Tasks progress -->
        <tr>
          <td class="inner" style="padding:16px ${P} 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;padding-bottom:6px;">
                  Tasks — ${taskDone} of ${taskTotal} completed
                </td>
                <td style="font-size:10px;color:${taskDone === taskTotal ? '#22c55e' : '#999'};text-align:right;padding-bottom:6px;">
                  ${taskPct}%
                </td>
              </tr>
              <tr>
                <td colspan="2">${bar(taskPct, taskDone === taskTotal ? '#22c55e' : '#3b82f6', 10)}</td>
              </tr>
            </table>
          </td>
        </tr>
        ` : ''}

        <!-- Divider -->
        <tr><td class="inner" style="padding:16px ${P} 8px;"><div style="border-top:1px solid #f0f0f5;"></div></td></tr>

        ${categories.length > 0 ? `
        <!-- Category breakdown -->
        <tr>
          <td class="inner" style="padding:0 ${P} 8px;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Spending by category</div>
            ${stackedBar(
              categories.slice(0, 7).map((c, i) => ({ pct: pct(c[1], totalSpent), color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })),
              12
            )}
          </td>
        </tr>
        <tr>
          <td class="inner" style="padding:0 ${P} 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${categoryRows}
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td class="inner" style="padding:8px ${P};"><div style="border-top:1px solid #f0f0f5;"></div></td></tr>
        ` : ''}

        ${entryCount > 0 ? `
        <!-- Entry list -->
        <tr>
          <td class="inner" style="padding:0 ${P} 8px;">
            <div style="font-size:15px;font-weight:700;color:#0a0a14;padding-bottom:10px;">All Expenses</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${entryRows}
            </table>
          </td>
        </tr>

        <!-- Total row -->
        <tr>
          <td class="inner" style="padding:0 ${P} 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8f8fc;border-radius:6px;">
              <tr>
                <td style="padding:10px 14px;font-size:14px;font-weight:700;color:#555;text-align:left;">Total</td>
                <td style="padding:10px 14px;font-size:16px;font-weight:800;color:#0a0a14;text-align:right;">${fmt(totalSpent)}</td>
              </tr>
            </table>
          </td>
        </tr>
        ` : `
        <tr>
          <td class="inner" style="padding:0 ${P} 24px;text-align:center;">
            <div style="font-size:13px;color:#999;">No expenses recorded for this project.</div>
          </td>
        </tr>
        `}

        ${project.notes ? `
        <!-- Notes -->
        <tr>
          <td class="inner" style="padding:0 ${P} 20px;">
            <div style="background:#f8f8fc;border-radius:8px;padding:12px 14px;">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Notes</div>
              <div style="font-size:13px;color:#555;line-height:1.5;">${project.notes}</div>
            </div>
          </td>
        </tr>
        ` : ''}

      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="text-align:center;padding:14px 0;font-size:11px;color:#bbb;">
            Sent from your DIY Project Tracker
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;

    const resend = new Resend(resendKey);
    const { error: emailError } = await resend.emails.send({
      from: 'DIY Tracker <onboarding@resend.dev>',
      to: emailTo!,
      subject: `Project Complete: ${project.name}`,
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: 'Failed to send email', details: emailError });
    }

    return res.status(200).json({ ok: true, project: project.name });
  } catch (err) {
    console.error('Project complete email error:', err);
    return res.status(500).json({ error: 'Internal error', details: String(err) });
  }
}
