import { config, HttpError, integrations } from './studio-server';

async function providerMessage(response: Response) {
  try {
    const body = await response.json() as { message?: unknown; error?: unknown };
    const message = typeof body.message === 'string' ? body.message : typeof body.error === 'string' ? body.error : '';
    return message.slice(0, 240);
  } catch {
    return '';
  }
}

export async function sendEmail(to: string, subject: string, text: string, id: string) {
  if (!integrations().email) throw new HttpError('Email is awaiting connection. Configure a verified sender and Resend API key.', 503);
  const e = config();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + e.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': id },
    body: JSON.stringify({ from: e.EMAIL_FROM, to: [to], reply_to: 'supersnapstudio@gmail.com', subject, text }),
  });
  if (!response.ok) {
    const detail = await providerMessage(response);
    throw new HttpError(`Resend rejected this email (${response.status}).${detail ? ` ${detail}` : ' Check the sender domain, recipient, and API key.'}`, 502);
  }
  return response.json() as Promise<{ id: string }>;
}

/** Owner alerts should not undo a saved enquiry, message, payment, or signature. */
export async function notifyStudio(subject: string, text: string, id: string) {
  const to = config().STUDIO_NOTIFICATION_EMAIL;
  if (!to || !integrations().email) return;
  try {
    await sendEmail(to, subject, text, id);
  } catch (error) {
    console.error('Studio email notification failed', error instanceof Error ? error.message : 'Unknown provider error');
  }
}

export async function requestSignature(templateId: number, email: string, name: string, id: string, role: string) {
  if (!integrations().signatures) throw new HttpError('Document signing is awaiting connection.', 503);
  const response = await fetch('https://api.docuseal.com/submissions', {
    method: 'POST',
    headers: { 'X-Auth-Token': config().DOCUSEAL_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_id: templateId, send_email: true, submitters: [{ role, email, name, external_id: id }] }),
  });
  if (!response.ok) {
    const detail = await providerMessage(response);
    if (response.status === 401 || response.status === 403 || /not authenticated/i.test(detail)) {
      throw new HttpError('DocuSeal rejected the API key. Copy the key from the same account and Test Mode as the template, update DOCUSEAL_API_KEY in Vercel Production, then redeploy.', 502);
    }
    throw new HttpError(`DocuSeal could not create the request (${response.status}). Check the template ID and exact signer role.${detail ? ` ${detail}` : ''}`, 502);
  }
  const data = await response.json() as any[];
  if (!data[0]?.submission_id) throw new HttpError('Incomplete provider response.', 502);
  return data[0];
}
export async function hmac(secret:string,text:string){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('')}
export function equal(a:string,b:string){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
