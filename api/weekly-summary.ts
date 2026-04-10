import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function pct(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function billDueGroup(billDueDate: string | null): '15' | '30' | '' {
  if (!billDueDate) return '';
  if (billDueDate.endsWith('-15')) return '15';
  if (billDueDate.endsWith('-30')) return '30';
  return '';
}

/** CSS horizontal bar — works in all email clients via table cell background */
function bar(percent: number, color: string, height = 8): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="background:${color};width:${percent}%;height:${height}px;border-radius:4px 0 0 4px;"></td>
        <td style="background:#f0f0f5;height:${height}px;border-radius:0 4px 4px 0;"></td>
      </tr>
    </table>`;
}

/** Stacked bar with multiple segments */
function stackedBar(segments: { pct: number; color: string }[], height = 10): string {
  let cells = '';
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.pct <= 0) continue;
    const radiusL = i === 0 ? '5px 0 0 5px' : '0';
    const radiusR = i === segments.length - 1 ? '0 5px 5px 0' : '0';
    cells += `<td style="background:${s.color};width:${s.pct}%;height:${height}px;border-radius:${radiusL};border-radius:${radiusR};"></td>`;
  }
  // Fill remaining with gray
  const usedPct = segments.reduce((s, seg) => s + seg.pct, 0);
  if (usedPct < 100) {
    cells += `<td style="background:#f0f0f5;height:${height}px;border-radius:0 5px 5px 0;"></td>`;
  }
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${cells}</tr></table>`;
}

// ── Main handler ─────────────────────────────────────────────────────────

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

    // Fetch all data
    const [
      { data: settings },
      { data: items },
      { data: cards },
      { data: loansData },
      { data: subsData },
    ] = await Promise.all([
      supabase.from('budget_settings').select('key, value'),
      supabase.from('budget_items').select('*').order('sort_order'),
      supabase.from('credit_cards').select('*').eq('status', 'active').order('sort_order'),
      supabase.from('loans').select('*').order('sort_order'),
      supabase.from('subscriptions').select('*').eq('status', 'active'),
    ]);

    // Parse settings
    const settingsMap = new Map((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const income15 = parseFloat(settingsMap.get('income_15') ?? '0') || 0;
    const income30 = parseFloat(settingsMap.get('income_30') ?? '0') || 0;

    // Split by due group
    const bills15 = (items ?? []).filter((i: { due_group: string }) => i.due_group === '15');
    const bills30 = (items ?? []).filter((i: { due_group: string }) => i.due_group === '30');
    const cc15 = (cards ?? []).filter((c: { bill_due_date: string | null }) => billDueGroup(c.bill_due_date) === '15');
    const cc30 = (cards ?? []).filter((c: { bill_due_date: string | null }) => billDueGroup(c.bill_due_date) === '30');

    const billTotal15 = bills15.reduce((s: number, i: { payment: number }) => s + (i.payment ?? 0), 0)
      + cc15.reduce((s: number, c: { balance: number }) => s + (c.balance ?? 0), 0);
    const billTotal30 = bills30.reduce((s: number, i: { payment: number }) => s + (i.payment ?? 0), 0)
      + cc30.reduce((s: number, c: { balance: number }) => s + (c.balance ?? 0), 0);

    const surplus15 = income15 - billTotal15;
    const surplus30 = income30 - billTotal30;

    const totalLoanDebt = (loansData ?? []).reduce((s: number, l: { balance: number }) => s + (l.balance ?? 0), 0);
    const monthlySubCost = (subsData ?? []).reduce((s: number, sub: { amount: number; frequency: string }) => {
      return s + (sub.frequency === 'annual' ? (sub.amount ?? 0) / 12 : (sub.amount ?? 0));
    }, 0);
    const totalCcBalance = (cards ?? []).reduce((s: number, c: { balance: number }) => s + (c.balance ?? 0), 0);

    const totalIncome = income15 + income30;
    const totalBills = billTotal15 + billTotal30;
    const totalSurplus = totalIncome - totalBills;
    const totalDebt = totalLoanDebt + totalCcBalance;

    // ── Build visual HTML email ──────────────────────────────────────────

    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const surplusColor = totalSurplus >= 0 ? '#22c55e' : '#ef4444';
    const surplus15Color = surplus15 >= 0 ? '#22c55e' : '#ef4444';
    const surplus30Color = surplus30 >= 0 ? '#22c55e' : '#ef4444';
    const billsPct = pct(totalBills, totalIncome);

    // Build bill line items for each section
    function billLines(billItems: { name: string; payment: number }[], ccItems: { name: string; balance: number }[], income: number): string {
      const allItems = [
        ...billItems.map(b => ({ name: b.name, amount: Math.round(b.payment ?? 0), isCC: false })),
        ...ccItems.map(c => ({ name: c.name, amount: Math.round(c.balance ?? 0), isCC: true })),
      ];
      const maxAmount = Math.max(...allItems.map(i => i.amount), 1);

      return allItems.map(item => {
        const barPct = pct(item.amount, income > 0 ? income : maxAmount);
        const barColor = item.isCC ? '#8b5cf6' : '#3b82f6';
        return `
          <tr>
            <td style="padding:4px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="font-size:13px;color:#555;padding-bottom:2px;">
                    ${item.isCC ? '<span style="color:#8b5cf6;font-size:10px;font-weight:600;letter-spacing:0.5px;">CC</span> ' : ''}${item.name}
                  </td>
                  <td style="font-size:13px;font-weight:600;color:#0a0a14;text-align:right;padding-bottom:2px;white-space:nowrap;">
                    ${fmt(item.amount)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-bottom:6px;">
                    ${bar(barPct, barColor, 6)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      }).join('');
    }

    // Due section with visual bars
    function sectionBlock(label: string, income: number, billItems: { name: string; payment: number }[], ccItems: { name: string; balance: number }[], total: number, surplus: number): string {
      const sColor = surplus >= 0 ? '#22c55e' : '#ef4444';
      const usedPct = pct(total, income);
      return `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
          <tr>
            <td style="padding-bottom:12px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="font-size:15px;font-weight:700;color:#0a0a14;">Due ${label}th</td>
                  <td style="text-align:right;">
                    <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">
                      ${usedPct}% used
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:14px;">
              ${bar(usedPct, usedPct > 90 ? '#ef4444' : usedPct > 75 ? '#f59e0b' : '#3b82f6', 10)}
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:14px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td width="50%" style="padding-right:6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8f8fc;border-radius:8px;">
                      <tr><td style="padding:10px 14px;">
                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:2px;">Income</div>
                        <div style="font-size:20px;font-weight:700;color:#0a0a14;">${fmt(income)}</div>
                      </td></tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left:6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8f8fc;border-radius:8px;">
                      <tr><td style="padding:10px 14px;">
                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:2px;">Surplus</div>
                        <div style="font-size:20px;font-weight:700;color:${sColor};">${fmt(surplus)}</div>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${billLines(billItems, ccItems, income)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8f8fc;border-radius:6px;">
                <tr>
                  <td style="padding:8px 14px;font-size:13px;font-weight:700;color:#555;">Total Bills</td>
                  <td style="padding:8px 14px;font-size:13px;font-weight:700;color:#0a0a14;text-align:right;">${fmt(total)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    }

    // Loans section
    let loanBlock = '';
    if ((loansData ?? []).length > 0) {
      const loans = (loansData ?? []) as { name: string; balance: number }[];
      const maxLoan = Math.max(...loans.map(l => l.balance ?? 0), 1);
      let loanRows = '';
      for (const l of loans) {
        const bal = Math.round(l.balance ?? 0);
        loanRows += `
          <tr>
            <td style="padding:4px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="font-size:13px;color:#555;padding-bottom:2px;">${l.name}</td>
                  <td style="font-size:13px;font-weight:600;color:#0a0a14;text-align:right;padding-bottom:2px;white-space:nowrap;">${fmt(bal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-bottom:6px;">
                    ${bar(pct(bal, maxLoan), '#f59e0b', 6)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      }
      loanBlock = `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
          <tr>
            <td style="font-size:15px;font-weight:700;color:#0a0a14;padding-bottom:12px;">Loans</td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${loanRows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8f8fc;border-radius:6px;">
                <tr>
                  <td style="padding:8px 14px;font-size:13px;font-weight:700;color:#555;">Total Debt</td>
                  <td style="padding:8px 14px;font-size:13px;font-weight:700;color:#0a0a14;text-align:right;">${fmt(totalLoanDebt)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    }

    // Budget allocation donut (faked with a horizontal stacked bar)
    const billsPctOfIncome = pct(totalBills, totalIncome);
    const subsPctOfIncome = pct(monthlySubCost, totalIncome);
    const surplusPctOfIncome = Math.max(0, 100 - billsPctOfIncome - subsPctOfIncome);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#f8f8fc;padding:28px 32px;text-align:center;border-bottom:2px solid #e8e8f0;">
            <div style="font-size:22px;font-weight:700;color:#0a0a14;letter-spacing:-0.5px;">Weekly Budget Summary</div>
            <div style="font-size:12px;color:#999;margin-top:4px;">${dateStr}</div>
          </td>
        </tr>

        <!-- Big numbers -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td width="33%" style="text-align:center;padding:12px 4px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Income</div>
                  <div style="font-size:26px;font-weight:800;color:#0a0a14;">${fmt(totalIncome)}</div>
                </td>
                <td width="33%" style="text-align:center;padding:12px 4px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Bills</div>
                  <div style="font-size:26px;font-weight:800;color:#0a0a14;">${fmt(totalBills)}</div>
                </td>
                <td width="33%" style="text-align:center;padding:12px 4px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Surplus</div>
                  <div style="font-size:26px;font-weight:800;color:${surplusColor};">${fmt(totalSurplus)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Allocation bar -->
        <tr>
          <td style="padding:16px 32px 8px;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px;">Where your money goes</div>
            ${stackedBar([
              { pct: billsPctOfIncome, color: '#3b82f6' },
              { pct: subsPctOfIncome, color: '#8b5cf6' },
              { pct: surplusPctOfIncome, color: '#22c55e' },
            ], 14)}
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;">
              <tr>
                <td style="font-size:10px;color:#3b82f6;">Bills ${billsPctOfIncome}%</td>
                <td style="font-size:10px;color:#8b5cf6;text-align:center;">Subs ${subsPctOfIncome}%</td>
                <td style="font-size:10px;color:#22c55e;text-align:right;">Surplus ${surplusPctOfIncome}%</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:12px 32px;"><div style="border-top:1px solid #f0f0f5;"></div></td></tr>

        <!-- Due 15th -->
        <tr>
          <td style="padding:0 32px;">
            ${sectionBlock('15', income15, bills15, cc15, billTotal15, surplus15)}
          </td>
        </tr>

        <!-- Due 30th -->
        <tr>
          <td style="padding:0 32px;">
            ${sectionBlock('30', income30, bills30, cc30, billTotal30, surplus30)}
          </td>
        </tr>

        <!-- Loans -->
        ${loanBlock ? `<tr><td style="padding:0 32px;">${loanBlock}</td></tr>` : ''}

        <!-- Bottom stats -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8f8fc;border-radius:8px;">
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #eeeef5;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-size:13px;color:#666;">Total Debt</td>
                      <td style="font-size:15px;font-weight:700;color:#0a0a14;text-align:right;">${fmt(totalDebt)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #eeeef5;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-size:13px;color:#666;">Subscriptions</td>
                      <td style="font-size:15px;font-weight:700;color:#0a0a14;text-align:right;">${fmt(monthlySubCost)}<span style="font-size:11px;font-weight:400;color:#999;">/mo</span></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-size:13px;color:#666;">CC Balances</td>
                      <td style="font-size:15px;font-weight:700;color:#0a0a14;text-align:right;">${fmt(totalCcBalance)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <table width="560" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding:16px 0;font-size:11px;color:#bbb;">
            Sent from your Budget Tracker
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'Budget Tracker <onboarding@resend.dev>',
      to: emailTo!,
      subject: `Weekly Budget Summary - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: 'Failed to send email', details: emailError });
    }

    return res.status(200).json({
      ok: true,
      summary: {
        income: Math.round(totalIncome),
        bills: Math.round(totalBills),
        surplus: Math.round(totalSurplus),
        debt: Math.round(totalDebt),
      },
    });
  } catch (err) {
    console.error('Weekly summary error:', err);
    return res.status(500).json({ error: 'Internal error', details: String(err) });
  }
}
