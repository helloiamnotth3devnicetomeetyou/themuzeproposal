-- Flexible official account links for artists and individual members.

alter table public.artists
  add column if not exists social_links jsonb not null default '[]'::jsonb;

alter table public.artist_members
  add column if not exists social_links jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'artists_social_links_is_array'
  ) then
    alter table public.artists
      add constraint artists_social_links_is_array
      check (jsonb_typeof(social_links) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'artist_members_social_links_is_array'
  ) then
    alter table public.artist_members
      add constraint artist_members_social_links_is_array
      check (jsonb_typeof(social_links) = 'array');
  end if;
end $$;
