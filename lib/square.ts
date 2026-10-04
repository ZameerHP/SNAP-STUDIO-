import { config, db, HttpError, result, row } from './studio-server';
import { verifiedPayment } from './square-core';
import { notifyStudio } from './providers';
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
  const attempt = await row('square_checkouts', String(order?.reference_id || ''));
  if (!attempt) return null;
  const check = verifiedPayment(payment, attempt, order, squareConfig().location);
  if (check.completed) {
    const before = await result<any>(db().from('payments').select('amount,refunded').eq('provider_id', payment.id).maybeSingle());
    await result(db().rpc('studio_record_square_payment', { p_attempt: attempt.id, p_payment: payment.id, p_order: order.id, p_refunded: check.refunded }));
    const after = await result<any>(db().from('payments').select('amount,refunded').eq('provider_id', payment.id).maybeSingle());
    if (after && (!before || after.refunded > before.refunded)) {
      const invoice = await row('invoices', attempt.invoice_id);
      if (invoice) {
        const [client, project] = await Promise.all([row('clients', invoice.client_id), row('projects', invoice.project_id)]);
        const context = `Client: ${client?.name || 'Unknown'} (${client?.email || 'No email'})\nProject: ${project?.title || 'Unknown'}\nInvoice: ${invoice.number}\n`;
        const money = (amount: number) => `${attempt.currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
        if (!before) await notifyStudio('Square payment received · ' + invoice.number, context + `Payment: ${money(after.amount)}\n\nOpen ${config().SITE_URL || 'your website'}/admin to view the invoice.`, 'studio-payment-' + payment.id);
        if (after.refunded > (before?.refunded || 0)) await notifyStudio('Square refund · ' + invoice.number, context + `Total refunded: ${money(after.refunded)}\n\nOpen ${config().SITE_URL || 'your website'}/admin to view the invoice.`, 'studio-refund-' + payment.id + '-' + after.refunded);
      }
    }
  }
  return { ...check, status: payment.status, invoiceId: attempt.invoice_id };
}
export async function restoreSquareLink(attempt: any) {
  if (attempt.link_id) return attempt;
  // The exact persisted request and idempotency key survive a network timeout or worker restart.
  const { payment_link: link } = await square('online-checkout/payment-links', 'POST', JSON.parse(attempt.request_json));
  if (!link?.id || !link.order_id || !link.url?.startsWith('https://')) throw new HttpError('Square returned an incomplete payment link.', 502);
  await result(db().from('square_checkouts').update({ link_id: link.id, order_id: link.order_id, url: link.url }).eq('id', attempt.id));
  await result(db().from('square_checkouts').update({ status: 'open' }).eq('id', attempt.id).eq('status', 'creating'));
  return { ...attempt, link_id: link.id, order_id: link.order_id, url: link.url };
}
