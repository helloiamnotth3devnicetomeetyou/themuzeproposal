begin;

create table if not exists public.admin_onboarding_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null,
  furthest_step_id text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

alter table public.admin_onboarding_progress enable row level security;

create policy "admins read own onboarding progress"
on public.admin_onboarding_progress for select to authenticated
using (user_id = auth.uid() and public.is_admin());

create policy "admins create own onboarding progress"
on public.admin_onboarding_progress for insert to authenticated
with check (user_id = auth.uid() and public.is_admin());

create policy "admins update own onboarding progress"
on public.admin_onboarding_progress for update to authenticated
using (user_id = auth.uid() and public.is_admin())
with check (user_id = auth.uid() and public.is_admin());

revoke all on table public.admin_onboarding_progress from anon;
grant select, insert, update on table public.admin_onboarding_progress to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
