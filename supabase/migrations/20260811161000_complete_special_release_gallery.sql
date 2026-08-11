-- Ensure the special release has a profile image for each member.
-- It has no era-specific image set, so member profile images are intentional.

insert into public.artist_gallery (
  artist_id, album_id, member_id, image_url, caption, sort_order, is_published
)
select
  artist.id,
  album.id,
  member.id,
  member.image_url,
  album.title || ' — ' || member.name,
  1,
  true
from public.artists as artist
join public.albums as album
  on album.artist_id = artist.id
cross join public.artist_members as member
where artist.slug = 'rescene'
  and album.title = 'RESCENE X ???'
  and member.artist_id = artist.id
  and not exists (
    select 1
    from public.artist_gallery as gallery
    where gallery.artist_id = artist.id
      and gallery.album_id = album.id
      and gallery.member_id = member.id
  );
