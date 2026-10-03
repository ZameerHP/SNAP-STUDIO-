# Database and media storage

Vercel hosts Next.js; Supabase stores records, authentication users and uploaded originals. No Cloudflare account or bindings are required.

Run `supabase/setup.sql` once in a new Supabase project. It enables RLS on every application table and removes anonymous/authenticated direct table privileges. Server routes verify the signed-in user with Supabase Auth and check project/client ownership before using the server secret. No arbitrary SQL endpoint is exposed.

The `studio-media` bucket is private. Owners upload directly using signed upload URLs; the server checks file metadata and media signatures before making the file visible in a gallery. The maximum is 25 MiB per file: JPEG, PNG, WebP, MP4 or WebM. No transcoding is included. Unfinished uploads may leave pending rows/objects; periodically remove abandoned uploads through Supabase after their signed upload token expires (allow at least two hours). Never delete finalized media during that cleanup.

Private gallery access is authorized before a five-minute signed read URL is returned. Anyone possessing that URL can view the file until it expires. A published project intentionally exposes its gallery. Disabling downloads removes the download action but cannot prevent saving visible media or taking screenshots.

Database, storage and egress allowances depend on your Supabase plan; check the project Usage page and https://supabase.com/pricing before promising capacity. Original photos/videos usually consume storage and bandwidth faster than database records. This application does not impose a total storage quota beyond the provider plan. Its dashboard currently loads up to 500 recent projects/invoices/messages, 200 enquiries, 1,000 clients and 1,000 media records per request; large archives need pagination before exceeding these display limits.

Back up both PostgreSQL records and storage objects. A GitHub clone or Vercel redeploy is not a database/media backup. Previous hosted records are not automatically migrated by adding Supabase keys.
