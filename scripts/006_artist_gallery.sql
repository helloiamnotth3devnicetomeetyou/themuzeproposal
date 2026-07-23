-- Album/member-tagged gallery images collected at artist level.
-- Run after 001_discography.sql and 004_artist_assets.sql.

create table if not exists public.artist_gallery (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  album_id uuid references public.albums(id) on delete set null,
  member_id uuid references public.artist_members(id) on delete set null,
  image_url text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists artist_gallery_artist_idx on public.artist_gallery(artist_id, sort_order);
create index if not exists artist_gallery_album_idx on public.artist_gallery(album_id) where album_id is not null;
create index if not exists artist_gallery_member_idx on public.artist_gallery(member_id) where member_id is not null;

drop trigger if exists artist_gallery_set_updated_at on public.artist_gallery;
create trigger artist_gallery_set_updated_at
before update on public.artist_gallery
for each row execute function public.set_updated_at();

alter table public.artist_gallery enable row level security;

drop policy if exists "public read published gallery" on public.artist_gallery;
create policy "public read published gallery"
on public.artist_gallery for select
using (is_published = true);

drop policy if exists "admin manage artist gallery" on public.artist_gallery;
create policy "admin manage artist gallery"
on public.artist_gallery for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
