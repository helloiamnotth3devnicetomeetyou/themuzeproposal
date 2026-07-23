-- Homepage hero slides are curated separately from album publication/order.
-- Run after 001_discography.sql and 008_site_settings.sql.

create table if not exists public.home_hero_slides (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (album_id)
);

create index if not exists home_hero_slides_active_order_idx
on public.home_hero_slides (is_active, sort_order);

drop trigger if exists home_hero_slides_set_updated_at on public.home_hero_slides;
create trigger home_hero_slides_set_updated_at
before update on public.home_hero_slides
for each row execute function public.set_updated_at();

alter table public.home_hero_slides enable row level security;

drop policy if exists "public read active home hero slides" on public.home_hero_slides;
create policy "public read active home hero slides"
on public.home_hero_slides for select
using (is_active = true);

drop policy if exists "admin manage home hero slides" on public.home_hero_slides;
create policy "admin manage home hero slides"
on public.home_hero_slides for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.home_hero_slides to anon, authenticated;
grant insert, update, delete on public.home_hero_slides to authenticated;

notify pgrst, 'reload schema';
