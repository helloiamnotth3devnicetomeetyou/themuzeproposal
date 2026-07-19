-- Discography foundation
-- Run this file in the Supabase SQL Editor before connecting the public page.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_on_auth_user on auth.users;
create trigger create_profile_on_auth_user
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  eng_name text,
  type text not null default 'group',
  debut_date date,
  image_url text,
  color text not null default '#FC6FCF',
  description_ko text,
  description_en text,
  description_ja text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_members (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  slug text not null,
  name text not null,
  eng_name text,
  role_ko text,
  role_en text,
  role_ja text,
  birth text,
  mbti text,
  image_url text,
  color text not null default '#FC6FCF',
  bio_ko text,
  bio_en text,
  bio_ja text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_id, slug)
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  slug text not null,
  title text not null,
  type text not null default 'Album',
  release_date date,
  cover_url text,
  color text not null default '#FC6FCF',
  description_ko text,
  description_en text,
  description_ja text,
  spotify_id text,
  youtube_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_id, slug)
);

create index if not exists albums_public_order_idx
  on public.albums (artist_id, is_published, sort_order asc, release_date desc);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  title text not null,
  track_number integer not null,
  duration integer check (duration is null or duration >= 0),
  is_title boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (album_id, track_number)
);

create index if not exists tracks_album_order_idx
  on public.tracks (album_id, track_number asc);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists(id) on delete cascade,
  title_ko text not null,
  title_en text,
  title_ja text,
  content_ko text,
  content_en text,
  content_ja text,
  category_ko text not null default '공지',
  category_en text default 'Notice',
  category_ja text default 'お知らせ',
  date date not null default current_date,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_global_index
  on public.notices (is_published, published_at desc)
  where artist_id is null;

create index if not exists notices_artist_index
  on public.notices (artist_id, is_published, published_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists artists_set_updated_at on public.artists;
create trigger artists_set_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

drop trigger if exists artist_members_set_updated_at on public.artist_members;
create trigger artist_members_set_updated_at
before update on public.artist_members
for each row execute function public.set_updated_at();

drop trigger if exists albums_set_updated_at on public.albums;
create trigger albums_set_updated_at
before update on public.albums
for each row execute function public.set_updated_at();

drop trigger if exists tracks_set_updated_at on public.tracks;
create trigger tracks_set_updated_at
before update on public.tracks
for each row execute function public.set_updated_at();

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at
before update on public.notices
for each row execute function public.set_updated_at();

alter table public.artists enable row level security;
alter table public.artist_members enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.notices enable row level security;
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

drop policy if exists "public read artists" on public.artists;
create policy "public read artists"
on public.artists for select
using (true);

drop policy if exists "public read artist members" on public.artist_members;
create policy "public read artist members"
on public.artist_members for select
using (true);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "public read published albums" on public.albums;
create policy "public read published albums"
on public.albums for select
using (is_published = true and published_at <= now());

drop policy if exists "public read tracks for published albums" on public.tracks;
create policy "public read tracks for published albums"
on public.tracks for select
using (
  exists (
    select 1
    from public.albums
    where albums.id = tracks.album_id
      and albums.is_published = true
      and albums.published_at <= now()
  )
);

drop policy if exists "public read published notices" on public.notices;
create policy "public read published notices"
on public.notices for select
using (is_published = true and published_at <= now());

drop policy if exists "admin manage artists" on public.artists;
create policy "admin manage artists"
on public.artists for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manage albums" on public.albums;
create policy "admin manage albums"
on public.albums for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manage artist members" on public.artist_members;
create policy "admin manage artist members"
on public.artist_members for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manage tracks" on public.tracks;
create policy "admin manage tracks"
on public.tracks for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manage notices" on public.notices;
create policy "admin manage notices"
on public.notices for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.artists (slug, name)
values ('rescene', 'RESCENE')
on conflict (slug) do update set name = excluded.name;
