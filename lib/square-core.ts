/** Pure payment rules shared by the Square adapter and its regression checks. */
export function checkoutAmount(invoice: { total: number; paid: number; deposit: number }, deposit: boolean) {
  const { total, paid } = invoice;
  if (![total, paid, invoice.deposit].every(Number.isSafeInteger) || total < 1 || paid < 0) throw new Error('Invalid invoice balance.');
  const balance = total - paid;
  if (balance <= 0) throw new Error('This invoice is already paid.');
  return deposit && invoice.deposit > paid ? Math.min(invoice.deposit - paid, balance) : balance;
}
export function paymentLinkRequest(input: { id: string; number: string; amount: number; currency: string; location: string; origin: string; email: string }) {
  return {
    idempotency_key: input.id,
    order: { location_id: input.location, reference_id: input.id, line_items: [{ name: 'Super Snap Studio · ' + input.number, quantity: '1', base_price_money: { amount: input.amount, currency: input.currency.toUpperCase() } }] },
    checkout_options: { allow_tipping: false, ask_for_shipping_address: false, redirect_url: input.origin + '/client?payment=processing' },
    pre_populated_data: { buyer_email: input.email },
    payment_note: 'Super Snap Studio invoice ' + input.number,
  };
}
export async function squareSignature(secret: string, notificationUrl: string, raw: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(notificationUrl + raw)));
  return btoa(String.fromCharCode(...bytes));
}
export function verifiedPayment(payment: any, attempt: any, order: any, location: string) {
  if (!payment?.id || !order?.id || payment.order_id !== order.id || order.reference_id !== attempt.id ||
    (attempt.order_id && attempt.order_id !== order.id) || payment.location_id !== location || order.location_id !== location ||
    payment.amount_money?.currency !== attempt.currency.toUpperCase() || payment.amount_money?.amount !== attempt.amount ||
    order.total_money?.amount !== attempt.amount || order.total_money?.currency !== attempt.currency.toUpperCase() ||
    (payment.tip_money?.amount || 0) !== 0) throw new Error('Square payment does not match this invoice.');
  const refunded = payment.refunded_money?.amount || 0;
  if (!Number.isSafeInteger(refunded) || refunded < 0 || refunded > attempt.amount ||
    (payment.refunded_money && payment.refunded_money.currency !== attempt.currency.toUpperCase())) throw new Error('Invalid Square refund amount.');
  return { completed: payment.status === 'COMPLETED', refunded };
}
