-- Canonicalize the track title flag used by the application and seed data.
-- The legacy is_title_track column was retained in production after is_title was introduced.

alter table public.tracks
  add column if not exists is_title boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tracks'
      and column_name = 'is_title_track'
  ) then
    update public.tracks
    set is_title = is_title or is_title_track
    where is_title_track and not is_title;

    alter table public.tracks drop column is_title_track;
  end if;
end;
$$;