alter table public.artist_scenes
  add column if not exists link_url text;

comment on column public.artist_scenes.link_url is
  'Optional HTTP(S) URL or site-relative path opened from the scene arrow button.';
