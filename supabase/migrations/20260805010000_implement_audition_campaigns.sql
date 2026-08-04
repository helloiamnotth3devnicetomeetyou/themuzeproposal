begin;

create table public.audition_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.audition_form_fields (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.audition_campaigns(id) on delete cascade,
  field_key text not null check (field_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  label_i18n jsonb not null default '{}'::jsonb check (
    jsonb_typeof(label_i18n) = 'object'
    and coalesce(nullif(btrim(label_i18n ->> 'ko'), ''), nullif(btrim(label_i18n ->> 'en'), ''), nullif(btrim(label_i18n ->> 'ja'), '')) is not null
  ),
  help_text text,
  field_type text not null check (field_type in ('short_text','long_text','select','radio','checkbox','date','file','consent')),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  required boolean not null default false,
  max_length integer check (max_length between 1 and 10000),
  max_file_size_mb integer check (max_file_size_mb between 1 and 100),
  accepted_file_types text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_primary_label boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, field_key)
);

alter table public.audition_submissions
  alter column name drop not null,
  add column if not exists campaign_id uuid references public.audition_campaigns(id) on delete restrict,
  add column if not exists form_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists applicant_email_hash text,
  add column if not exists reviewer_notes text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.audition_submissions
  add constraint audition_submissions_reviewer_notes_length check (reviewer_notes is null or char_length(reviewer_notes) <= 10000),
  add constraint audition_submissions_form_snapshot_array check (jsonb_typeof(form_snapshot) = 'array'),
  add constraint audition_submissions_email_hash_shape check (applicant_email_hash is null or applicant_email_hash ~ '^[0-9a-f]{64}$');

create unique index audition_submissions_campaign_email_uidx
  on public.audition_submissions (campaign_id, applicant_email_hash)
  where campaign_id is not null and applicant_email_hash is not null;
create index audition_submissions_answers_gin_idx on public.audition_submissions using gin (answers);
create index audition_campaigns_public_idx on public.audition_campaigns (is_active, starts_at, ends_at);
create index audition_form_fields_campaign_order_idx on public.audition_form_fields (campaign_id, is_active, sort_order);
create unique index audition_form_fields_primary_label_uidx on public.audition_form_fields (campaign_id)
  where is_primary_label and is_active;

create trigger audition_campaigns_set_updated_at before update on public.audition_campaigns
  for each row execute function public.set_updated_at();
create trigger audition_form_fields_set_updated_at before update on public.audition_form_fields
  for each row execute function public.set_updated_at();

alter table public.audition_campaigns enable row level security;
alter table public.audition_form_fields enable row level security;

create policy "public read active audition campaigns" on public.audition_campaigns
  for select to anon, authenticated using (
    (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()))
    or public.is_admin()
  );
create policy "admins insert audition campaigns" on public.audition_campaigns
  for insert to authenticated with check (public.is_admin());
create policy "admins update audition campaigns" on public.audition_campaigns
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete audition campaigns" on public.audition_campaigns
  for delete to authenticated using (public.is_admin());

create policy "public read active audition fields" on public.audition_form_fields
  for select to anon, authenticated using (
    (is_active and exists (
      select 1 from public.audition_campaigns campaign
      where campaign.id = audition_form_fields.campaign_id
        and campaign.is_active
        and (campaign.starts_at is null or campaign.starts_at <= now())
        and (campaign.ends_at is null or campaign.ends_at >= now())
    )) or public.is_admin()
  );
create policy "admins insert audition fields" on public.audition_form_fields
  for insert to authenticated with check (public.is_admin());
create policy "admins update audition fields" on public.audition_form_fields
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete audition fields" on public.audition_form_fields
  for delete to authenticated using (public.is_admin());

revoke all on public.audition_campaigns, public.audition_form_fields from anon, authenticated;
grant select on public.audition_campaigns, public.audition_form_fields to anon, authenticated;
grant insert, update, delete on public.audition_campaigns, public.audition_form_fields to authenticated;

drop policy if exists "users read own audition submissions" on public.audition_submissions;
drop policy if exists "admin full access audition submissions" on public.audition_submissions;
revoke all on public.audition_submissions from anon, authenticated;
grant select on public.audition_submissions to authenticated;
grant update (status, reviewer_notes, reviewed_by, reviewed_at) on public.audition_submissions to authenticated;
drop policy if exists "admins read audition submissions" on public.audition_submissions;
drop policy if exists "admins update audition submissions" on public.audition_submissions;
create policy "admins read audition submissions" on public.audition_submissions
  for select to authenticated using (public.is_admin());
create policy "admins update audition submissions" on public.audition_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('audition-attachments', 'audition-attachments', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "admins read audition attachments" on storage.objects;
create policy "admins read audition attachments" on storage.objects
  for select to authenticated using (bucket_id = 'audition-attachments' and public.is_admin());

drop trigger if exists audition_campaigns_admin_audit on public.audition_campaigns;
create trigger audition_campaigns_admin_audit after insert or update or delete on public.audition_campaigns
  for each row execute function public.capture_admin_audit('id', 'standard');
drop trigger if exists audition_form_fields_admin_audit on public.audition_form_fields;
create trigger audition_form_fields_admin_audit after insert or update or delete on public.audition_form_fields
  for each row execute function public.capture_admin_audit('id', 'standard');

notify pgrst, 'reload schema';
commit;
