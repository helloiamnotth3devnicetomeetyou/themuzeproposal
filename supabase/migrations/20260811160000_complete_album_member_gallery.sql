-- Complete the album x member gallery matrix with the imported era images.
-- Existing gallery rows retain their IDs, so this also works on populated databases.

with gallery (id, album_title, member_slug, member_name, filename) as (
  values
    ('a1400000-0000-4000-8000-000000000001'::uuid, 'lip bomb', 'woni', 'WONI', 'lip-bomb-woni.webp'),
    ('a1400000-0000-4000-8000-000000000002'::uuid, 'lip bomb', 'liv', 'LIV', 'lip-bomb-liv.webp'),
    ('a1400000-0000-4000-8000-000000000003'::uuid, 'lip bomb', 'minami', 'MINAMI', 'lip-bomb-minami.webp'),
    ('a1400000-0000-4000-8000-000000000004'::uuid, 'lip bomb', 'may', 'MAY', 'lip-bomb-may.webp'),
    ('a1400000-0000-4000-8000-000000000005'::uuid, 'lip bomb', 'zena', 'ZENA', 'lip-bomb-zena.webp'),
    ('a1400000-0000-4000-8000-000000000006'::uuid, 'Heart Drop', 'woni', 'WONI', 'heart-drop-woni.webp'),
    ('a1400000-0000-4000-8000-000000000007'::uuid, 'Heart Drop', 'liv', 'LIV', 'heart-drop-liv.webp'),
    ('a1400000-0000-4000-8000-000000000008'::uuid, 'Heart Drop', 'minami', 'MINAMI', 'heart-drop-minami.webp'),
    ('a1400000-0000-4000-8000-000000000009'::uuid, 'Heart Drop', 'may', 'MAY', 'heart-drop-may.webp'),
    ('a1400000-0000-4000-8000-000000000010'::uuid, 'Heart Drop', 'zena', 'ZENA', 'heart-drop-zena.webp'),
    ('a1400000-0000-4000-8000-000000000011'::uuid, 'Dearest', 'woni', 'WONI', 'dearest-woni.webp'),
    ('a1400000-0000-4000-8000-000000000012'::uuid, 'Dearest', 'liv', 'LIV', 'dearest-liv.webp'),
    ('a1400000-0000-4000-8000-000000000013'::uuid, 'Dearest', 'minami', 'MINAMI', 'dearest-minami.webp'),
    ('a1400000-0000-4000-8000-000000000014'::uuid, 'Dearest', 'may', 'MAY', 'dearest-may.webp'),
    ('a1400000-0000-4000-8000-000000000015'::uuid, 'Dearest', 'zena', 'ZENA', 'dearest-zena.webp'),
    ('a1400000-0000-4000-8000-000000000016'::uuid, 'SCENEDROME', 'woni', 'WONI', 'scenedrome-woni.webp'),
    ('a1400000-0000-4000-8000-000000000017'::uuid, 'SCENEDROME', 'liv', 'LIV', 'scenedrome-liv.webp'),
    ('a1400000-0000-4000-8000-000000000018'::uuid, 'SCENEDROME', 'minami', 'MINAMI', 'scenedrome-minami.webp'),
    ('a1400000-0000-4000-8000-000000000019'::uuid, 'SCENEDROME', 'may', 'MAY', 'scenedrome-may.webp'),
    ('a1400000-0000-4000-8000-000000000020'::uuid, 'SCENEDROME', 'zena', 'ZENA', 'scenedrome-zena.webp'),
    ('a1400000-0000-4000-8000-000000000021'::uuid, 'Re:Scene', 'woni', 'WONI', 're-scene-woni.webp'),
    ('a1400000-0000-4000-8000-000000000022'::uuid, 'Re:Scene', 'liv', 'LIV', 're-scene-liv.webp'),
    ('a1400000-0000-4000-8000-000000000023'::uuid, 'Re:Scene', 'minami', 'MINAMI', 're-scene-minami.webp'),
    ('a1400000-0000-4000-8000-000000000024'::uuid, 'Re:Scene', 'may', 'MAY', 're-scene-may.webp'),
    ('a1400000-0000-4000-8000-000000000025'::uuid, 'Re:Scene', 'zena', 'ZENA', 're-scene-zena.webp'),
    ('a1400000-0000-4000-8000-000000000026'::uuid, 'YoYo', 'woni', 'WONI', 'yoyo-woni.webp'),
    ('a1400000-0000-4000-8000-000000000027'::uuid, 'YoYo', 'liv', 'LIV', 'yoyo-liv.webp'),
    ('a1400000-0000-4000-8000-000000000028'::uuid, 'YoYo', 'minami', 'MINAMI', 'yoyo-minami.webp'),
    ('a1400000-0000-4000-8000-000000000029'::uuid, 'YoYo', 'may', 'MAY', 'yoyo-may.webp'),
    ('a1400000-0000-4000-8000-000000000030'::uuid, 'YoYo', 'zena', 'ZENA', 'yoyo-zena.webp')
), rows_to_upsert as (
  select
    coalesce(existing.id, gallery.id) as id,
    artist.id as artist_id,
    album.id as album_id,
    member.id as member_id,
    'https://kjsqwfhqjvekahacvfnc.supabase.co/storage/v1/object/public/artist-assets/' || artist.id || '/gallery/themuze/' || gallery.filename as image_url,
    gallery.album_title || ' — ' || gallery.member_name as caption
  from gallery
  join public.artists as artist on artist.slug = 'rescene'
  join public.albums as album on album.artist_id = artist.id and album.title = gallery.album_title
  join public.artist_members as member on member.artist_id = artist.id and member.slug = gallery.member_slug
  left join lateral (
    select id
    from public.artist_gallery
    where artist_id = artist.id and album_id = album.id and member_id = member.id
    order by sort_order, created_at
    limit 1
  ) as existing on true
)
insert into public.artist_gallery (id, artist_id, album_id, member_id, image_url, caption, sort_order, is_published)
select id, artist_id, album_id, member_id, image_url, caption, 1, true
from rows_to_upsert
on conflict (id) do update set
  artist_id = excluded.artist_id,
  album_id = excluded.album_id,
  member_id = excluded.member_id,
  image_url = excluded.image_url,
  caption = excluded.caption,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;
