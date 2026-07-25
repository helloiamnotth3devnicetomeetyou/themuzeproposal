-- Normalize protect reports attachment arrays into a separate table.
-- Run after 015_protect_reports.sql.

create table if not exists public.protect_report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.protect_reports(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

-- Index for lookup performance
create index if not exists protect_report_attachments_report_id_idx
  on public.protect_report_attachments (report_id);

-- Enable RLS
alter table public.protect_report_attachments enable row level security;

-- Policies for protect_report_attachments
drop policy if exists "users read own protect report attachments" on public.protect_report_attachments;
create policy "users read own protect report attachments"
on public.protect_report_attachments for select
to authenticated
using (
  exists (
    select 1 from public.protect_reports r
    where r.id = report_id
    and (r.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "users insert own protect report attachments" on public.protect_report_attachments;
create policy "users insert own protect report attachments"
on public.protect_report_attachments for insert
to authenticated
with check (
  exists (
    select 1 from public.protect_reports r
    where r.id = report_id
    and r.user_id = auth.uid()
  )
);

drop policy if exists "users delete own protect report attachments" on public.protect_report_attachments;
create policy "users delete own protect report attachments"
on public.protect_report_attachments for delete
to authenticated
using (
  exists (
    select 1 from public.protect_reports r
    where r.id = report_id
    and (r.user_id = auth.uid() or public.is_admin())
  )
);

-- Migrate existing parallel array items to the new table
insert into public.protect_report_attachments (report_id, file_path, file_name)
select id, path, name
from public.protect_reports,
lateral unnest(attachment_paths, attachment_names) as t(path, name)
on conflict do nothing;

-- Drop constraints and columns from original table
alter table public.protect_reports drop constraint if exists protect_reports_attachments_check;
alter table public.protect_reports drop column if exists attachment_paths;
alter table public.protect_reports drop column if exists attachment_names;
