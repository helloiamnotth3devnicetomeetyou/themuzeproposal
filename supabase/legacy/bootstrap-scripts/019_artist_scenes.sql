-- Interactive artist hero scenes and member silhouette regions.
-- Run after 007_artist_profile_schema.sql.

create table if not exists public.artist_scenes (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null default '',
  image_url text not null,
  image_width integer,
  image_height integer,
  is_hero boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_scenes_image_width_positive check (image_width is null or image_width > 0),
  constraint artist_scenes_image_height_positive check (image_height is null or image_height > 0)
);

create unique index if not exists artist_scenes_one_hero_idx
  on public.artist_scenes(artist_id)
  where is_hero = true;

create index if not exists artist_scenes_artist_order_idx
  on public.artist_scenes(artist_id, sort_order, created_at);

create table if not exists public.artist_scene_members (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.artist_scenes(id) on delete cascade,
  member_id uuid not null references public.artist_members(id) on delete cascade,
  -- A smooth, normalized outer contour used for hit testing and as the
  -- visual fallback when no pixel-perfect alpha mask has been uploaded.
  outline jsonb not null default '[]'::jsonb,
  -- Optional same-size transparent PNG/WebP. Its alpha channel is the exact
  -- member silhouette used to re-expose the selected person.
  mask_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_scene_members_unique unique (scene_id, member_id),
  constraint artist_scene_members_outline_array check (jsonb_typeof(outline) = 'array'),
  constraint artist_scene_members_outline_minimum check (jsonb_array_length(outline) >= 3)
);

create index if not exists artist_scene_members_scene_idx
  on public.artist_scene_members(scene_id, sort_order);

create index if not exists artist_scene_members_member_idx
  on public.artist_scene_members(member_id, scene_id);

drop trigger if exists artist_scenes_set_updated_at on public.artist_scenes;
create trigger artist_scenes_set_updated_at
before update on public.artist_scenes
for each row execute function public.set_updated_at();

drop trigger if exists artist_scene_members_set_updated_at on public.artist_scene_members;
create trigger artist_scene_members_set_updated_at
before update on public.artist_scene_members
for each row execute function public.set_updated_at();

alter table public.artist_scenes enable row level security;
alter table public.artist_scene_members enable row level security;

drop policy if exists "public read published artist scenes" on public.artist_scenes;
create policy "public read published artist scenes"
on public.artist_scenes for select
using (is_published = true);

drop policy if exists "admin manage artist scenes" on public.artist_scenes;
create policy "admin manage artist scenes"
on public.artist_scenes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read published scene members" on public.artist_scene_members;
create policy "public read published scene members"
on public.artist_scene_members for select
using (
  exists (
    select 1
    from public.artist_scenes scene
    where scene.id = scene_id
      and scene.is_published = true
  )
);

drop policy if exists "admin manage artist scene members" on public.artist_scene_members;
create policy "admin manage artist scene members"
on public.artist_scene_members for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Keep existing artist hero images visible immediately after this migration.
insert into public.artist_scenes (
  artist_id,
  title,
  image_url,
  is_hero,
  is_published,
  sort_order
)
select
  artist.id,
  'Main scene',
  artist.image_url,
  true,
  artist.is_active,
  0
from public.artists artist
where artist.image_url is not null
  and artist.image_url <> ''
  and not exists (
    select 1
    from public.artist_scenes scene
    where scene.artist_id = artist.id
  );

notify pgrst, 'reload schema';
