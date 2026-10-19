import { db, json, result, type Row } from '@/lib/studio-server';

export async function GET() {
  try {
    const [settingsRows, publishedRows] = await Promise.all([
      result<Row[]>(db().from('settings').select('key,value')),
      result<Row[]>(db().from('projects').select('id,title,description,service,cover_id,created_at').eq('published', 1).order('created_at', { ascending: false }).limit(100)),
    ]);
    const settings = Object.fromEntries(settingsRows.map(s => [s.key, s.value]));
    const preferredOrder: string[] = (() => {
      try {
        const value: unknown = JSON.parse(settings.portfolioOrder || '[]');
        return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
      } catch { return []; }
    })();
    const order = new Map(preferredOrder.map((id, index) => [id, index]));
    const projects = [...publishedRows].sort((a, b) => {
      const ai = order.get(a.id), bi = order.get(b.id);
      if (ai !== undefined || bi !== undefined) {
        if (ai === undefined) return 1;
        if (bi === undefined) return -1;
        if (ai !== bi) return ai - bi;
      }
      return Number(b.created_at || 0) - Number(a.created_at || 0);
    });
    const media = projects.length
      ? await result<Row[]>(db().from('media').select('id,project_id,type,position').in('project_id', projects.map(p => p.id)).like('type', 'image/%').order('position').limit(1000))
      : [];
    const publicMedia = new Set(media.map(m => String(m.id)));
    const imageKeys = ['logoImage','heroImage','photographyImage','videographyImage','liveStreamingImage','passportPhotosImage','filmImage','studioImage','studioImageSecondary','aboutImage'];
    for (const key of imageKeys) {
      if (settings[key] && !publicMedia.has(settings[key])) delete settings[key];
    }
    return json({
      settings,
      projects: projects.map(({ cover_id, ...p }) => ({
        ...p,
        cover: media.find(m => m.id === cover_id)?.id || media.find(m => m.project_id === p.id)?.id,
      })),
      media: media.map(m => ({ id: m.id, project_id: m.project_id, type: m.type })),
    });
  } catch {
    return json({ settings: {}, projects: [], media: [] });
  }
}
