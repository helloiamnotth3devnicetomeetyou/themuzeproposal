-- =============================================
-- RESCENE Full Discography Seed
-- Run AFTER 001_discography.sql
-- Source: themuze.kr/discography + namu.wiki + kpopalbums.com
-- Albums ordered newest first (sort_order 1 = newest)
-- =============================================

-- ------------------------------------------------
-- Helper: ensure artist exists
-- ------------------------------------------------
insert into public.artists (slug, name)
values ('rescene', 'RESCENE')
on conflict (slug) do update set name = excluded.name;

-- ------------------------------------------------
-- Albums
-- ------------------------------------------------
do $$
declare
  v_artist_id uuid;
begin
  select id into v_artist_id from public.artists where slug = 'rescene';

  -- Pretty Girl  (Special Single, 2026-07-08)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     spotify_id, sort_order, is_published, published_at)
  values
    (v_artist_id, 'pretty-girl', 'Pretty Girl', 'Special Single', '2026-07-08',
     '/images/hero_1.webp', '#FC6FCF',
     'KARA의 2008년 히트곡을 리센느만의 감성으로 재해석한 스페셜 리메이크 싱글.',
     'A special remake single reinterpreting KARA''s 2008 hit with RESCENE''s own charm.',
     'KARAの2008年ヒット曲をRESCENEならではの感性でリメイクしたスペシャルシングル。',
     '5fooRwtJmNvt64WhLN5Chy', 1, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- Runaway  (Digital Single, 2026-04-08)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     spotify_id, sort_order, is_published, published_at)
  values
    (v_artist_id, 'runaway', 'Runaway', 'Digital Single', '2026-04-08',
     '/images/hero_2.webp', '#2C4B43',
     '몽환적이면서도 파워풀한 보컬과 딥 그린 비주얼이 어우러진 디지털 싱글.',
     'A dreamy yet powerful digital single combining unique vocals with deep green aesthetics.',
     '幻想的でありながらパワフルなボーカルとディープグリーンが調和したデジタルシングル。',
     '6wL6HetMdQwsTqZzCBpGGJ', 2, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- lip bomb  (Mini Album 3, 2025-11-25)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     spotify_id, sort_order, is_published, published_at)
  values
    (v_artist_id, 'lip-bomb', 'lip bomb', 'Mini Album', '2025-11-25',
     '/images/hero_3.webp', '#FB689E',
     '''lip balm(립밤)''에서 ''balm''을 ''bomb(폭탄)''으로 대체한 콘셉트. 촉촉하게 스며들면서도 강렬하게 터지는 리센느만의 에너지를 담은 미니 3집. 각 트랙은 베리 계열의 향기를 테마로 한다.',
     'The 3rd mini album — ''lip balm'' reimagined as ''lip bomb'' — where each track is paired with a berry scent, capturing both the soft and explosive sides of RESCENE.',
     '「lip balm」の「balm」を「bomb」に置き換えたコンセプトで、リップバームのように馴染みながら爆発的なエネルギーを放つRESCENEの3rdミニアルバム。各曲はベリー系の香りをテーマとする。',
     '3H7MTJVprjcvlvCeQdRe1H', 3, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- Heart Drop  (Pre-release Single, 2025-11-06)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     sort_order, is_published, published_at)
  values
    (v_artist_id, 'heart-drop', 'Heart Drop', 'Pre-release Single', '2025-11-06',
     '/images/og_image.png', '#E285B0',
     '미니 3집 [lip bomb]의 기대감을 높이는 로맨틱하고 사랑스러운 선공개 트랙.',
     'A romantic pre-release single building excitement for the 3rd mini album [lip bomb].',
     '3rdミニアルバム[lip bomb]への期待感を高める、ロマンティックで愛らしい先行シングル。',
     4, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- Dearest  (Single Album 2, 2025-07-02)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     sort_order, is_published, published_at)
  values
    (v_artist_id, 'dearest', 'Dearest', 'Single Album', '2025-07-02',
     '/images/hero_5.webp', '#3D9C2E',
     '풋풋한 설렘과 고유한 향기를 담아 한층 성숙해진 보컬을 보여주는 싱글 2집.',
     'The 2nd single album expressing fresh romantic feelings with a more mature vocal performance.',
     '初々しいときめきと独自の香りを込め、一段と成熟したボーカルを披露するシングル2集。',
     5, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- Glow Up  (Mini Album 2, 2025-02-05)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     spotify_id, sort_order, is_published, published_at)
  values
    (v_artist_id, 'glow-up', 'Glow Up', 'Mini Album', '2025-02-05',
     '/images/disc_2.png', '#8B008B',
     '외모를 넘어 스타일, 자신감, 실력까지 성장한 리센느의 이야기를 담은 미니 2집. 맑고 깨끗한 비누향으로 새롭게 변화된 ''나''와 ''우리''를 표현했다.',
     'The 2nd mini album chronicling RESCENE''s growth — in style, confidence, and artistry — expressed through a clean soapy scent representing a renewed self.',
     'スタイル、自信、実力まで成長したRESCENEの物語を担った2ndミニアルバム。清潔な石鹸の香りで新しく変化した「私」と「私たち」を表現している。',
     '0Ka3xa6oOWmW1hIjjjxEW0', 6, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- SCENEDROME  (Mini Album 1, 2024-08-27)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     spotify_id, sort_order, is_published, published_at)
  values
    (v_artist_id, 'scenedrome', 'SCENEDROME', 'Mini Album', '2024-08-27',
     '/images/disc_1.png', '#01ACCE',
     '''SYNDROME''과 ''SCENE''을 결합한 앨범명처럼, 용연(Ambergris)의 향을 테마로 바다에서 도시로 온 MZ 세대 인어공주가 되어 진정한 가치를 발견하는 이야기를 담은 미니 1집.',
     'RESCENE''s 1st mini album: themed around Ambergris — it tells the story of a mermaid who travels from the sea to the city in search of what truly matters.',
     '「SYNDROME」と「SCENE」を組み合わせたアルバム名のように、竜涎香(Ambergris)の香りをテーマに、海から都市へやってきたMZ世代の人魚姫が真の価値を発見する物語を描く1stミニアルバム。',
     '0msC9kyzmtznRwIxwafISH', 7, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja, spotify_id = excluded.spotify_id,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- Re:Scene  (Single Album 1, 2024-03-26)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     sort_order, is_published, published_at)
  values
    (v_artist_id, 're-scene', 'Re:Scene', 'Single Album', '2024-03-26',
     '/images/hero_4.webp', '#D80F17',
     '''Scene(장면)''과 ''Scent(향기)''의 의미를 동시에 지닌 리센느의 정식 데뷔 싱글 1집. 프루스트 효과를 테마로, 향기와 음악이 한 번 맡으면 잊을 수 없는 기억을 만들어낸다.',
     'RESCENE''s debut single — combining the meanings of ''Scene'' and ''Scent'' — built around the Proust Effect: music and fragrance that stay with you forever.',
     '「Scene(場面)」と「Scent(香り)」の意味を同時に持つRESCENEのデビューシングル1集。プルースト効果をテーマに、香りと音楽が忘れられない記憶を作り出す。',
     8, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

  -- YoYo  (Pre-release Single, 2024-02-29)
  insert into public.albums
    (artist_id, slug, title, type, release_date, cover_url, color,
     description_ko, description_en, description_ja,
     sort_order, is_published, published_at)
  values
    (v_artist_id, 'yoyo', 'YoYo', 'Pre-release Single', '2024-02-29',
     '/images/hero_4.webp', '#FFA500',
     '데뷔 전 선공개 싱글. 플로럴(Floral) 향을 담은 경쾌하고 설레는 분위기로 리센느의 첫 인사를 전하는 곡.',
     'Pre-debut pre-release single with a floral scent theme — a bright, exciting first hello from RESCENE.',
     'デビュー前の先行シングル。フローラルの香りをテーマにした軽快でときめく雰囲気で、RESCENEの最初の挨拶となる一曲。',
     9, true, now())
  on conflict (artist_id, slug) do update
    set title = excluded.title, type = excluded.type, release_date = excluded.release_date,
        cover_url = excluded.cover_url, color = excluded.color,
        description_ko = excluded.description_ko, description_en = excluded.description_en,
        description_ja = excluded.description_ja,
        sort_order = excluded.sort_order, is_published = excluded.is_published,
        published_at = excluded.published_at;

end $$;

-- ------------------------------------------------
-- Tracks  (upsert by album + track_number)
-- ------------------------------------------------
do $$
declare
  v_album_id uuid;
  v_artist_id uuid;
begin
  select id into v_artist_id from public.artists where slug = 'rescene';

  -- ---- YoYo (Pre-release Single) ----
  select id into v_album_id from public.albums
  where slug = 'yoyo' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'YoYo', 1, true)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- Re:Scene (Single Album 1) ----
  select id into v_album_id from public.albums
  where slug = 're-scene' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'YoYo', 1, false),
    (v_album_id, 'UhUh', 2, true)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- SCENEDROME (Mini Album 1) ----
  select id into v_album_id from public.albums
  where slug = 'scenedrome' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'Lucky you',   1, false),
    (v_album_id, 'LOVE ATTACK', 2, true),
    (v_album_id, 'New World',   3, false),
    (v_album_id, 'Pinball',     4, true)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- Glow Up (Mini Album 2) ----
  select id into v_album_id from public.albums
  where slug = 'glow-up' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'CRASH',        1, false),
    (v_album_id, 'Glow Up',      2, true),
    (v_album_id, 'Going on',     3, false),
    (v_album_id, 'In my lotion', 4, false),
    (v_album_id, 'Cotton Candy', 5, false)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- Dearest (Single Album 2) ----
  select id into v_album_id from public.albums
  where slug = 'dearest' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'Deja Vu', 1, true),
    (v_album_id, 'Mood',    2, false)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- Heart Drop (Pre-release Single) ----
  select id into v_album_id from public.albums
  where slug = 'heart-drop' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'Heart Drop', 1, true)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- lip bomb (Mini Album 3) ----
  -- Each track carries a berry-scent concept
  select id into v_album_id from public.albums
  where slug = 'lip-bomb' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'Heart Drop', 1, true),   -- Cranberry scent  (double title)
    (v_album_id, 'Bloom',      2, true),   -- Blackberry scent (double title)
    (v_album_id, 'Love Echo',  3, false),  -- Raspberry scent
    (v_album_id, 'Hello XO',   4, false),  -- Strawberry scent
    (v_album_id, 'MVP',        5, false)   -- Blueberry scent
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- Runaway (Digital Single) ----
  select id into v_album_id from public.albums
  where slug = 'runaway' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'Runaway', 1, true)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

  -- ---- Pretty Girl (Special Single) ----
  select id into v_album_id from public.albums
  where slug = 'pretty-girl' and artist_id = v_artist_id;

  insert into public.tracks (album_id, title, track_number, is_title) values
    (v_album_id, 'Pretty Girl', 1, true)
  on conflict (album_id, track_number) do update
    set title = excluded.title, is_title = excluded.is_title;

end $$;
