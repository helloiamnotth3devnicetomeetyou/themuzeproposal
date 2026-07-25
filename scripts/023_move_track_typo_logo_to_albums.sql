-- Move typography logo ownership from tracks to albums.
-- Safe to run whether or not the legacy tracks.logo_url column exists.

alter table public.albums
  add column if not exists typo_logo_url text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tracks'
      and column_name = 'logo_url'
  ) then
    execute $migration$
      update public.albums as album
      set typo_logo_url = (
        select track.logo_url
        from public.tracks as track
        where track.album_id = album.id
          and track.logo_url is not null
          and btrim(track.logo_url) <> ''
        order by track.is_title desc, track.track_number asc
        limit 1
      )
      where album.typo_logo_url is null
        and exists (
          select 1
          from public.tracks as track
          where track.album_id = album.id
            and track.logo_url is not null
            and btrim(track.logo_url) <> ''
        )
    $migration$;
  end if;
end
$$;

comment on column public.albums.typo_logo_url is
  'Album-level SVG typography logo used in the home hero.';
