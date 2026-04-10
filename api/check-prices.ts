import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ── Price extraction ────────────────────────────────────────────────────

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, '').replace(/,(\d{2})$/, '.$1').replace(/,/g, '');
  const val = parseFloat(cleaned);
  if (!Number.isFinite(val) || val <= 0 || val > 100000) return null;
  return Math.round(val * 100) / 100;
}

function extractPrice(html: string): number | null {
  // Method 1: JSON-LD structured data
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const price = extractPriceFromJsonLd(data);
      if (price !== null) return price;
    } catch { /* skip invalid JSON */ }
  }

  // Method 2: Open Graph meta tags
  const ogPriceMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:price:amount|product:price:amount)["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:price:amount|product:price:amount)["']/i);
  if (ogPriceMatch) {
    const p = parsePrice(ogPriceMatch[1]);
    if (p !== null) return p;
  }

  // Method 3: Itemprop price
  const itemPropMatch = html.match(/<[^>]*itemprop=["']price["'][^>]*content=["']([^"']+)["']/i);
  if (itemPropMatch) {
    const p = parsePrice(itemPropMatch[1]);
    if (p !== null) return p;
  }

  // Method 4: Meta name="price"
  const metaPriceMatch = html.match(/<meta[^>]*name=["']price["'][^>]*content=["']([^"']+)["']/i);
  if (metaPriceMatch) {
    const p = parsePrice(metaPriceMatch[1]);
    if (p !== null) return p;
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPriceFromJsonLd(data: any): number | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const p = extractPriceFromJsonLd(item);
      if (p !== null) return p;
    }
    return null;
  }

  if (!data || typeof data !== 'object') return null;

  // Check if this is a Product or has offers
  const offers = data.offers;
  if (offers) {
    // Single offer
    if (offers.price != null) {
      const p = parsePrice(String(offers.price));
      if (p !== null) return p;
    }
    if (offers.lowPrice != null) {
      const p = parsePrice(String(offers.lowPrice));
      if (p !== null) return p;
    }
    // Array of offers
    if (Array.isArray(offers)) {
      for (const offer of offers) {
        if (offer.price != null) {
          const p = parsePrice(String(offer.price));
          if (p !== null) return p;
        }
        if (offer.lowPrice != null) {
          const p = parsePrice(String(offer.lowPrice));
          if (p !== null) return p;
        }
      }
    }
    // Nested offers (AggregateOffer)
    if (offers.offers) {
      return extractPriceFromJsonLd({ offers: offers.offers });
    }
  }

  // Direct price on the object
  if (data.price != null && (data['@type'] === 'Offer' || data['@type'] === 'Product')) {
    const p = parsePrice(String(data.price));
    if (p !== null) return p;
  }
  if (data.lowPrice != null) {
    const p = parsePrice(String(data.lowPrice));
    if (p !== null) return p;
  }

  // Recurse into @graph
  if (data['@graph']) return extractPriceFromJsonLd(data['@graph']);

  return null;
}

// ── Concurrency limiter ─────────────────────────────────────────────────

async function limitConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  for (const task of tasks) {
    const p = task().then(r => { results.push(r); });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(0, executing.length, ...executing.filter(e => {
        let done = false;
        e.then(() => { done = true; });
        return !done;
      }));
    }
  }
  await Promise.allSettled(executing);
  return results;
}

// ── Email template ──────────────────────────────────────────────────────

function buildEmailHtml(alerts: { giftName: string; recipientName: string; currentPrice: number; targetPrice: number; lowestPrice: number; url: string }[]): string {
  const alertCards = alerts.map(a => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
      <tr>
        <td style="background:#ffffff;border:1px solid #e8e8f0;border-radius:12px;padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:15px;font-weight:700;color:#0a0a14;padding-bottom:4px;">${a.giftName}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#888;padding-bottom:14px;">For ${a.recipientName}</td>
            </tr>
            <tr>
              <td style="padding-bottom:12px;">
                <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding-right:24px;">
                      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#999;margin-bottom:2px;">Current</div>
                      <div style="font-size:22px;font-weight:800;color:#16a34a;">$${a.currentPrice.toFixed(2)}</div>
                    </td>
                    <td style="padding-right:24px;">
                      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#999;margin-bottom:2px;">Target</div>
                      <div style="font-size:15px;font-weight:600;color:#0a0a14;">$${a.targetPrice.toFixed(2)}</div>
                    </td>
                    <td>
                      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#999;margin-bottom:2px;">Lowest</div>
                      <div style="font-size:15px;font-weight:600;color:#0a0a14;">$${a.lowestPrice.toFixed(2)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <a href="${a.url}" style="display:inline-block;background:#E31937;color:#ffffff;font-size:13px;font-weight:600;padding:8px 20px;border-radius:8px;text-decoration:none;">
                  View Product &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-collapse:collapse;">
          <!-- Header -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e8e8f0;border-radius:12px;padding:24px;margin-bottom:16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td>
                    <span style="font-size:20px;margin-right:8px;">&#128276;</span>
                    <span style="font-size:18px;font-weight:800;color:#0a0a14;letter-spacing:-0.02em;">Price Alert</span>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#888;padding-top:4px;">
                    ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:12px;"></td></tr>
          <!-- Alert cards -->
          <tr>
            <td>
              ${alertCards}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:16px 0 0;font-size:11px;color:#aaa;">
              Sent from your Budget Tracker
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

    // Fetch active alerts with gift info
    const { data: alertRows, error: alertErr } = await supabase
      .from('price_alerts')
      .select('*, gifts(idea, recipient_id)')
      .eq('is_active', true);

    if (alertErr) {
      return res.status(500).json({ error: 'Failed to fetch alerts', details: alertErr.message });
    }

    if (!alertRows || alertRows.length === 0) {
      return res.status(200).json({ message: 'No active alerts', checked: 0 });
    }

    // Fetch recipients for names
    const recipientIds = [...new Set(alertRows.map(a => a.gifts?.recipient_id).filter(Boolean))];
    const { data: recipientRows } = await supabase
      .from('gift_recipients')
      .select('id, name')
      .in('id', recipientIds);
    const recipientMap = new Map((recipientRows ?? []).map(r => [r.id, r.name]));

    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const emailAlerts: { giftName: string; recipientName: string; currentPrice: number; targetPrice: number; lowestPrice: number; url: string; alertId: string }[] = [];

    let successes = 0;
    let failures = 0;

    // Process alerts with concurrency limit
    await limitConcurrency(alertRows.map(alert => async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(alert.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PriceTracker/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
          throw new Error('Not HTML');
        }

        const html = await response.text();
        if (html.length < 1000) throw new Error('Response too small');

        const price = extractPrice(html);
        if (price === null) throw new Error('Price not found');

        // Success — update alert
        const currentLowest = alert.lowest_price != null ? Math.min(Number(alert.lowest_price), price) : price;

        await supabase.from('price_alerts').update({
          current_price: price,
          lowest_price: currentLowest,
          last_checked: now,
          consecutive_failures: 0,
          updated_at: now,
        }).eq('id', alert.id);

        successes++;

        // Check if we should trigger an email
        if (price <= Number(alert.target_price)) {
          const shouldAlert = !alert.last_alerted || alert.last_alerted < sevenDaysAgo;
          if (shouldAlert) {
            emailAlerts.push({
              giftName: alert.gifts?.idea ?? 'Unknown gift',
              recipientName: recipientMap.get(alert.gifts?.recipient_id) ?? 'Unknown',
              currentPrice: price,
              targetPrice: Number(alert.target_price),
              lowestPrice: currentLowest,
              url: alert.url,
              alertId: alert.id,
            });
          }
        }
      } catch {
        failures++;
        const newFailures = (alert.consecutive_failures ?? 0) + 1;
        await supabase.from('price_alerts').update({
          consecutive_failures: newFailures,
          last_checked: now,
          is_active: newFailures < 3,
          updated_at: now,
        }).eq('id', alert.id);
      }
    }), 5);

    // Send email if any alerts triggered
    if (emailAlerts.length > 0) {
      const html = buildEmailHtml(emailAlerts);

      await resend.emails.send({
        from: 'Budget Tracker <onboarding@resend.dev>',
        to: emailTo!,
        subject: `Price Alert: ${emailAlerts.length === 1 ? emailAlerts[0].giftName : `${emailAlerts.length} items dropped in price`}`,
        html,
      });

      // Update last_alerted for all triggered alerts
      await Promise.all(emailAlerts.map(a =>
        supabase.from('price_alerts').update({ last_alerted: now }).eq('id', a.alertId)
      ));
    }

    return res.status(200).json({
      message: 'Price check complete',
      checked: alertRows.length,
      successes,
      failures,
      alertsSent: emailAlerts.length,
    });
  } catch (err) {
    console.error('Price check error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
