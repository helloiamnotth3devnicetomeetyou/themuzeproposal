begin;

-- Theme colors are rendered into inline styles and CSS custom properties.
-- Keep the persisted value to the only format the editors support.
alter table public.artists
  add constraint artists_color_hex_check
  check (color is null or color ~ '^#[0-9A-Fa-f]{6}$') not valid;

alter table public.artist_members
  add constraint artist_members_color_hex_check
  check (color is null or color ~ '^#[0-9A-Fa-f]{6}$') not valid;

alter table public.albums
  add constraint albums_color_hex_check
  check (color is null or color ~ '^#[0-9A-Fa-f]{6}$') not valid;

commit;
