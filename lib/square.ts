import { config, db, HttpError, now, one, run, uid } from './studio-server';
import { verifiedPayment } from './square-core';
export function squareConfig() {
  const e = config();
  if (!e.SQUARE_ACCESS_TOKEN || !e.SQUARE_LOCATION_ID || !e.SQUARE_WEBHOOK_SIGNATURE_KEY || !e.SQUARE_WEBHOOK_URL || !e.SITE_URL || !['sandbox', 'production'].includes(e.SQUARE_ENVIRONMENT || '')) throw new HttpError('Square payments are awaiting connection. Contact the studio to arrange payment.', 503);
  let origin: URL, webhook: URL;
  try { origin = new URL(e.SITE_URL); webhook = new URL(e.SQUARE_WEBHOOK_URL); } catch { throw new HttpError('Square website settings need attention.', 503); }
  if (origin.protocol !== 'https:' || webhook.href !== origin.origin + '/api/webhooks/square') throw new HttpError('Square webhook URL must match this website.', 503);
  return { token: e.SQUARE_ACCESS_TOKEN, location: e.SQUARE_LOCATION_ID, secret: e.SQUARE_WEBHOOK_SIGNATURE_KEY, webhook: e.SQUARE_WEBHOOK_URL, origin: origin.origin, base: e.SQUARE_ENVIRONMENT === 'production' ? 'https://connect.squareup.com/v2/' : 'https://connect.squareupsandbox.com/v2/' };
}
export async function square(path: string, method = 'GET', data?: unknown) {
  const c = squareConfig();
  const response = await fetch(c.base + path, { method, headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json', 'Square-Version': '2026-09-16' }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(12000) });
  const result: any = await response.json();
  if (!response.ok) throw new HttpError('Square could not complete the request. Please retry or contact the studio.', response.status === 404 ? 404 : 502);
  return result;
}
/** Re-fetch from Square; callbacks and return URLs never supply trusted amounts. */
export async function reconcileSquarePayment(paymentId: string) {
  const { payment } = await square('payments/' + encodeURIComponent(paymentId));
  if (!payment?.order_id) return null; // Unrelated in-person payments do not belong to these invoices.
  const { order } = await square('orders/' + encodeURIComponent(payment.order_id));
  const attempt = await one('SELECT * FROM square_checkouts WHERE id=?', String(order?.reference_id || ''));
  if (!attempt) return null;
  const check = verifiedPayment(payment, attempt, order, squareConfig().location);
  if (check.completed) {
    await db().batch([
      db().prepare('INSERT INTO payments (id,invoice_id,provider_id,amount,currency,refunded,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(provider_id) DO UPDATE SET refunded=MAX(payments.refunded,excluded.refunded)').bind(uid(), attempt.invoice_id, 'square:' + payment.id, attempt.amount, attempt.currency, check.refunded, now()),
      db().prepare("UPDATE square_checkouts SET status='paid',order_id=? WHERE id=?").bind(order.id, attempt.id),
      db().prepare('UPDATE invoices SET checkout_id=NULL,checkout_url=NULL WHERE id=? AND checkout_id=?').bind(attempt.invoice_id, attempt.link_id),
    ]);
  }
  return { ...check, status: payment.status, invoiceId: attempt.invoice_id };
}
export async function restoreSquareLink(attempt: any) {
  if (attempt.link_id) return attempt;
  // The exact persisted request and idempotency key survive a network timeout or worker restart.
  const { payment_link: link } = await square('online-checkout/payment-links', 'POST', JSON.parse(attempt.request_json));
  if (!link?.id || !link.order_id || !link.url?.startsWith('https://')) throw new HttpError('Square returned an incomplete payment link.', 502);
  await run("UPDATE square_checkouts SET link_id=?,order_id=?,url=?,status=CASE WHEN status='paid' THEN status ELSE 'open' END WHERE id=?", link.id, link.order_id, link.url, attempt.id);
  return { ...attempt, link_id: link.id, order_id: link.order_id, url: link.url };
}
