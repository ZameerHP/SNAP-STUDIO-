import { body, db, email, failure, HttpError, json, now, result, sameOrigin, str, uid } from '@/lib/studio-server';
import { notifyStudio } from '@/lib/providers';
export async function POST(req: Request) {
  try {
    sameOrigin(req); const d = await body(req); if (d.website) return json({ ok: true });
    const service = str(d.service, 80); if (!['Photography','Videography','Live Streaming','Passport Photos'].includes(service)) throw new HttpError('Choose a service.');
    const ip = process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local';
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)), hash = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
    const allowed = await result<boolean>(db().rpc('studio_rate_limit', { p_key: 'enquiry:' + hash, p_limit: 10, p_window: 3600000 }));
    if (!allowed) throw new HttpError('Too many requests. Please phone the studio or try again later.', 429);
    const date = str(d.date || '', 20, false); if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError('Check your preferred date.');
    const enquiry = { id: uid(), name: str(d.name, 120), email: email(d.email), phone: str(d.phone || '', 40, false), service, date, location: str(d.location || '', 250, false), details: str(d.details, 4000), ip_hash: hash, created_at: now() };
    await result(db().from('enquiries').insert(enquiry));
    await notifyStudio('New website enquiry · ' + service, `Client: ${enquiry.name}\nEmail: ${enquiry.email}\nPhone: ${enquiry.phone || 'Not provided'}\nService: ${service}\nPreferred date: ${date || 'Flexible'}\nLocation: ${enquiry.location || 'Not provided'}\n\n${enquiry.details}\n\nOpen ${process.env.SITE_URL || 'your website'}/admin to follow up.`, 'studio-enquiry-' + enquiry.id);
    return json({ ok: true });
  } catch (e) { return failure(e); }
}
