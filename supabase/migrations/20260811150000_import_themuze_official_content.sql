-- Official content import for the redesign proposal.
-- Sources: https://themuze.kr/discography, album detail pages, and https://themuze.kr/notice
-- Source images were copied to artist-assets by scripts/import-themuze-assets.mjs.

do $$
declare
  v_artist_id uuid;
  v_album_id uuid;
  v_member_id uuid;
  v_gallery record;
begin
  select id into v_artist_id from public.artists where slug = 'rescene';
  if v_artist_id is null then
    raise notice 'Skipping RESCENE content import because the artist seed is unavailable.';
    return;
  end if;

  update public.albums
  set youtube_url = case title
    when 'Pretty Girl' then 'https://www.youtube.com/watch?v=qZlu2j2SiBA'
    when 'Runaway' then 'https://www.youtube.com/watch?v=rsZwrTNklos'
    when 'lip bomb' then 'https://www.youtube.com/watch?v=MC6-82GRK5I'
    when 'Heart Drop' then 'https://www.youtube.com/watch?v=ByX8EZq8500'
    when 'Dearest' then 'https://www.youtube.com/watch?v=ZbO9PBdFRdc'
    when 'Glow Up' then 'https://www.youtube.com/watch?v=h0xUtrb_JBc'
    when 'SCENEDROME' then 'https://www.youtube.com/watch?v=9XttLI0oH0I'
    when 'Re:Scene' then 'https://www.youtube.com/watch?v=zpSejlkSXLA'
    when 'YoYo' then 'https://www.youtube.com/watch?v=uDYy2UyO1X4'
    else youtube_url
  end
  where artist_id = v_artist_id
    and title in ('Pretty Girl', 'Runaway', 'lip bomb', 'Heart Drop', 'Dearest', 'Glow Up', 'SCENEDROME', 'Re:Scene', 'YoYo');

  update public.tracks as track
  set youtube_url = mapping.url,
      music_video_url = mapping.url
  from public.albums as album,
    (values
      ('Pretty Girl', 'Pretty Girl', 'https://www.youtube.com/watch?v=qZlu2j2SiBA'),
      ('Runaway', 'Runaway', 'https://www.youtube.com/watch?v=rsZwrTNklos'),
      ('lip bomb', 'Heart Drop', 'https://www.youtube.com/watch?v=ByX8EZq8500'),
      ('lip bomb', 'Bloom', 'https://www.youtube.com/watch?v=MC6-82GRK5I'),
      ('Heart Drop', 'Heart Drop', 'https://www.youtube.com/watch?v=ByX8EZq8500'),
      ('Dearest', 'Deja Vu', 'https://www.youtube.com/watch?v=ZbO9PBdFRdc'),
      ('Glow Up', 'Glow Up', 'https://www.youtube.com/watch?v=h0xUtrb_JBc'),
      ('SCENEDROME', 'LOVE ATTACK', 'https://www.youtube.com/watch?v=9XttLI0oH0I'),
      ('SCENEDROME', 'Pinball', 'https://www.youtube.com/watch?v=B8JJ8RNM-60'),
      ('Re:Scene', 'UhUh', 'https://www.youtube.com/watch?v=zpSejlkSXLA'),
      ('Re:Scene', 'YoYo', 'https://www.youtube.com/watch?v=uDYy2UyO1X4'),
      ('YoYo', 'YoYo', 'https://www.youtube.com/watch?v=uDYy2UyO1X4')
    ) as mapping(album_title, track_title, url)
  where track.album_id = album.id
    and album.artist_id = v_artist_id
    and album.title = mapping.album_title
    and track.title = mapping.track_title;

  for v_gallery in
    select * from (values
      ('a1100000-0000-4000-8000-000000000001'::uuid, 'Pretty Girl', 'woni', 'Pretty Girl — WONI', 'pretty-girl-woni.webp'),
      ('a1100000-0000-4000-8000-000000000002'::uuid, 'Pretty Girl', 'liv', 'Pretty Girl — LIV', 'pretty-girl-liv.webp'),
      ('a1100000-0000-4000-8000-000000000003'::uuid, 'Pretty Girl', 'minami', 'Pretty Girl — MINAMI', 'pretty-girl-minami.webp'),
      ('a1100000-0000-4000-8000-000000000004'::uuid, 'Pretty Girl', 'may', 'Pretty Girl — MAY', 'pretty-girl-may.webp'),
      ('a1100000-0000-4000-8000-000000000005'::uuid, 'Pretty Girl', 'zena', 'Pretty Girl — ZENA', 'pretty-girl-zena.webp'),
      ('a1100000-0000-4000-8000-000000000006'::uuid, 'Runaway', 'woni', 'Runaway — WONI', 'runaway-woni.webp'),
      ('a1100000-0000-4000-8000-000000000007'::uuid, 'Runaway', 'liv', 'Runaway — LIV', 'runaway-liv.webp'),
      ('a1100000-0000-4000-8000-000000000008'::uuid, 'Runaway', 'minami', 'Runaway — MINAMI', 'runaway-minami.webp'),
      ('a1100000-0000-4000-8000-000000000009'::uuid, 'Runaway', 'may', 'Runaway — MAY', 'runaway-may.webp'),
      ('a1100000-0000-4000-8000-000000000010'::uuid, 'Runaway', 'zena', 'Runaway — ZENA', 'runaway-zena.webp'),
      ('a1100000-0000-4000-8000-000000000011'::uuid, 'Glow Up', 'woni', 'Glow Up — WONI', 'glow-up-woni.webp'),
      ('a1100000-0000-4000-8000-000000000012'::uuid, 'Glow Up', 'liv', 'Glow Up — LIV', 'glow-up-liv.webp'),
      ('a1100000-0000-4000-8000-000000000013'::uuid, 'Glow Up', 'minami', 'Glow Up — MINAMI', 'glow-up-minami.webp'),
      ('a1100000-0000-4000-8000-000000000014'::uuid, 'Glow Up', 'may', 'Glow Up — MAY', 'glow-up-may.webp'),
      ('a1100000-0000-4000-8000-000000000015'::uuid, 'Glow Up', 'zena', 'Glow Up — ZENA', 'glow-up-zena.webp')
    ) as gallery(id, album_title, member_slug, caption, filename)
  loop
    select id into v_album_id from public.albums where artist_id = v_artist_id and title = v_gallery.album_title;
    select id into v_member_id from public.artist_members where artist_id = v_artist_id and slug = v_gallery.member_slug;
    if v_album_id is null or v_member_id is null then
      continue;
    end if;

    update public.artist_gallery
    set image_url = 'https://kjsqwfhqjvekahacvfnc.supabase.co/storage/v1/object/public/artist-assets/' || v_artist_id || '/gallery/themuze/' || v_gallery.filename,
        caption = v_gallery.caption,
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
      values (
        v_gallery.id,
        v_artist_id,
        v_album_id,
        v_member_id,
        'https://kjsqwfhqjvekahacvfnc.supabase.co/storage/v1/object/public/artist-assets/' || v_artist_id || '/gallery/themuze/' || v_gallery.filename,
        v_gallery.caption,
        1,
        true
      )
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

-- Correct the five imported notices and fill their English/Japanese fields.
update public.notices set
  date = '2024-09-10',
  published_at = '2024-09-10 19:00:00+09',
  title_en = 'Application Notice for the September 11 MBC M Show Champion Pre-Recording and Mini Fan Meeting',
  title_ja = '9月11日 MBC M「ショーチャンピオン」事前収録・ミニファンミーティング参加申請',
  category_en = 'Broadcast Notice',
  category_ja = '公開放送',
  content_en = '<p>Applications were accepted for the September 11 pre-recording and mini fan meeting at MBC Dream Center in Ilsan. The pre-recording was scheduled for 8:40 a.m. KST, with check-in from 7:30 a.m. Up to 100 selected and on-site attendees could participate. Valid ID, the RESCENE light stick, both physical versions of SCENEDROME, and full-track download verification were required.</p>',
  content_ja = '<p>9月11日に一山MBCドリームセンターで行われる事前収録とミニファンミーティングの参加申請案内です。事前収録は午前8時40分予定、人数確認は午前7時30分から行われ、当選者および現場参加を含む最大100名が対象でした。身分証、RESCENEペンライト、SCENEDROME実物アルバム2種、全曲ダウンロード履歴が必要でした。</p>'
where id = '70e490b4-eb39-44d6-9f2b-5bedddbb684c';

update public.notices set
  date = '2024-09-04',
  published_at = '2024-09-04 21:00:00+09',
  title_en = 'Application Notice for the September 6 KBS2 Music Bank Live Broadcast',
  title_ja = '9月6日 KBS2「ミュージックバンク」生放送参加申請',
  category_en = 'Broadcast Notice',
  category_ja = '公開放送',
  content_en = '<p>The KBS2 Music Bank live broadcast took place on September 6, 2024, at KBS New Hall. Check-in was scheduled for 3:30 p.m., with the broadcast at approximately 5:10 p.m. KST. Fans needed valid ID, the RESCENE light stick, both physical versions of SCENEDROME, and full-track download verification.</p>',
  content_ja = '<p>2024年9月6日にKBS新館公開ホールで行われたKBS2「ミュージックバンク」生放送の参加申請案内です。人数確認は午後3時30分、放送は午後5時10分頃の予定でした。身分証、RESCENEペンライト、SCENEDROME実物アルバム2種、全曲ダウンロード履歴が必要でした。</p>'
where id = '06ce1953-7cca-4701-a58b-1d875890bae8';

update public.notices set
  date = '2024-08-28',
  published_at = '2024-08-28 12:00:00+09',
  title_en = 'Guidelines for Fan Letters and Support',
  title_ja = 'ファンレターおよびサポートに関するご案内',
  category_en = 'General Notice',
  category_ja = '総合案内',
  content_en = '<p>THE MUZE thanks fans for their love and support of RESCENE. Fan letters are accepted, but other gifts and support will generally be returned unless a separate support schedule is announced. Letters may be mailed to the designated address or handed to RESCENE staff at public broadcasts and in-person fan-sign events. Only letters and postcards may be enclosed.</p>',
  content_ja = '<p>RESCENEへの応援に感謝申し上げます。ファンレターは受け付けますが、別途サポート日程が案内されない限り、その他のプレゼントやサポートは返送されます。ファンレターは指定住所への郵送、公開放送、対面サイン会で担当者に渡すことができ、手紙・はがきのみ送付できます。</p>'
where id = 'b0093faa-a5e6-49d8-8f78-05574e44233d';

update public.notices set
  date = '2024-06-03',
  published_at = '2024-06-03 14:00:00+09',
  title_en = 'RESCENE Official Fandom Name Contest',
  title_ja = 'RESCENE公式ファンダム名募集のお知らせ',
  category_en = 'Notice',
  category_ja = 'お知らせ',
  content_en = '<p>Fans were invited to submit a meaningful official fandom name from June 3 to June 10, 2024. Multiple submissions were allowed through separate forms, and names had to be in Korean or English with pronunciation guidance. The selected entrant would receive group and member polaroids.</p>',
  content_ja = '<p>2024年6月3日から6月10日まで、RESCENEの公式ファンダム名を募集しました。応募は韓国語または英語で、英語の場合は読み方の記載が必要でした。採用者にはグループおよびメンバー別ポラロイドが贈呈されました。</p>'
where id = '0d62c79d-5d4d-4608-97a7-66cd6389d10c';

update public.notices set
  date = '2024-09-10',
  published_at = '2024-09-10 20:00:00+09',
  title_en = 'Application Notice for the September 11 MBC M Show Champion Live Broadcast',
  title_ja = '9月11日 MBC M「ショーチャンピオン」生放送参加申請',
  category_en = 'Broadcast Notice',
  category_ja = '公開放送',
  content_en = '<p>RESCENE fans could apply to attend the September 11, 2024 live broadcast at MBC Dream Center in Ilsan. Check-in was at 4:00 p.m. and the broadcast began at 5:00 p.m. KST. Applicants had to bring valid ID, the RESCENE light stick, both physical versions of SCENEDROME, and full-track download verification.</p>',
  content_ja = '<p>2024年9月11日に一山MBCドリームセンターで行われた生放送の参加申請案内です。人数確認は午後4時、放送は午後5時から行われました。身分証、RESCENEペンライト、SCENEDROME実物アルバム2種、全曲ダウンロード履歴が必要でした。</p>'
where id = '6f9c7905-cf29-48bc-95b7-3539cc579213';

do $$
declare
  v_artist_id uuid;
begin
  select id into v_artist_id from public.artists where slug = 'rescene';
  if v_artist_id is null then
    raise notice 'Skipping RESCENE notices and schedules because the artist seed is unavailable.';
    return;
  end if;

  insert into public.notices (
    id, artist_id, title_ko, title_en, title_ja, content_ko, content_en, content_ja,
    category_ko, category_en, category_ja, date, is_published, published_at
  ) values
  (
    'a1200000-0000-4000-8000-000000000001', null,
    'RESCENE 공식 홈페이지 이전 관련 공지',
    'Notice on the Relocation of RESCENE''s Official Website',
    'RESCENE公式サイト移転に関するお知らせ',
    '<p>2024년 11월 13일 RESCENE b.stage 공식 홈페이지가 오픈하며 기존 공식 홈페이지는 통합 운영됩니다. themuze.kr에서는 이후 앨범 소개와 이벤트 정보를 업데이트할 예정입니다.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=126056475">공식 원문 보기</a></p>',
    '<p>RESCENE''s official b.stage website opened on November 13, 2024, and the existing official website was consolidated into it. Album introductions and event information will continue to be updated on themuze.kr.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=126056475">View the official notice</a></p>',
    '<p>2024年11月13日にRESCENEのb.stage公式サイトがオープンし、従来の公式サイトは統合運営となりました。themuze.krでは今後もアルバム紹介とイベント情報を更新する予定です。</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=126056475">公式原文を見る</a></p>',
    '공지', 'Notice', 'お知らせ', '2024-11-11', true, '2024-11-11 12:00:00+09'
  ),
  (
    'a1200000-0000-4000-8000-000000000002', null,
    '더뮤즈엔터테인먼트 공식 사이트 본인인증 의무화 안내',
    'Mandatory Identity Verification on THE MUZE Entertainment''s Official Website',
    'THE MUZE ENTERTAINMENT公式サイト本人認証必須化のお知らせ',
    '<p>개인정보 수집을 최소화하고 사이트 보안을 강화하기 위해 2024년 5월 8일부터 본인인증을 완료한 회원만 게시판 작성 등 일부 서비스를 이용할 수 있습니다. 해외 거주자는 영문 홈페이지에서 가입할 수 있습니다.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=19955709">공식 원문 보기</a></p>',
    '<p>To minimize personal-data collection and strengthen site security, identity verification became required for account registration and services such as bulletin-board posting from May 8, 2024. Overseas residents may register through the English website.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=19955709">View the official notice</a></p>',
    '<p>個人情報の収集を最小限に抑え、サイトのセキュリティを強化するため、2024年5月8日より本人認証を完了した会員のみ掲示板への投稿など一部サービスを利用できます。海外在住者は英語サイトから登録できます。</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=19955709">公式原文を見る</a></p>',
    '통합공지', 'General Notice', '総合案内', '2024-04-19', true, '2024-04-19 12:00:00+09'
  ),
  (
    'a1200000-0000-4000-8000-000000000003', null,
    '2024 메이 생일 서포트 관련 안내',
    'Guidelines for MAY''s 2024 Birthday Support',
    '2024年MAY誕生日サポートに関するご案内',
    '<p>8월 19일 메이의 생일 서포트는 지정된 신청 폼과 담당자를 통해서만 진행되었습니다. 신선식품·생화, 현금성 물품, 관세나 착불 비용이 발생하는 배송품은 접수하지 않았습니다.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=69961287">공식 원문 보기</a></p>',
    '<p>Birthday support for MAY on August 19 was accepted only through the designated application form and support manager. Perishable food, fresh flowers, cash-equivalent items, and shipments requiring customs or collect-on-delivery fees were not accepted.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=69961287">View the official notice</a></p>',
    '<p>8月19日のMAYの誕生日サポートは、指定の申請フォームと担当者を通じてのみ受け付けました。生鮮食品・生花、現金化できる品、関税や着払いが発生する配送品は受け付けていません。</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=69961287">公式原文を見る</a></p>',
    '통합공지', 'General Notice', '総合案内', '2024-08-16', true, '2024-08-16 12:00:00+09'
  ),
  (
    'a1200000-0000-4000-8000-000000000004', null,
    'RESCENE(리센느) DearU bubble 오픈 안내',
    'RESCENE DearU bubble Service Launch Notice',
    'RESCENE DearU bubbleオープンのお知らせ',
    '<p>RESCENE DearU bubble 서비스가 2024년 4월 25일 오전 11시에 오픈했습니다. 이용자는 존댓말을 사용하고 비방, 허위 정보, 무례한 발언 및 다른 아티스트·팬덤에 관한 부정적 발언을 삼가야 합니다.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=20503300">공식 원문 보기</a></p>',
    '<p>RESCENE''s DearU bubble service launched at 11:00 a.m. KST on April 25, 2024. Users were asked to use respectful language and refrain from abusive messages, false information, personal attacks, and negative comments about other artists or fandoms.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=20503300">View the official notice</a></p>',
    '<p>RESCENEのDearU bubbleサービスは2024年4月25日午前11時に開始しました。利用者には敬語の使用と、誹謗中傷、虚偽情報、無礼な発言、他のアーティストやファンダムへの否定的発言を控えるよう案内しました。</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=20503300">公式原文を見る</a></p>',
    '통합공지', 'General Notice', '総合案内', '2024-04-25', true, '2024-04-25 11:00:00+09'
  ),
  (
    'a1200000-0000-4000-8000-000000000005', v_artist_id,
    '240905(목) Mnet <엠카운트다운> 생방송 참여 신청 안내',
    'Application Notice for the September 5 Mnet M Countdown Live Broadcast',
    '9月5日 Mnet「M COUNTDOWN」生放送参加申請',
    '<p>2024년 9월 5일 상암 CJ ENM CENTER에서 진행된 엠카운트다운 생방송 참여 신청 안내입니다. 인원 확인은 오후 4시 30분, 방송은 오후 6시 예정이었으며 신분증, 응원봉, SCENEDROME 실물 앨범 2종과 전곡 다운로드 내역이 필요했습니다.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=93382584">공식 원문 보기</a></p>',
    '<p>RESCENE fans could apply for the September 5 live broadcast at CJ ENM Center in Sangam. Check-in was at 4:30 p.m. and the broadcast was scheduled for 6:00 p.m. Valid ID, the RESCENE light stick, both physical versions of SCENEDROME, and full-track download verification were required.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=93382584">View the official notice</a></p>',
    '<p>2024年9月5日に上岩CJ ENM CENTERで行われた生放送の参加申請案内です。人数確認は午後4時30分、放送は午後6時予定で、身分証、RESCENEペンライト、SCENEDROME実物アルバム2種、全曲ダウンロード履歴が必要でした。</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=93382584">公式原文を見る</a></p>',
    '공방공지', 'Broadcast Notice', '公開放送', '2024-09-03', true, '2024-09-03 19:00:00+09'
  ),
  (
    'a1200000-0000-4000-8000-000000000006', v_artist_id,
    '240903 (화) SBS M <THE SHOW> 생방송 참여 신청 안내',
    'Application Notice for the September 3 SBS M The Show Live Broadcast',
    '9月3日 SBS M「THE SHOW」生放送参加申請',
    '<p>2024년 9월 3일 SBS 프리즘 타워에서 진행된 THE SHOW 생방송 참여 신청 안내입니다. 인원 확인은 오후 4시 30분, 방송은 오후 6시 예정이었으며 신분증, 응원봉, SCENEDROME 실물 앨범 2종과 전곡 다운로드 내역이 필요했습니다.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=89352714">공식 원문 보기</a></p>',
    '<p>The SBS M The Show live broadcast was scheduled for September 3 at SBS Prism Tower. Check-in was at 4:30 p.m. and the broadcast at 6:00 p.m. KST. Valid ID, the RESCENE light stick, both physical versions of SCENEDROME, and full-track download verification were required.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=89352714">View the official notice</a></p>',
    '<p>2024年9月3日にSBSプリズムタワーで行われた生放送の参加申請案内です。人数確認は午後4時30分、放送は午後6時予定で、身分証、RESCENEペンライト、SCENEDROME実物アルバム2種、全曲ダウンロード履歴が必要でした。</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=89352714">公式原文を見る</a></p>',
    '공방공지', 'Broadcast Notice', '公開放送', '2024-08-30', true, '2024-08-30 14:00:00+09'
  ),
  (
    'a1200000-0000-4000-8000-000000000007', v_artist_id,
    '240901 (일) SBS <인기가요> 사전녹화 참여 신청 안내',
    'Application Notice for the September 1 SBS Inkigayo Pre-Recording',
    '9月1日 SBS「人気歌謡」事前収録参加申請',
    '<p>2024년 9월 1일 등촌동 SBS 공개홀에서 진행된 인기가요 사전녹화 참여 신청 안내입니다. 인원 확인은 오후 2시, 녹화는 오후 3시 20분 예정이었으며 신분증, 응원봉, SCENEDROME 실물 앨범 2종과 전곡 다운로드 내역이 필요했습니다.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=88923697">공식 원문 보기</a></p>',
    '<p>RESCENE''s Inkigayo pre-recording was scheduled for September 1 at the SBS Open Hall in Deungchon. Check-in began at 2:00 p.m. and the pre-recording at approximately 3:20 p.m. KST. Valid ID, the RESCENE light stick, both physical versions of SCENEDROME, and full-track download verification were required.</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=88923697">View the official notice</a></p>',
    '<p>2024年9月1日に登村洞SBS公開ホールで行われた「人気歌謡」事前収録の参加申請案内です。人数確認は午後2時、収録は午後3時20分頃の予定で、身分証、RESCENEペンライト、SCENEDROME実物アルバム2種、全曲ダウンロード履歴が必要でした。</p><p><a href="https://themuze.kr/notice/?bmode=view&amp;idx=88923697">公式原文を見る</a></p>',
    '공방공지', 'Broadcast Notice', '公開放送', '2024-08-30', true, '2024-08-30 13:00:00+09'
  )
  on conflict (id) do update set
    artist_id = excluded.artist_id,
    title_ko = excluded.title_ko,
    title_en = excluded.title_en,
    title_ja = excluded.title_ja,
    content_ko = excluded.content_ko,
    content_en = excluded.content_en,
    content_ja = excluded.content_ja,
    category_ko = excluded.category_ko,
    category_en = excluded.category_en,
    category_ja = excluded.category_ja,
    date = excluded.date,
    is_published = excluded.is_published,
    published_at = excluded.published_at;

  insert into public.artist_schedules (
    id, artist_id, event_date, start_time, category,
    title_ko, title_en, title_ja,
    description_ko, description_en, description_ja,
    location, location_ko, location_en, location_ja,
    link_url, is_published, sort_order
  ) values
  ('a1300000-0000-4000-8000-000000000001', v_artist_id, '2024-03-26', '20:00', 'event',
   'RESCENE 데뷔 쇼케이스 라이브', 'RESCENE Debut Showcase Live', 'RESCENEデビューショーケースライブ',
   'YouTube와 TikTok에서 생중계된 첫 번째 싱글 앨범 Re:Scene 데뷔 쇼케이스', 'Debut showcase for the first single album Re:Scene, livestreamed on YouTube and TikTok.', '1stシングルアルバムRe:SceneのデビューショーケースをYouTubeとTikTokでライブ配信。',
   '온라인 · YouTube & TikTok', '온라인 · YouTube & TikTok', 'Online · YouTube & TikTok', 'オンライン · YouTube & TikTok',
   'https://themuze.kr/notice/?bmode=view&idx=18959595', true, 1),
  ('a1300000-0000-4000-8000-000000000002', v_artist_id, '2024-04-08', '19:00', 'show',
   'Arirang TV Simply K-POP 생방송', 'Arirang TV Simply K-POP Live Broadcast', 'Arirang TV Simply K-POP生放送',
   'RESCENE 공개방송 팬 참여 일정', 'Fan participation schedule for RESCENE''s live broadcast.', 'RESCENEの生放送ファン参加日程。',
   '아리랑국제방송', '아리랑국제방송', 'Arirang International Broadcasting', 'アリラン国際放送',
   'https://themuze.kr/notice/?bmode=view&idx=19337394', true, 2),
  ('a1300000-0000-4000-8000-000000000003', v_artist_id, '2024-04-09', '18:00', 'show',
   'SBS M THE SHOW 생방송', 'SBS M The Show Live Broadcast', 'SBS M「THE SHOW」生放送',
   'RESCENE 공개방송 팬 참여 일정', 'Fan participation schedule for RESCENE''s live broadcast.', 'RESCENEの生放送ファン参加日程。',
   'SBS 프리즘 타워', 'SBS 프리즘 타워', 'SBS Prism Tower', 'SBSプリズムタワー',
   'https://themuze.kr/notice/?bmode=view&idx=19364383', true, 3),
  ('a1300000-0000-4000-8000-000000000004', v_artist_id, '2024-04-16', '18:00', 'show',
   'SBS M THE SHOW 생방송', 'SBS M The Show Live Broadcast', 'SBS M「THE SHOW」生放送',
   '4월 16일 RESCENE 공개방송 팬 참여 일정', 'Fan participation schedule for the April 16 live broadcast.', '4月16日の生放送ファン参加日程。',
   'SBS 프리즘 타워', 'SBS 프리즘 타워', 'SBS Prism Tower', 'SBSプリズムタワー',
   'https://themuze.kr/notice/?bmode=view&idx=19586068', true, 4),
  ('a1300000-0000-4000-8000-000000000005', v_artist_id, '2024-04-22', '13:10', 'event',
   'Simply K-POP 사전녹화 및 미니 팬미팅', 'Simply K-POP Pre-Recording and Mini Fan Meeting', 'Simply K-POP事前収録・ミニファンミーティング',
   '사전녹화와 함께 진행된 RESCENE 미니 팬미팅', 'RESCENE mini fan meeting held alongside the pre-recording.', '事前収録とあわせて行われたRESCENEミニファンミーティング。',
   '아리랑국제방송 로비', '아리랑국제방송 로비', 'Arirang International Broadcasting Lobby', 'アリラン国際放送ロビー',
   'https://themuze.kr/notice/?bmode=view&idx=19891447', true, 5),
  ('a1300000-0000-4000-8000-000000000006', v_artist_id, '2024-04-22', '19:00', 'show',
   'Arirang TV Simply K-POP 생방송', 'Arirang TV Simply K-POP Live Broadcast', 'Arirang TV Simply K-POP生放送',
   'RESCENE 공개방송 팬 참여 일정', 'Fan participation schedule for RESCENE''s live broadcast.', 'RESCENEの生放送ファン参加日程。',
   '아리랑국제방송', '아리랑국제방송', 'Arirang International Broadcasting', 'アリラン国際放送',
   'https://themuze.kr/notice/?bmode=view&idx=19891891', true, 6),
  ('a1300000-0000-4000-8000-000000000007', v_artist_id, '2024-05-01', '18:00', 'show',
   'MBC M SHOW CHAMPION 생방송', 'MBC M Show Champion Live Broadcast', 'MBC M「SHOW CHAMPION」生放送',
   'RESCENE 공개방송 팬 참여 일정', 'Fan participation schedule for RESCENE''s live broadcast.', 'RESCENEの生放送ファン参加日程。',
   '일산 MBC 드림센터', '일산 MBC 드림센터', 'MBC Dream Center, Ilsan', '一山MBCドリームセンター',
   'https://themuze.kr/notice/?bmode=view&idx=20980030', true, 7),
  ('a1300000-0000-4000-8000-000000000008', v_artist_id, '2024-05-06', '19:00', 'show',
   'Arirang TV Simply K-POP 생방송', 'Arirang TV Simply K-POP Live Broadcast', 'Arirang TV Simply K-POP生放送',
   '5월 6일 RESCENE 공개방송 팬 참여 일정', 'Fan participation schedule for the May 6 live broadcast.', '5月6日の生放送ファン参加日程。',
   '아리랑국제방송', '아리랑국제방송', 'Arirang International Broadcasting', 'アリラン国際放送',
   'https://themuze.kr/notice/?bmode=view&idx=21255070', true, 8),
  ('a1300000-0000-4000-8000-000000000009', v_artist_id, '2024-05-29', '17:00', 'show',
   'MBC M SHOW CHAMPION 생방송', 'MBC M Show Champion Live Broadcast', 'MBC M「SHOW CHAMPION」生放送',
   '5월 29일 RESCENE 공개방송 팬 참여 일정', 'Fan participation schedule for the May 29 live broadcast.', '5月29日の生放送ファン参加日程。',
   '일산 MBC 드림센터', '일산 MBC 드림센터', 'MBC Dream Center, Ilsan', '一山MBCドリームセンター',
   'https://themuze.kr/notice/?bmode=view&idx=24356925', true, 9),
  ('a1300000-0000-4000-8000-000000000010', v_artist_id, '2024-04-25', '11:00', 'release',
   'RESCENE DearU bubble 오픈', 'RESCENE DearU bubble Launch', 'RESCENE DearU bubbleオープン',
   'RESCENE DearU bubble 서비스 오픈', 'Official launch of RESCENE''s DearU bubble service.', 'RESCENEのDearU bubbleサービス開始。',
   '온라인', '온라인', 'Online', 'オンライン',
   'https://themuze.kr/notice/?bmode=view&idx=20503300', true, 10)
  on conflict (id) do update set
    artist_id = excluded.artist_id,
    event_date = excluded.event_date,
    start_time = excluded.start_time,
    category = excluded.category,
    title_ko = excluded.title_ko,
    title_en = excluded.title_en,
    title_ja = excluded.title_ja,
    description_ko = excluded.description_ko,
    description_en = excluded.description_en,
    description_ja = excluded.description_ja,
    location = excluded.location,
    location_ko = excluded.location_ko,
    location_en = excluded.location_en,
    location_ja = excluded.location_ja,
    link_url = excluded.link_url,
    is_published = excluded.is_published,
    sort_order = excluded.sort_order;
end
$$;
