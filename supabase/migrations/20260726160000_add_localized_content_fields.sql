-- Additive multilingual content fields.
-- Legacy canonical columns stay in place so older clients remain compatible.

alter table public.artists
  add column if not exists name_ko text,
  add column if not exists name_en text,
  add column if not exists name_ja text;

alter table public.artist_members
  add column if not exists name_ko text,
  add column if not exists name_en text,
  add column if not exists name_ja text;

alter table public.albums
  add column if not exists title_ko text,
  add column if not exists title_en text,
  add column if not exists title_ja text;

alter table public.tracks
  add column if not exists title_ko text,
  add column if not exists title_en text,
  add column if not exists title_ja text;

alter table public.artist_scenes
  add column if not exists title_ko text,
  add column if not exists title_en text,
  add column if not exists title_ja text;

alter table public.artist_schedules
  add column if not exists location_ko text,
  add column if not exists location_en text,
  add column if not exists location_ja text;

update public.artists
set
  name_ko = coalesce(nullif(btrim(name_ko), ''), name),
  name_en = coalesce(nullif(btrim(name_en), ''), eng_name)
where name_ko is null
   or btrim(name_ko) = ''
   or (name_en is null and eng_name is not null);

update public.artist_members
set
  name_ko = coalesce(nullif(btrim(name_ko), ''), name),
  name_en = coalesce(nullif(btrim(name_en), ''), eng_name)
where name_ko is null
   or btrim(name_ko) = ''
   or (name_en is null and eng_name is not null);

update public.albums
set title_ko = title
where title_ko is null or btrim(title_ko) = '';

update public.tracks
set title_ko = title
where title_ko is null or btrim(title_ko) = '';

update public.artist_scenes
set title_ko = title
where title_ko is null or btrim(title_ko) = '';

update public.artist_schedules
set location_ko = location
where location is not null
  and (location_ko is null or btrim(location_ko) = '');

comment on column public.artists.name is 'Legacy canonical Korean/default name; kept for compatibility.';
comment on column public.artists.eng_name is 'Legacy canonical English name; kept for compatibility.';
comment on column public.albums.title is 'Legacy canonical album title; kept for compatibility.';
comment on column public.tracks.title is 'Legacy canonical track title; kept for compatibility.';
comment on column public.artist_scenes.title is 'Legacy canonical scene title; kept for compatibility.';
comment on column public.artist_schedules.location is 'Legacy canonical location; kept for compatibility.';
