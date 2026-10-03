import 'server-only';
import { adminDb } from './supabase/admin';
import { getStudioUser } from './auth';
import { ownerEmailMatches } from './auth-rules';
export type Row = Record<string, any>;
export const config = () => process.env;
export class HttpError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function db() { return adminDb(); }
export const uid = () => crypto.randomUUID(), now = () => Date.now();
export async function result<T = any>(query: PromiseLike<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await query;
  if (error) { console.error('Database operation failed', error.code); throw new HttpError('Unable to save or load studio data. Check Supabase setup or try again.', 503); }
  return data as T;
}
export const row = (table: string, id: string) => result<Row | null>(db().from(table).select('*').eq('id', id).maybeSingle());
export const isOwner = (email: string) => ownerEmailMatches(email, config().OWNER_EMAIL);
export async function identity(ownerOnly = false) {
  const user = await getStudioUser();
  if (!user) throw new HttpError('Please sign in to continue.', 401);
  const owner = isOwner(user.email);
  if (ownerOnly && !owner) throw new HttpError('Studio owner access required.', 403);
  let client: Row | null = null;
  if (!owner) {
    client = await result(db().from('clients').select('*').eq('user_id', user.userId).maybeSingle());
    if (!client) {
      await result(db().from('clients').update({ user_id: user.userId }).eq('email', user.email).is('user_id', null));
      client = await result(db().from('clients').select('*').eq('user_id', user.userId).maybeSingle());
    }
  }
  return { user, owner, client };
}
export async function projectAccess(id: string) {
  const w = await identity(), project = await row('projects', id);
  if (!project || (!w.owner && project.client_id !== w.client?.id)) throw new HttpError('Project not found.', 404);
  return { ...w, project };
}
export async function invoiceAccess(id: string) {
  const w = await identity(), invoice = await row('invoices', id);
  if (!invoice || (!w.owner && invoice.client_id !== w.client?.id)) throw new HttpError('Invoice not found.', 404);
  const [client, payments] = await Promise.all([row('clients', invoice.client_id), result<Row[]>(db().from('payments').select('amount,refunded').eq('invoice_id', id))]);
  return { ...w, invoice: { ...invoice, client_name: client?.name, client_email: client?.email, paid: payments.reduce((n, p) => n + Number(p.amount) - Number(p.refunded), 0) } as Row };
}
export function sameOrigin(req: Request) { if (req.headers.get('origin') !== new URL(req.url).origin) throw new HttpError('Request origin is not allowed.', 403); }
export async function body(req: Request) { const text = await req.text(); if (text.length > 25000) throw new HttpError('Request is too large.', 413); try { return JSON.parse(text) as Row; } catch { throw new HttpError('Invalid request.'); } }
export function str(v: unknown, max = 4000, required = true) { if (typeof v !== 'string' || v.trim().length > max || (required && !v.trim())) throw new HttpError('Please check the required fields.'); return v.trim(); }
export function email(v: unknown) { const s = str(v, 254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new HttpError('Please enter a valid email address.'); return s; }
export function integer(v: unknown, min = 0, max = 100000000) { const n = Number(v); if (!Number.isSafeInteger(n) || n < min || n > max) throw new HttpError('Please enter a valid amount.'); return n; }
export async function log(actor: string, action: string, resource: string) { await result(db().from('audit').insert({ id: uid(), actor, action, resource, created_at: now() })); }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function failure(e: unknown) { if (e instanceof HttpError) return json({ error: e.message }, e.status); console.error('Studio request failed', e instanceof Error ? e.message : 'Unknown error'); return json({ error: 'Unable to complete this request. Please check setup or try again.' }, 503); }
export function integrations() { const e = config(); return { payments: !!(e.SQUARE_ACCESS_TOKEN && e.SQUARE_LOCATION_ID && e.SQUARE_WEBHOOK_SIGNATURE_KEY && e.SQUARE_WEBHOOK_URL && e.SITE_URL && ['sandbox', 'production'].includes(e.SQUARE_ENVIRONMENT || '')), email: !!(e.RESEND_API_KEY && e.EMAIL_FROM), inbound: !!(e.RESEND_API_KEY && e.RESEND_WEBHOOK_SECRET), signatures: !!(e.DOCUSEAL_API_KEY && e.DOCUSEAL_WEBHOOK_SECRET) }; }
