-- ============================================================
-- Audition Sessions
-- ============================================================
-- New table for admin-managed audition sessions with configurable
-- status, period, categories, and a dynamic form schema.

create table public.auditions (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null default '오디션',
  status      text        not null default 'tba'
                          check (status in ('tba', 'open', 'closed', 'reviewing', 'done')),
  start_at    timestamptz,
  end_at      timestamptz,
  categories  jsonb       not null default '[]'::jsonb
                          check (jsonb_typeof(categories) = 'array'),
  form_schema jsonb       not null default '[]'::jsonb
                          check (jsonb_typeof(form_schema) = 'array'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.auditions owner to postgres;

comment on column public.auditions.status is
  'tba = 공고 예정, open = 접수 중, closed = 마감, reviewing = 심사 중, done = 결과 발표';

comment on column public.auditions.categories is
  'string[] — 지원 분과 목록 (e.g. ["보컬", "댄스"])';

comment on column public.auditions.form_schema is
  'AuditionField[] — 어드민이 구성한 커스텀 폼 필드 목록';

-- RLS
alter table public.auditions enable row level security;

create policy "public read open auditions"
  on public.auditions for select
  using (status = 'open');

create policy "admin full access auditions"
  on public.auditions for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'editor')
    )
  );

-- auto-update updated_at
create or replace function public.touch_audition_updated_at()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_auditions_updated_at
  before update on public.auditions
  for each row execute function public.touch_audition_updated_at();

-- ============================================================
-- Extend audition_submissions for new system
-- ============================================================
-- audition_id links to the session; null for legacy rows.
-- user_id records the submitting user.
-- answers stores dynamic form field responses as {fieldId: value}.
-- attachment_path stores the uploaded file path in storage.

alter table public.audition_submissions
  add column if not exists audition_id    uuid        references public.auditions(id) on delete set null,
  add column if not exists user_id        uuid        references auth.users(id)        on delete set null,
  add column if not exists answers        jsonb       not null default '{}'::jsonb,
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size bigint;

comment on column public.audition_submissions.audition_id is
  'FK to auditions. NULL for legacy pre-session rows.';

comment on column public.audition_submissions.user_id is
  'Auth user who submitted. NULL for legacy rows that predate login requirement.';

comment on column public.audition_submissions.answers is
  '{fieldId: string | string[]} — dynamic form answers keyed by AuditionField.id';

comment on column public.audition_submissions.attachment_path is
  'Storage path in the audition-attachments bucket (images/PDF).';

-- Constraint: attachment fields are either all present or all null
alter table public.audition_submissions
  add constraint audition_submissions_attachment_check
    check (
      (attachment_path is null and attachment_name is null and attachment_size is null)
      or (attachment_path is not null and attachment_name is not null
          and attachment_size >= 1 and attachment_size <= 52428800)
    );

-- ============================================================
-- RLS for audition_submissions
-- ============================================================
-- Submissions must go through the server API route (service_role).
-- Revoke direct client insert.

revoke insert on public.audition_submissions from anon, authenticated;

-- Admin can read/update (status, notes) all submissions.
-- Users can read their own submissions.

drop policy if exists "admin full access audition submissions" on public.audition_submissions;
create policy "admin full access audition submissions"
  on public.audition_submissions for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'editor')
    )
  );

drop policy if exists "users read own audition submissions" on public.audition_submissions;
create policy "users read own audition submissions"
  on public.audition_submissions for select
  using (user_id = auth.uid());

-- ============================================================
-- Rate limit scope for audition submissions
-- ============================================================
-- Add 'audition_submission' to the existing scope constraint.

alter table private.submission_rate_limits
  drop constraint if exists submission_rate_limits_scope_check;

alter table private.submission_rate_limits
  add constraint submission_rate_limits_scope_check
    check (scope in ('contact_inquiry', 'protect_report', 'audition_submission'));

-- Allow service_role to call the rate-limit function for the new scope.
-- (The function already runs as security definer; this is just documentation.)

-- ============================================================
-- Audit trigger for audition submissions
-- ============================================================
-- Hook the existing capture_admin_audit trigger (sensitive mode).

drop trigger if exists trg_audit_audition_submissions on public.audition_submissions;
create trigger trg_audit_audition_submissions
  after update on public.audition_submissions
  for each row execute function public.capture_admin_audit('id', 'sensitive');
