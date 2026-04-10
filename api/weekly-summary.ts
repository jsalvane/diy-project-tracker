import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ── Helpers ───────────────────���──────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function billDueGroup(billDueDate: string | null): '15' | '30' | '' {
  if (!billDueDate) return '';
  if (billDueDate.endsWith('-15')) return '15';
  if (billDueDate.endsWith('-30')) return '30';
  return '';
}

// ── Main handler ─────────────────────────────��───────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Protect endpoint: only allow Vercel Cron (sends CRON_SECRET) or manual trigger with auth
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

  if (!supabaseUrl || !supabaseKey || !resendKey || !emailTo) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const resend = new Resend(resendKey);

  try {
    // Fetch all data in parallel
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

    // Split budget items by due group
    const bills15 = (items ?? []).filter((i: { due_group: string }) => i.due_group === '15');
    const bills30 = (items ?? []).filter((i: { due_group: string }) => i.due_group === '30');

    // Split credit cards by due group
    const cc15 = (cards ?? []).filter((c: { bill_due_date: string | null }) => billDueGroup(c.bill_due_date) === '15');
    const cc30 = (cards ?? []).filter((c: { bill_due_date: string | null }) => billDueGroup(c.bill_due_date) === '30');

    // Compute totals for each group
    const billTotal15 = bills15.reduce((s: number, i: { payment: number }) => s + (i.payment ?? 0), 0)
      + cc15.reduce((s: number, c: { balance: number }) => s + (c.balance ?? 0), 0);
    const billTotal30 = bills30.reduce((s: number, i: { payment: number }) => s + (i.payment ?? 0), 0)
      + cc30.reduce((s: number, c: { balance: number }) => s + (c.balance ?? 0), 0);

    const surplus15 = income15 - billTotal15;
    const surplus30 = income30 - billTotal30;

    // Loans
    const totalLoanDebt = (loansData ?? []).reduce((s: number, l: { balance: number }) => s + (l.balance ?? 0), 0);

    // Subscriptions: monthly cost
    const monthlySubCost = (subsData ?? []).reduce((s: number, sub: { amount: number; frequency: string }) => {
      return s + (sub.frequency === 'annual' ? (sub.amount ?? 0) / 12 : (sub.amount ?? 0));
    }, 0);

    // Total credit card balances
    const totalCcBalance = (cards ?? []).reduce((s: number, c: { balance: number }) => s + (c.balance ?? 0), 0);

    // ── Build HTML email ─────────────���────────────────────────────────────

    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    function billRows(billItems: { name: string; payment: number }[], ccItems: { name: string; balance: number }[]): string {
      let html = '';
      for (const b of billItems) {
        html += `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${b.name}</td><td style="padding:6px 12px;text-align:right;border-bottom:1px solid #f0f0f0;">${fmt(b.payment ?? 0)}</td></tr>`;
      }
      if (ccItems.length > 0) {
        html += `<tr><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;">Credit Cards</td></tr>`;
        for (const c of ccItems) {
          html += `<tr><td style="padding:6px 12px 6px 24px;border-bottom:1px solid #f0f0f0;">${c.name}</td><td style="padding:6px 12px;text-align:right;border-bottom:1px solid #f0f0f0;">${fmt(c.balance ?? 0)}</td></tr>`;
        }
      }
      return html;
    }

    function sectionHtml(label: string, income: number, billItems: { name: string; payment: number }[], ccItems: { name: string; balance: number }[], total: number, surplus: number): string {
      const surplusColor = surplus >= 0 ? '#22c55e' : '#ef4444';
      return `
        <div style="margin-bottom:32px;">
          <h2 style="font-size:16px;font-weight:700;color:#0a0a14;margin:0 0 12px;">Due ${label}th</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
            <thead>
              <tr style="background:#f8f8fc;">
                <th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600;">Name</th>
                <th style="text-align:right;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${billRows(billItems, ccItems)}
            </tbody>
            <tfoot>
              <tr style="background:#f8f8fc;font-weight:700;">
                <td style="padding:10px 12px;">Total Bills</td>
                <td style="padding:10px 12px;text-align:right;">${fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
          <div style="display:flex;gap:16px;margin-top:12px;">
            <div style="flex:1;background:#f8f8fc;border-radius:8px;padding:12px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Income</div>
              <div style="font-size:18px;font-weight:700;color:#0a0a14;">${fmt(income)}</div>
            </div>
            <div style="flex:1;background:#f8f8fc;border-radius:8px;padding:12px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Surplus</div>
              <div style="font-size:18px;font-weight:700;color:${surplusColor};">${fmt(surplus)}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Loan rows
    let loanHtml = '';
    if ((loansData ?? []).length > 0) {
      let rows = '';
      for (const l of (loansData ?? []) as { name: string; balance: number }[]) {
        rows += `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${l.name}</td><td style="padding:6px 12px;text-align:right;border-bottom:1px solid #f0f0f0;">${fmt(l.balance ?? 0)}</td></tr>`;
      }
      loanHtml = `
        <div style="margin-bottom:32px;">
          <h2 style="font-size:16px;font-weight:700;color:#0a0a14;margin:0 0 12px;">Loans</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:#f8f8fc;font-weight:700;">
                <td style="padding:10px 12px;">Total Loan Debt</td>
                <td style="padding:10px 12px;text-align:right;">${fmt(totalLoanDebt)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }

    const totalIncome = income15 + income30;
    const totalBills = billTotal15 + billTotal30;
    const totalSurplus = totalIncome - totalBills;
    const totalDebt = totalLoanDebt + totalCcBalance;
    const surplusColor = totalSurplus >= 0 ? '#22c55e' : '#ef4444';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:20px;font-weight:700;color:#0a0a14;margin:0 0 4px;">Weekly Budget Summary</h1>
        <p style="font-size:13px;color:#999;margin:0;">${dateStr}</p>
      </div>

      <!-- Snapshot cards -->
      <div style="display:flex;gap:12px;margin-bottom:28px;">
        <div style="flex:1;background:#f8f8fc;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Total Income</div>
          <div style="font-size:20px;font-weight:700;color:#0a0a14;">${fmt(totalIncome)}</div>
        </div>
        <div style="flex:1;background:#f8f8fc;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Total Bills</div>
          <div style="font-size:20px;font-weight:700;color:#0a0a14;">${fmt(totalBills)}</div>
        </div>
        <div style="flex:1;background:#f8f8fc;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px;">Surplus</div>
          <div style="font-size:20px;font-weight:700;color:${surplusColor};">${fmt(totalSurplus)}</div>
        </div>
      </div>

      ${sectionHtml('15', income15, bills15, cc15, billTotal15, surplus15)}
      ${sectionHtml('30', income30, bills30, cc30, billTotal30, surplus30)}
      ${loanHtml}

      <!-- Bottom stats -->
      <div style="border-top:1px solid #f0f0f0;padding-top:16px;margin-top:8px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:6px;">
          <span>Total Debt (Loans + CC)</span>
          <span style="font-weight:700;color:#0a0a14;">${fmt(totalDebt)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:6px;">
          <span>Monthly Subscriptions</span>
          <span style="font-weight:700;color:#0a0a14;">${fmt(monthlySubCost)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;">
          <span>Active CC Balances</span>
          <span style="font-weight:700;color:#0a0a14;">${fmt(totalCcBalance)}</span>
        </div>
      </div>

    </div>

    <p style="text-align:center;font-size:11px;color:#bbb;margin-top:16px;">
      Sent from your Budget Tracker
    </p>
  </div>
</body>
</html>
    `;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'Budget Tracker <onboarding@resend.dev>',
      to: emailTo,
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
        income: totalIncome,
        bills: totalBills,
        surplus: totalSurplus,
        debt: totalDebt,
      },
    });
  } catch (err) {
    console.error('Weekly summary error:', err);
    return res.status(500).json({ error: 'Internal error', details: String(err) });
  }
}
