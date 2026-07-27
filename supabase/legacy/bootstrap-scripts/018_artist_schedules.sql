-- Artist schedule calendar and CMS support.
-- Run after 001_discography.sql (requires artists, profiles, is_admin and set_updated_at).

create table if not exists public.artist_schedules (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  event_date date not null,
  start_time time,
  category text not null default 'etc'
    check (category in ('show', 'release', 'anniversary', 'event', 'etc')),
  title_ko text not null,
  title_en text,
  title_ja text,
  description_ko text,
  description_en text,
  description_ja text,
  location text,
  link_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists artist_schedules_public_calendar_idx
  on public.artist_schedules (artist_id, is_published, event_date, start_time, sort_order);

drop trigger if exists artist_schedules_set_updated_at on public.artist_schedules;
create trigger artist_schedules_set_updated_at
before update on public.artist_schedules
for each row execute function public.set_updated_at();

alter table public.artist_schedules enable row level security;

drop policy if exists "public read published artist schedules" on public.artist_schedules;
create policy "public read published artist schedules"
on public.artist_schedules for select
using (is_published = true);

drop policy if exists "admin manage artist schedules" on public.artist_schedules;
create policy "admin manage artist schedules"
on public.artist_schedules for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

