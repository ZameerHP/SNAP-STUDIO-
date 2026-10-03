import { body, db, failure, HttpError, identity, integer, json, log, now, result, row, sameOrigin, str, uid } from '@/lib/studio-server';
import { MEDIA_BUCKET } from '@/lib/supabase/admin';
import { MAX_MEDIA_SIZE, MEDIA_TYPES, validMediaHeader } from '@/lib/media-rules';
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const w = await identity(true), d = await body(req), storage = db().storage.from(MEDIA_BUCKET);
    if (d.action === 'prepare') {
      const pid = str(d.projectId, 100), name = str(d.name, 200), type = str(d.type, 80), size = integer(d.size, 1, MAX_MEDIA_SIZE);
      if (!MEDIA_TYPES.includes(type)) throw new HttpError('Use JPEG, PNG, WebP, MP4 or WebM.');
      if (!await row('projects', pid)) throw new HttpError('Project not found.', 404);
      const id = uid(), key = pid + '/' + id;
      await result(db().from('uploads_pending').insert({ id, project_id: pid, key, name, type, size, actor: w.user.userId, created_at: now() }));
      const { data, error } = await storage.createSignedUploadUrl(key, { upsert: false });
      if (error || !data) throw new HttpError('Unable to prepare storage upload. Check the studio-media bucket setup.', 503);
      return json({ id, signedUrl: data.signedUrl });
    }
    if (d.action !== 'complete') throw new HttpError('Invalid upload action.');
    const id = str(d.id, 100), pending = await row('uploads_pending', id);
    if (!pending) {
      if (await row('media', id)) return json({ ok: true, id });
      throw new HttpError('Upload not found.', 404);
    }
    if (pending.actor !== w.user.userId) throw new HttpError('Upload access denied.', 403);
    const { data: info, error: infoError } = await storage.info(pending.key);
    if (infoError || !info) throw new HttpError('Upload has not finished. Retry the file.', 409);
    let valid = Number(info.size) === Number(pending.size) && info.contentType?.split(';')[0] === pending.type;
    if (valid) {
      const { data: signed, error } = await storage.createSignedUrl(pending.key, 60);
      if (error || !signed) throw new HttpError('Unable to verify uploaded file.', 503);
      const response = await fetch(signed.signedUrl, { headers: { Range: 'bytes=0-31' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok || !response.body) throw new HttpError('Unable to verify uploaded file.', 503);
      const reader = response.body.getReader();
      const bytes: number[] = [];
      try { while (bytes.length < 32) { const chunk = await reader.read(); if (chunk.done) break; bytes.push(...chunk.value.subarray(0, 32 - bytes.length)); } }
      finally { await reader.cancel(); }
      valid = validMediaHeader(pending.type, new Uint8Array(bytes));
    }
    if (!valid) {
      await storage.remove([pending.key]);
      await result(db().from('uploads_pending').delete().eq('id', id));
      throw new HttpError('File contents or size did not match. Choose a valid image or video.');
    }
    await result(db().rpc('studio_finish_upload', { p_id: id, p_actor: w.user.userId }));
    await log(w.user.userId, 'upload', id);
    return json({ ok: true, id });
  } catch (e) { return failure(e); }
}
