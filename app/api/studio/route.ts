import { body, db, email, failure, HttpError, identity, integer, integrations, json, log, now, projectAccess, result, row, str, uid, sameOrigin, type Row } from '@/lib/studio-server';
import { sendEmail, requestSignature } from '@/lib/providers';
export async function GET() {
  try {
    const w = await identity(), cid = w.client?.id || 'unassigned';
    const scoped = (table: string) => { let q = db().from(table).select('*'); if (!w.owner) q = q.eq('client_id', cid); return result<Row[]>(q.order('created_at', { ascending: false }).limit(500)); };
    const [projects, invoices, documents, messages, clients, enquiries, settings] = await Promise.all([
      scoped('projects'), scoped('invoices'), scoped('documents'), scoped('messages'),
      w.owner ? result<Row[]>(db().from('clients').select('*').order('created_at', { ascending: false }).limit(1000)) : [],
      w.owner ? result<Row[]>(db().from('enquiries').select('*').order('created_at', { ascending: false }).limit(200)) : [],
      w.owner ? result<Row[]>(db().from('settings').select('*')) : [],
    ]);
    const ids = projects.map(p => p.id), invoiceIds = invoices.map(i => i.id);
    const [media, favorites, payments] = await Promise.all([
      ids.length ? result<Row[]>(db().from('media').select('id,project_id,name,type,size,position,created_at').in('project_id', ids).order('position').order('created_at').limit(1000)) : [],
      w.owner ? result<Row[]>(db().from('favorites').select('media_id').limit(10000)) : result<Row[]>(db().from('favorites').select('media_id').eq('client_id', cid).limit(10000)),
      invoiceIds.length ? result<Row[]>(db().from('payments').select('invoice_id,amount,refunded').in('invoice_id', invoiceIds).limit(10000)) : [],
    ]);
    const clientMap = new Map(clients.map(c => [c.id, c]));
    const safeInvoices = invoices.map(i => {
      const p = payments.filter(p => p.invoice_id === i.id);
      const { checkout_id, checkout_url, checkout_lock, checkout_expires, ...safe } = i;
      return { ...safe, client_name: clientMap.get(i.client_id)?.name, paid: p.reduce((n, p) => n + p.amount - p.refunded, 0), refunded: p.reduce((n, p) => n + p.refunded, 0) };
    });
    return json({ owner: w.owner, user: { name: w.user.displayName, email: w.user.email }, projects: projects.map(p => ({ ...p, client_name: clientMap.get(p.client_id)?.name, media_count: media.filter(m => m.project_id === p.id).length })), media: media.map(m => ({ ...m, favorite: favorites.some(f => f.media_id === m.id) })), invoices: safeInvoices, documents, messages, clients, enquiries, settings, integrations: integrations() });
  } catch (e) { return failure(e); }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req); const w = await identity(), d = await body(req), action = str(d.action, 50); let resource = uid();
    if (action === 'favorite') {
      const m = await row('media', str(d.id, 100)); if (!m) throw new HttpError('Image not found.', 404);
      await projectAccess(m.project_id); if (w.owner || !w.client) throw new HttpError('Favourites belong to client accounts.', 403);
      await result(db().rpc('studio_favorite', { p_client: w.client.id, p_media: m.id, p_selected: d.selected === true })); return json({ ok: true });
    }
    if (action === 'submitSelections') { const { project } = await projectAccess(str(d.id, 100)); if (w.owner) throw new HttpError('Selections are submitted by clients.'); await result(db().from('projects').update({ selections_submitted: 1 }).eq('id', project.id)); return json({ ok: true }); }
    if (action === 'message') { const { project } = await projectAccess(str(d.projectId, 100)); await result(db().from('messages').insert({ id: resource, project_id: project.id, client_id: project.client_id, sender: w.owner ? 'Studio' : w.user.displayName, body: str(d.body), status: 'received', created_at: now() })); return json({ ok: true }); }
    if (!w.owner) throw new HttpError('Studio owner access required.', 403);
    if (action === 'client') {
      const mail = email(d.email); const existing = await result(db().from('clients').select('id').eq('email', mail).maybeSingle()); if (existing) throw new HttpError('A client with this email already exists.');
      await result(db().from('clients').insert({ id: resource, email: mail, name: str(d.name, 120), created_at: now() }));
    } else if (action === 'project') {
      const c = await row('clients', str(d.clientId, 100)); if (!c) throw new HttpError('Select a client.');
      const service = str(d.service, 80), status = str(d.status || 'planning', 30);
      if (!['Photography','Videography','Live Streaming','Passport Photos'].includes(service) || !['planning','scheduled','editing','delivered'].includes(status)) throw new HttpError('Invalid service or stage.');
      const values = { title: str(d.title, 180), description: str(d.description || '', 4000, false), service, date: str(d.date || '', 20, false), status, download_allowed: d.downloadAllowed ? 1 : 0, published: d.published ? 1 : 0 };
      if (d.id) { resource = str(d.id, 100); const previous = await row('projects', resource); if (!previous) throw new HttpError('Project not found.', 404); if (previous.client_id !== c.id) throw new HttpError('Create a separate project to assign work to another client.'); await result(db().from('projects').update(values).eq('id', resource)); }
      else await result(db().from('projects').insert({ ...values, id: resource, client_id: c.id, created_at: now() }));
    } else if (action === 'enquiry') {
      resource = str(d.id, 100); if (!['new','contacted','booked','closed'].includes(d.status)) throw new HttpError('Invalid status.'); await result(db().from('enquiries').update({ status: d.status }).eq('id', resource));
    } else if (action === 'media') {
      resource = str(d.id, 100); const m = await row('media', resource); if (!m) throw new HttpError('Image not found.', 404);
      await result(db().from('media').update({ position: integer(d.position, 0, 10000) }).eq('id', resource));
      if (d.cover && m.type.startsWith('image/')) await result(db().from('projects').update({ cover_id: resource }).eq('id', m.project_id));
    } else if (action === 'invoice') {
      const p = await row('projects', str(d.projectId, 100)); if (!p) throw new HttpError('Select a project.');
      if (!Array.isArray(d.items) || !d.items.length || d.items.length > 30) throw new HttpError('Add one to thirty line items.');
      const items = d.items.map((i: any) => ({ description: str(i.description, 200), quantity: integer(i.quantity, 1, 1000), amount: integer(i.amount, 1, 10000000) }));
      const subtotal = integer(items.reduce((a: number, i: any) => a + i.quantity * i.amount, 0), 1), tax = integer(d.taxBps || 0, 0, 10000), total = integer(subtotal + Math.round(subtotal * tax / 10000), 1), currency = str(d.currency, 3).toLowerCase();
      if (!['cad','usd','aud','gbp','eur','pkr'].includes(currency)) throw new HttpError('Unsupported currency.');
      await result(db().from('invoices').insert({ id: resource, number: 'SS-' + new Date().getFullYear() + '-' + resource.slice(0, 8).toUpperCase(), project_id: p.id, client_id: p.client_id, items: JSON.stringify(items), currency, subtotal, tax_bps: tax, total, deposit: integer(d.deposit || 0, 0, total), due: str(d.due || '', 20, false), created_at: now() }));
    } else if (action === 'email') {
      const c = await row('clients', str(d.clientId, 100)); if (!c) throw new HttpError('Client not found.');
      const subject = str(d.subject, 200), text = str(d.body), sent = await sendEmail(c.email, subject, text, resource);
      await result(db().from('messages').insert({ id: resource, client_id: c.id, sender: 'Studio', subject, body: text, status: 'sent', provider_id: sent.id, created_at: now() }));
    } else if (action === 'signature') {
      const p = await row('projects', str(d.projectId, 100)); if (!p) throw new HttpError('Project not found.'); const c = await row('clients', p.client_id); if (!c) throw new HttpError('Client not found.');
      const title = str(d.title, 180), sent = await requestSignature(integer(d.templateId, 1), c.email, c.name, resource, str(d.signerRole || 'First Party', 120));
      await result(db().from('documents').insert({ id: resource, project_id: p.id, client_id: p.client_id, title, provider_id: String(sent.submission_id), sign_url: sent.embed_src || ('https://docuseal.com/s/' + sent.slug), status: 'sent', created_at: now() }));
    } else if (action === 'settings') {
      const settings = [];
      for (const key of ['studioStatement','aboutText','contactEmail','contactPhone','instagram','facebook','videoUrl']) if (d[key] !== undefined) {
        let value = str(d[key], 4000, false);
        if (['instagram','facebook','videoUrl'].includes(key) && value) { let u; try { u = new URL(value); } catch { throw new HttpError('Enter a valid HTTPS link.'); } if (u.protocol !== 'https:') throw new HttpError('Use HTTPS links.'); }
        if (key === 'contactEmail') value = email(value); settings.push({ key, value });
      }
      if (settings.length) await result(db().from('settings').upsert(settings)); resource = 'website';
    } else throw new HttpError('Unknown action.');
    await log(w.user.userId, action, resource); return json({ ok: true, id: resource });
  } catch (e) { return failure(e); }
}
