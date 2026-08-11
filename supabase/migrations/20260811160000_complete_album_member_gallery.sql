-- Complete the 10 album x 5 member gallery matrix.
-- Album-era images come from the import manifest. RESCENE X ??? uses the
-- existing official member profile because no member-specific era set exists.

do $$
declare
  v_artist_id uuid;
  v_album_id uuid;
  v_member_id uuid;
  v_profile_url text;
  v_gallery record;
  v_image_url text;
begin
  select id into strict v_artist_id from public.artists where slug = 'rescene';

  for v_gallery in
    select * from (values
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
      ('a1400000-0000-4000-8000-000000000030'::uuid, 'YoYo', 'zena', 'ZENA', 'yoyo-zena.webp'),
      ('a1400000-0000-4000-8000-000000000031'::uuid, 'RESCENE X ???', 'woni', 'WONI', null),
      ('a1400000-0000-4000-8000-000000000032'::uuid, 'RESCENE X ???', 'liv', 'LIV', null),
      ('a1400000-0000-4000-8000-000000000033'::uuid, 'RESCENE X ???', 'minami', 'MINAMI', null),
      ('a1400000-0000-4000-8000-000000000034'::uuid, 'RESCENE X ???', 'may', 'MAY', null),
      ('a1400000-0000-4000-8000-000000000035'::uuid, 'RESCENE X ???', 'zena', 'ZENA', null)
    ) as gallery(id, album_title, member_slug, member_name, filename)
  loop
    select id into strict v_album_id from public.albums where artist_id = v_artist_id and title = v_gallery.album_title;
    select id, image_url into strict v_member_id, v_profile_url
    from public.artist_members where artist_id = v_artist_id and slug = v_gallery.member_slug;

    v_image_url := case when v_gallery.filename is null then v_profile_url else
      'https://kjsqwfhqjvekahacvfnc.supabase.co/storage/v1/object/public/artist-assets/' || v_artist_id || '/gallery/themuze/' || v_gallery.filename
    end;

    update public.artist_gallery
    set image_url = v_image_url,
        caption = v_gallery.album_title || ' — ' || v_gallery.member_name,
        sort_order = 1,
        is_published = true
    where id = (
      select id from public.artist_gallery
      where artist_id = v_artist_id and album_id = v_album_id and member_id = v_member_id
      order by sort_order, created_at
      limit 1
    );

    if not found then
      insert into public.artist_gallery (id, artist_id, album_id, member_id, image_url, caption, sort_order, is_published)
      values (v_gallery.id, v_artist_id, v_album_id, v_member_id, v_image_url,
        v_gallery.album_title || ' — ' || v_gallery.member_name, 1, true)
      on conflict (id) do update set
        artist_id = excluded.artist_id,
        album_id = excluded.album_id,
        member_id = excluded.member_id,
        image_url = excluded.image_url,
        caption = excluded.caption,
        sort_order = excluded.sort_order,
        is_published = excluded.is_published;
    end if;
  end loop;
end
$$;
