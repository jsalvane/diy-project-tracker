import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ── Helpers ──────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(from: string, to: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / msPerDay);
}

type DueStatus = 'overdue' | 'due-today' | 'due-this-week' | 'upcoming' | 'no-date';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeDueStatus(task: any, today: string): DueStatus {
  if (task.snoozed_until && task.snoozed_until > today) return 'upcoming';

  if (task.recurrence_type === 'usage') {
    if (!task.recurrence_value || task.recurrence_value <= 0) return 'no-date';
    const usageSinceLast = (task.current_usage ?? 0) - (task.last_completion_usage ?? 0);
    if (usageSinceLast >= task.recurrence_value) return 'overdue';
    if (usageSinceLast >= task.recurrence_value * 0.9) return 'due-today';
    return 'upcoming';
  }

  if (!task.next_due_date) return 'no-date';

  const diff = daysBetween(today, task.next_due_date);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due-today';
  if (diff <= 7) return 'due-this-week';
  return 'upcoming';
}

function formatDueDate(task: any, today: string): string {
  if (task.recurrence_type === 'usage') {
    const used = (task.current_usage ?? 0) - (task.last_completion_usage ?? 0);
    return `${used} / ${task.recurrence_value} ${task.recurrence_unit ?? 'uses'}`;
  }
  if (!task.next_due_date) return 'No due date';
  const diff = daysBetween(today, task.next_due_date);
  if (diff === 0) return 'Today';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    hvac: 'HVAC', electrical: 'Electrical', plumbing: 'Plumbing',
    exterior: 'Exterior', interior: 'Interior', appliances: 'Appliances',
    safety: 'Safety', 'windows-doors': 'Windows & Doors', vehicles: 'Vehicles',
    'power-tools': 'Power Tools', 'lawn-garden': 'Lawn & Garden',
    'snow-winter': 'Snow & Winter', generator: 'Generator',
    recreational: 'Recreational', other: 'Other',
  };
  return labels[cat] ?? cat;
}

// ── Email building ────────────────────────────────────────────────────────

const STATUS_META: Record<DueStatus, { label: string; color: string; bg: string }> = {
  overdue:          { label: 'Overdue',    color: '#dc2626', bg: '#fef2f2' },
  'due-today':      { label: 'Due Today',  color: '#d97706', bg: '#fffbeb' },
  'due-this-week':  { label: 'This Week',  color: '#ca8a04', bg: '#fefce8' },
  upcoming:         { label: 'Upcoming',   color: '#6b7280', bg: '#f9fafb' },
  'no-date':        { label: 'No Date',    color: '#9ca3af', bg: '#f9fafb' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function taskRow(task: any, status: DueStatus, today: string, machineMap: Record<string, string>): string {
  const meta = STATUS_META[status];
  const machineName = task.machine_id ? (machineMap[task.machine_id] ?? '') : '';
  const dueLabel = formatDueDate(task, today);
  const icon = task.icon || '🔧';

  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="width:32px;vertical-align:top;padding-top:1px;">
              <span style="font-size:18px;">${icon}</span>
            </td>
            <td style="vertical-align:top;padding-right:12px;">
              <div style="font-size:14px;font-weight:600;color:#0a0a14;">${task.name}</div>
              <div style="font-size:12px;color:#888;margin-top:2px;">
                ${categoryLabel(task.category)}${machineName ? ` · ${machineName}` : ''}
              </div>
            </td>
            <td style="vertical-align:top;text-align:right;white-space:nowrap;">
              <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${meta.bg};color:${meta.color};">
                ${dueLabel}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function sectionBlock(title: string, color: string, rows: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding-bottom:8px;border-bottom:2px solid ${color};">
          <span style="font-size:13px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px;">${title}</span>
        </td>
      </tr>
      ${rows}
    </table>`;
}

// ── Main handler ──────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers['authorization'];
      if (auth !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
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
    const resend = new Resend(resendKey);

    const today = todayStr();

    const [{ data: tasks }, { data: machines }] = await Promise.all([
      supabase.from('maintenance_tasks').select('*'),
      supabase.from('machines').select('id, name'),
    ]);

    const machineMap: Record<string, string> = {};
    for (const m of machines ?? []) machineMap[m.id] = m.name;

    // Classify tasks
    const overdue: any[] = [];
    const dueToday: any[] = [];
    const dueThisWeek: any[] = [];

    for (const task of tasks ?? []) {
      const status = computeDueStatus(task, today);
      if (status === 'overdue') overdue.push(task);
      else if (status === 'due-today') dueToday.push(task);
      else if (status === 'due-this-week') dueThisWeek.push(task);
    }

    const totalActionable = overdue.length + dueToday.length + dueThisWeek.length;

    // Don't send if nothing needs attention
    if (totalActionable === 0) {
      return res.status(200).json({ ok: true, sent: false, reason: 'No actionable tasks' });
    }

    // Build sections
    let sections = '';

    if (overdue.length > 0) {
      const rows = overdue.map(t => taskRow(t, 'overdue', today, machineMap)).join('');
      sections += sectionBlock(`Overdue (${overdue.length})`, '#dc2626', rows);
    }
    if (dueToday.length > 0) {
      const rows = dueToday.map(t => taskRow(t, 'due-today', today, machineMap)).join('');
      sections += sectionBlock(`Due Today (${dueToday.length})`, '#d97706', rows);
    }
    if (dueThisWeek.length > 0) {
      const rows = dueThisWeek.map(t => taskRow(t, 'due-this-week', today, machineMap)).join('');
      sections += sectionBlock(`This Week (${dueThisWeek.length})`, '#ca8a04', rows);
    }

    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const subjectParts: string[] = [];
    if (overdue.length > 0) subjectParts.push(`${overdue.length} overdue`);
    if (dueToday.length > 0) subjectParts.push(`${dueToday.length} due today`);
    if (dueThisWeek.length > 0) subjectParts.push(`${dueThisWeek.length} this week`);
    const subject = `Maintenance Reminder: ${subjectParts.join(', ')}`;

    const P = '16px';
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
            <div style="font-size:20px;font-weight:700;color:#0a0a14;letter-spacing:-0.5px;">🔧 Maintenance Reminder</div>
            <div style="font-size:12px;color:#999;margin-top:4px;">${dateStr}</div>
          </td>
        </tr>

        <!-- Summary pills -->
        <tr>
          <td class="inner" style="padding:20px ${P} 12px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 auto;">
              <tr>
                ${overdue.length > 0 ? `
                <td style="padding:0 4px;">
                  <span style="display:inline-block;padding:6px 16px;border-radius:999px;background:#fef2f2;color:#dc2626;font-size:13px;font-weight:700;">
                    ${overdue.length} Overdue
                  </span>
                </td>` : ''}
                ${dueToday.length > 0 ? `
                <td style="padding:0 4px;">
                  <span style="display:inline-block;padding:6px 16px;border-radius:999px;background:#fffbeb;color:#d97706;font-size:13px;font-weight:700;">
                    ${dueToday.length} Due Today
                  </span>
                </td>` : ''}
                ${dueThisWeek.length > 0 ? `
                <td style="padding:0 4px;">
                  <span style="display:inline-block;padding:6px 16px;border-radius:999px;background:#fefce8;color:#ca8a04;font-size:13px;font-weight:700;">
                    ${dueThisWeek.length} This Week
                  </span>
                </td>` : ''}
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td class="inner" style="padding:0 ${P} 16px;"><div style="border-top:1px solid #f0f0f5;"></div></td></tr>

        <!-- Task sections -->
        <tr>
          <td class="inner" style="padding:0 ${P} 20px;">
            ${sections}
          </td>
        </tr>

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

    const { error: emailError } = await resend.emails.send({
      from: 'Maintenance Tracker <onboarding@resend.dev>',
      to: emailTo!,
      subject,
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: 'Failed to send email', details: emailError });
    }

    return res.status(200).json({
      ok: true,
      sent: true,
      counts: { overdue: overdue.length, dueToday: dueToday.length, dueThisWeek: dueThisWeek.length },
    });
  } catch (err) {
    console.error('Maintenance reminders error:', err);
    return res.status(500).json({ error: 'Internal error', details: String(err) });
  }
}
