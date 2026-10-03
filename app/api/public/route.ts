import { db, json, result, type Row } from '@/lib/studio-server';
export async function GET() {
  try {
    const [settings, projects] = await Promise.all([result<Row[]>(db().from('settings').select('key,value')), result<Row[]>(db().from('projects').select('id,title,description,service,cover_id').eq('published', 1).order('created_at', { ascending: false }).limit(100))]);
    const media = projects.length ? await result<Row[]>(db().from('media').select('id,project_id,type,position').in('project_id', projects.map(p => p.id)).like('type', 'image/%').order('position').limit(1000)) : [];
    return json({ settings: Object.fromEntries(settings.map(s => [s.key, s.value])), projects: projects.map(({ cover_id, ...p }) => ({ ...p, cover: media.find(m => m.id === cover_id)?.id || media.find(m => m.project_id === p.id)?.id })) });
  } catch { return json({ settings: {}, projects: [] }); }
}
