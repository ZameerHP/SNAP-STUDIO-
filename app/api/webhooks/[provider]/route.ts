import { squareSignature } from '@/lib/square-core';
import { squareConfig, reconcileSquarePayment } from '@/lib/square';
import { config, db, failure, HttpError, json, now, row, result, uid } from '@/lib/studio-server';
import { equal, hmac, notifyStudio } from '@/lib/providers';
const recordEvent = (id: string, provider: string) => result(db().from('events').upsert({ id, provider, created_at: now() }, { onConflict: 'id', ignoreDuplicates: true }));
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params, e = config(), raw = await req.text();
    if (raw.length > 1000000) throw new HttpError('Payload too large.', 413);
    if (provider === 'square') {
      const c = squareConfig();
      if (!equal(req.headers.get('x-square-hmacsha256-signature') || '', await squareSignature(c.secret, c.webhook, raw))) throw new HttpError('Invalid Square signature.', 403);
      const event = JSON.parse(raw);
      if (typeof event.event_id !== 'string' || !event.event_id) throw new HttpError('Missing event ID.');
      const eventId = 'square:' + event.event_id;
      if (await row('events', eventId)) return json({ ok: true });
      if (['payment.created', 'payment.updated', 'refund.created', 'refund.updated'].includes(event.type)) {
        const paymentId = event.type.startsWith('refund.') ? event.data?.object?.refund?.payment_id : event.data?.object?.payment?.id;
        if (typeof paymentId !== 'string' || !paymentId) throw new HttpError('Missing payment ID.');
        await reconcileSquarePayment(paymentId);
      }
      await recordEvent(eventId, 'square');
      return json({ ok: true });
    }
    if (provider === 'docuseal') {
      if (!e.DOCUSEAL_WEBHOOK_SECRET || !e.DOCUSEAL_API_KEY) throw new HttpError('Webhook is not configured.', 503);
      const [t, sig] = (req.headers.get('x-docuseal-signature') || '').split('.');
      if (!t || !sig || !Number.isFinite(Number(t)) || Math.abs(Date.now() / 1000 - Number(t)) > 300 || !equal(sig, await hmac(e.DOCUSEAL_WEBHOOK_SECRET, t + '.' + raw))) throw new HttpError('Invalid signature.', 403);
      const event = JSON.parse(raw), id = String(event.data?.submission_id || event.data?.id || '');
      const doc = await result<any>(db().from('documents').select('*').eq('provider_id', id).maybeSingle());
      if (!doc) return json({ ok: true });
      const r = await fetch('https://api.docuseal.com/submissions/' + encodeURIComponent(id), { headers: { 'X-Auth-Token': e.DOCUSEAL_API_KEY } });
      if (!r.ok) throw new HttpError('Provider unavailable.', 502);
      const s: any = await r.json(), status = s.status || (s.completed_at ? 'completed' : 'sent');
      const safe = (v: unknown) => { try { const url = new URL(String(v)); return url.protocol === 'https:' ? url.href : null; } catch { return null; } };
      const completedUrl = status === 'completed' ? safe(s.combined_document_url || s.submitters?.[0]?.documents?.[0]?.url) : null;
      const auditUrl = status === 'completed' ? safe(s.audit_log_url) : null;
      await result(db().from('documents').update({ status, completed_url: completedUrl, audit_url: auditUrl }).eq('id', doc.id));
      if (status === 'completed' && doc.status !== 'completed') {
        const [client, project] = await Promise.all([row('clients', doc.client_id), row('projects', doc.project_id)]);
        let attachment: { filename: string; path: string }[] | undefined;
        if (completedUrl) {
          const host = new URL(completedUrl).hostname;
          if (['docuseal.com', 'docuseal.eu'].some(domain => host === domain || host.endsWith('.' + domain))) {
            attachment = [{ filename: (String(doc.title).replace(/\.pdf$/i, '').replace(/[^a-z0-9._-]/gi, '-').slice(0, 80) || 'signed-agreement') + '.pdf', path: completedUrl }];
          }
        }
        await notifyStudio('Document signed · ' + doc.title, `Client: ${client?.name || 'Unknown'} (${client?.email || 'No email'})\nProject: ${project?.title || 'Unknown'}\nDocument: ${doc.title}\nSigned PDF: ${completedUrl || 'Open the studio dashboard'}\nAudit record: ${auditUrl || 'Open the studio dashboard'}\n\nOpen ${e.SITE_URL || 'your website'}/admin to view the signed document.`, 'studio-signature-' + doc.id, attachment);
      }
      return json({ ok: true });
    }
    if (provider === 'resend') {
      if (!e.RESEND_WEBHOOK_SECRET || !e.RESEND_API_KEY) throw new HttpError('Webhook is not configured.', 503);
      const id = req.headers.get('svix-id') || '', t = req.headers.get('svix-timestamp') || '', sigs = req.headers.get('svix-signature') || '';
      if (!id || !t || !Number.isFinite(Number(t)) || Math.abs(Date.now() / 1000 - Number(t)) > 300) throw new HttpError('Invalid signature.', 403);
      const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(e.RESEND_WEBHOOK_SECRET.replace(/^whsec_/, '')), c => c.charCodeAt(0)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id + '.' + t + '.' + raw))), expected = btoa(String.fromCharCode(...bytes));
      if (!sigs.split(' ').some(s => equal(s.replace(/^v1,/, ''), expected))) throw new HttpError('Invalid signature.', 403);
      const eventId = 'resend:' + id;
      if (await row('events', eventId)) return json({ ok: true });
      const event = JSON.parse(raw);
      if (event.type === 'email.received') {
        const r = await fetch('https://api.resend.com/emails/receiving/' + encodeURIComponent(event.data.email_id), { headers: { Authorization: 'Bearer ' + e.RESEND_API_KEY } });
        if (!r.ok) throw new HttpError('Email unavailable.', 502);
        const m: any = await r.json(), from = String(m.from || event.data.from), sender = (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();
        const client = await result<any>(db().from('clients').select('id').eq('email', sender).maybeSingle());
        await result(db().from('messages').upsert({ id: uid(), client_id: client?.id || null, sender: from, subject: String(m.subject || '').slice(0, 200), body: String(m.text || 'No plain text body. Read this email in the provider inbox.').slice(0, 20000), status: 'received', provider_id: event.data.email_id, created_at: now() }, { onConflict: 'provider_id', ignoreDuplicates: true }));
        if (sender !== String(e.STUDIO_NOTIFICATION_EMAIL || '').toLowerCase()) await notifyStudio('Incoming studio email · ' + String(m.subject || 'No subject').slice(0, 120), `From: ${from}\nSubject: ${String(m.subject || 'No subject').slice(0, 200)}\n\n${String(m.text || 'Open the studio dashboard to read this message.').slice(0, 4000)}\n\nOpen ${e.SITE_URL || 'your website'}/admin for details.`, 'studio-incoming-' + event.data.email_id);
      } else {
        await result(db().from('messages').update({ status: String(event.type).replace('email.', '') }).eq('provider_id', String(event.data?.email_id || '')));
      }
      await recordEvent(eventId, 'resend');
      return json({ ok: true });
    }
    throw new HttpError('Webhook not found.', 404);
  } catch (e) { return failure(e); }
}
