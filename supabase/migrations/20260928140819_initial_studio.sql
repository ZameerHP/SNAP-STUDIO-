-- Run once in a NEW Supabase project's SQL Editor. No API keys belong in SQL.
begin;
create table public.clients (id text primary key, email text not null unique check (email=lower(email)), name text not null, user_id uuid unique references auth.users(id) on delete set null, created_at bigint not null);
create table public.enquiries (id text primary key, name text not null, email text not null, phone text, service text not null, date text, location text, details text not null, status text not null default 'new', ip_hash text, created_at bigint not null);
create table public.projects (id text primary key, client_id text not null references public.clients(id), title text not null, description text not null default '', service text not null, date text, status text not null default 'planning', download_allowed integer not null default 0 check (download_allowed in (0,1)), published integer not null default 0 check (published in (0,1)), selections_submitted integer not null default 0 check (selections_submitted in (0,1)), cover_id text, created_at bigint not null);
create table public.media (id text primary key, project_id text not null references public.projects(id), key text not null unique, name text not null, type text not null, size bigint not null check (size between 1 and 26214400), position integer not null default 0, created_at bigint not null);
create table public.favorites (id text primary key, client_id text not null references public.clients(id), media_id text not null references public.media(id), unique(client_id,media_id));
create table public.invoices (id text primary key, number text not null unique, project_id text not null references public.projects(id), client_id text not null references public.clients(id), items text not null, currency text not null, subtotal bigint not null check(subtotal>=0), tax_bps integer not null default 0, total bigint not null check(total>0), deposit bigint not null default 0 check(deposit>=0 and deposit<=total), due text, checkout_id text, checkout_url text, checkout_amount bigint, checkout_expires bigint, checkout_lock text, created_at bigint not null);
create table public.payments (id text primary key, invoice_id text not null references public.invoices(id), provider_id text not null unique, amount bigint not null check(amount>0), currency text not null, refunded bigint not null default 0 check(refunded>=0 and refunded<=amount), created_at bigint not null);
create table public.documents (id text primary key, project_id text not null references public.projects(id), client_id text not null references public.clients(id), title text not null, provider_id text not null unique, sign_url text, status text not null default 'sent', completed_url text, audit_url text, created_at bigint not null);
create table public.messages (id text primary key, project_id text references public.projects(id), client_id text references public.clients(id), sender text not null, subject text, body text not null, status text not null default 'received', provider_id text unique, created_at bigint not null);
create table public.settings (key text primary key, value text not null);
create table public.events (id text primary key, provider text not null, created_at bigint not null);
create table public.audit (id text primary key, actor text not null, action text not null, resource text not null, created_at bigint not null);
create table public.square_checkouts (id text primary key, invoice_id text not null references public.invoices(id), amount bigint not null check(amount>0), currency text not null, paid_before bigint not null, request_json text not null, link_id text unique, order_id text unique, url text, status text not null default 'creating', created_at bigint not null);
create table public.uploads_pending (id text primary key, project_id text not null references public.projects(id), key text not null unique, name text not null, type text not null, size bigint not null check(size between 1 and 26214400), actor uuid not null references auth.users(id), created_at bigint not null);
create table public.rate_limits (key text primary key, window_start bigint not null, hits integer not null);
create index projects_client on public.projects(client_id);
create index media_project on public.media(project_id,position);
create index invoices_client on public.invoices(client_id);
create index invoices_project on public.invoices(project_id);
create index payments_invoice on public.payments(invoice_id);
create index documents_client on public.documents(client_id);
create index documents_project on public.documents(project_id);
create index messages_client on public.messages(client_id);
create index messages_project on public.messages(project_id);
create index favorites_media on public.favorites(media_id);
create index square_checkouts_invoice on public.square_checkouts(invoice_id,status);
create index uploads_pending_project on public.uploads_pending(project_id);
create index uploads_pending_actor on public.uploads_pending(actor);
create index enquiries_spam on public.enquiries(ip_hash,created_at);
-- Browser roles have no table access. Verified Next.js routes enforce client ownership
-- before using the server-only service key; storage is private with no public policies.
do $$ declare t text; begin
  foreach t in array array['clients','enquiries','projects','media','favorites','invoices','payments','documents','messages','settings','events','audit','square_checkouts','uploads_pending','rate_limits'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant select, insert, update, delete on table public.%I to service_role',t);
  end loop;
end $$;

create function public.studio_rate_limit(p_key text,p_limit integer,p_window bigint) returns boolean
language plpgsql security invoker set search_path = public as $$
declare v_now bigint := floor(extract(epoch from clock_timestamp())*1000); v_start bigint; v_hits integer;
begin
  if p_window<1000 or p_limit<1 then raise exception 'Invalid rate limit'; end if;
  v_start := (v_now / p_window) * p_window;
  insert into public.rate_limits(key,window_start,hits) values(p_key,v_start,1)
  on conflict(key) do update set window_start=excluded.window_start,
    hits=case when rate_limits.window_start=excluded.window_start then least(rate_limits.hits+1,p_limit+1) else 1 end
  returning hits into v_hits;
  return v_hits<=p_limit;
end $$;

create function public.studio_favorite(p_client text,p_media text,p_selected boolean) returns void
language plpgsql security invoker set search_path = public as $$
declare v_project text;
begin
  select p.id into v_project from public.media m join public.projects p on p.id=m.project_id where m.id=p_media and p.client_id=p_client for update of p;
  if v_project is null then raise exception 'Media not found'; end if;
  if p_selected then
    insert into public.favorites(id,client_id,media_id) values(gen_random_uuid()::text,p_client,p_media) on conflict(client_id,media_id) do nothing;
  else delete from public.favorites where client_id=p_client and media_id=p_media; end if;
  update public.projects set selections_submitted=0 where id=v_project;
end $$;

create function public.studio_acquire_checkout(p_invoice text,p_lock text,p_now bigint,p_expires bigint) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  update public.invoices set checkout_lock=p_lock,checkout_expires=p_expires where id=p_invoice and (checkout_lock is null or checkout_expires<p_now);
  return found;
end $$;

create function public.studio_record_square_payment(p_attempt text,p_payment text,p_order text,p_refunded bigint) returns void
language plpgsql security invoker set search_path = public as $$
declare a public.square_checkouts%rowtype; existing public.payments%rowtype;
begin
  select * into a from public.square_checkouts where id=p_attempt for update;
  if not found or (a.order_id is not null and a.order_id<>p_order) or p_refunded<0 or p_refunded>a.amount then raise exception 'Invalid payment'; end if;
  perform id from public.invoices where id=a.invoice_id for update;
  select * into existing from public.payments where provider_id='square:'||p_payment;
  if found and (existing.invoice_id<>a.invoice_id or existing.amount<>a.amount or existing.currency<>a.currency) then raise exception 'Payment conflict'; end if;
  insert into public.payments(id,invoice_id,provider_id,amount,currency,refunded,created_at)
  values(gen_random_uuid()::text,a.invoice_id,'square:'||p_payment,a.amount,a.currency,p_refunded,floor(extract(epoch from clock_timestamp())*1000))
  on conflict(provider_id) do update set refunded=greatest(payments.refunded,excluded.refunded);
  update public.square_checkouts set status='paid',order_id=p_order where id=a.id;
  update public.invoices set checkout_id=null,checkout_url=null where id=a.invoice_id and checkout_id=a.link_id;
end $$;

create function public.studio_finish_upload(p_id text,p_actor uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare u public.uploads_pending%rowtype;
begin
  select * into u from public.uploads_pending where id=p_id and actor=p_actor for update;
  if not found then raise exception 'Upload not found'; end if;
  insert into public.media(id,project_id,key,name,type,size,created_at) values(u.id,u.project_id,u.key,u.name,u.type,u.size,u.created_at) on conflict(id) do nothing;
  delete from public.uploads_pending where id=u.id;
end $$;
revoke all on function public.studio_rate_limit(text,integer,bigint) from public,anon,authenticated;
revoke all on function public.studio_favorite(text,text,boolean) from public,anon,authenticated;
revoke all on function public.studio_acquire_checkout(text,text,bigint,bigint) from public,anon,authenticated;
revoke all on function public.studio_record_square_payment(text,text,text,bigint) from public,anon,authenticated;
revoke all on function public.studio_finish_upload(text,uuid) from public,anon,authenticated;
grant execute on function public.studio_rate_limit(text,integer,bigint), public.studio_favorite(text,text,boolean), public.studio_acquire_checkout(text,text,bigint,bigint), public.studio_record_square_payment(text,text,text,bigint), public.studio_finish_upload(text,uuid) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('studio-media','studio-media',false,26214400,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
commit;
