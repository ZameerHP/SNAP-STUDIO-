import { body, failure, HttpError, invoiceAccess, json, now, db, result, row, sameOrigin, uid } from '@/lib/studio-server';
import { checkoutAmount, paymentLinkRequest } from '@/lib/square-core';
import { reconcileSquarePayment, restoreSquareLink, square, squareConfig } from '@/lib/square';
export async function POST(req: Request) {
  let lock = '', invoiceId = '';
  try {
    sameOrigin(req);
    const d = await body(req);
    const { invoice } = await invoiceAccess(String(d.id));
    invoiceId = invoice.id;
    const c = squareConfig();
    const acquiredLock = uid();
    const acquired = await result<boolean>(db().rpc('studio_acquire_checkout', { p_invoice: invoiceId, p_lock: acquiredLock, p_now: now(), p_expires: now() + 120000 }));
    if (!acquired) throw new HttpError('A payment request is already being prepared. Please try again shortly.', 409);
    lock = acquiredLock;
    // Read after acquiring the lock: another request or callback might have changed the balance.
    let { invoice: i } = await invoiceAccess(invoiceId);
    let amount = checkoutAmount(i as any, d.deposit === true);
    const { location } = await square('locations/' + encodeURIComponent(c.location));
    if (!location || location.status !== 'ACTIVE' || !location.capabilities?.includes('CREDIT_CARD_PROCESSING')) throw new HttpError('This Square location is not ready for online payments.', 503);
    if (location.currency !== i.currency.toUpperCase()) throw new HttpError('Invoice currency must match the studio’s Square location (' + location.currency + '). Contact the studio.');
    const existing = await result<any>(db().from('square_checkouts').select('*').eq('invoice_id', invoiceId).in('status', ['creating', 'open']).order('created_at', { ascending: false }).limit(1).maybeSingle());
    if (existing) {
      const attempt = await restoreSquareLink(existing);
      const { order } = await square('orders/' + encodeURIComponent(attempt.order_id));
      if (!order) throw new HttpError('Square order is unavailable.', 502);
      let pending = false;
      for (const tender of order.tenders || []) {
        const p = await reconcileSquarePayment(tender.payment_id || tender.id);
        if (p && ['APPROVED', 'PENDING'].includes(p.status)) pending = true;
      }
      if (pending) throw new HttpError('Your Square payment is processing. Please refresh shortly.', 409);
      if (order.state === 'COMPLETED') {
        const state = await row('square_checkouts', attempt.id);
        if (state?.status !== 'paid') throw new HttpError('Square is confirming your payment. Please refresh shortly.', 409);
        ({ invoice: i } = await invoiceAccess(invoiceId));
        amount = checkoutAmount(i as any, d.deposit === true);
      } else if (order.state === 'CANCELED') {
        await result(db().from('square_checkouts').update({ status: 'cancelled' }).eq('id', attempt.id).neq('status', 'paid'));
      } else {
        if (attempt.amount === amount && attempt.paid_before === i.paid) return json({ url: attempt.url });
        // Square atomically cancels the old order when the link is deleted. Fail closed on errors.
        await square('online-checkout/payment-links/' + encodeURIComponent(attempt.link_id), 'DELETE');
        await result(db().from('square_checkouts').update({ status: 'cancelled' }).eq('id', attempt.id).neq('status', 'paid'));
        ({ invoice: i } = await invoiceAccess(invoiceId));
        amount = checkoutAmount(i as any, d.deposit === true);
      }
    }
    const id = 'ss_' + uid();
    const request = paymentLinkRequest({ id, number: i.number, amount, currency: i.currency, location: c.location, origin: c.origin, email: i.client_email });
    await result(db().from('square_checkouts').insert({ id, invoice_id: invoiceId, amount, currency: i.currency, paid_before: i.paid, request_json: JSON.stringify(request), status: 'creating', created_at: now() }));
    const link = await restoreSquareLink({ id, invoice_id: invoiceId, request_json: JSON.stringify(request) });
    await result(db().from('invoices').update({ checkout_id: link.link_id, checkout_url: link.url, checkout_amount: amount }).eq('id', invoiceId).eq('checkout_lock', lock));
    return json({ url: link.url });
  } catch (e) {
    if (e instanceof Error && ['This invoice is already paid.', 'Invalid invoice balance.'].includes(e.message)) return failure(new HttpError(e.message));
    return failure(e);
  } finally {
    if (lock && invoiceId) await result(db().from('invoices').update({ checkout_lock: null }).eq('id', invoiceId).eq('checkout_lock', lock)).catch(() => {});
  }
}
