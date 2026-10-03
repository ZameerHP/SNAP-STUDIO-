import { db, failure, HttpError, row, projectAccess } from '@/lib/studio-server';
import { MEDIA_BUCKET } from '@/lib/supabase/admin';
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params, m = await row('media', id);
    if (!m) throw new HttpError('File not found.', 404);
    const project = await row('projects', m.project_id);
    if (!project) throw new HttpError('File not found.', 404);
    const download = new URL(req.url).searchParams.has('download');
    if (!project.published || download) {
      const w = await projectAccess(m.project_id);
      if (download && !w.owner && !project.download_allowed) throw new HttpError('Downloads are not enabled.', 403);
    }
    const { data, error } = await db().storage.from(MEDIA_BUCKET).createSignedUrl(m.key, 300, download ? { download: m.name.replace(/[^a-zA-Z0-9._-]/g, '_') } : undefined);
    if (error || !data) throw new HttpError('File unavailable.', 503);
    return new Response(null, { status: 302, headers: { Location: data.signedUrl, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });
  } catch (e) { return failure(e); }
}
