-- Artist rights infringement reports and private evidence storage.
-- Run after 001_discography.sql.

create table if not exists public.protect_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reporter_email text,
  artist_id uuid not null references public.artists(id) on delete restrict,
  report_type text not null,
  title text not null,
  content text not null,
  platform text not null,
  post_url text not null,
  posted_at date not null,
  author_name text not null,
  post_ip text,
  attachment_paths text[] not null default '{}',
  attachment_names text[] not null default '{}',
  confirmation boolean not null default false,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint protect_reports_type_check check (
    report_type in ('defamation', 'harassment', 'impersonation', 'copyright', 'privacy', 'other')
  ),
  constraint protect_reports_status_check check (
    status in ('pending', 'reviewing', 'resolved', 'rejected')
  ),
  constraint protect_reports_attachments_check check (
    cardinality(attachment_paths) between 1 and 3
    and cardinality(attachment_names) = cardinality(attachment_paths)
  ),
  constraint protect_reports_confirmation_check check (confirmation = true)
);

create index if not exists protect_reports_created_at_idx
  on public.protect_reports (created_at desc);

create index if not exists protect_reports_status_idx
  on public.protect_reports (status, created_at desc);

drop trigger if exists protect_reports_set_updated_at on public.protect_reports;
create trigger protect_reports_set_updated_at
before update on public.protect_reports
for each row execute function public.set_updated_at();

alter table public.protect_reports enable row level security;

drop policy if exists "users create own protect reports" on public.protect_reports;
create policy "users create own protect reports"
on public.protect_reports for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users read own protect reports" on public.protect_reports;
create policy "users read own protect reports"
on public.protect_reports for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins update protect reports" on public.protect_reports;
create policy "admins update protect reports"
on public.protect_reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins delete protect reports" on public.protect_reports;
create policy "admins delete protect reports"
on public.protect_reports for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'protect-evidence',
  'protect-evidence',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users upload own protect evidence" on storage.objects;
create policy "users upload own protect evidence"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'protect-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users read own protect evidence" on storage.objects;
create policy "users read own protect evidence"
on storage.objects for select
to authenticated
using (
  bucket_id = 'protect-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "users delete own protect evidence" on storage.objects;
create policy "users delete own protect evidence"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'protect-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);
