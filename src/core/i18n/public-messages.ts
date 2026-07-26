import type { Locale } from "./localized";

type OptionMessage = { value: string; label: string };

export interface PublicMessages {
  common: {
    language: string;
    openMenu: string;
    closeMenu: string;
    mainMenu: string;
    mobileMenu: string;
    lightMode: string;
    darkMode: string;
    loading: string;
  };
  about: {
    companyDescription: string;
    vision: Array<{ title: string; description: string }>;
    valueLabel: string;
    valueConclusion: string;
    historyLabel: string;
    historyConclusion: string;
    noticesLabel: string;
    noticesConclusion: string;
    noticesLoading: string;
    noticesEmpty: string;
    locationLabel: string;
    locationConclusion: string;
    addressFallback: string;
    headquartersDescription: string;
  };
  protect: {
    description: string;
    myReports: string;
    report: string;
    privateReport: string;
    closeError: string;
    loadError: string;
    receivedEyebrow: string;
    receivedTitle: string;
    receivedDescription: string;
    receiptNumber: string;
    processingStatus: string;
    receivedStatus: string;
    viewReports: string;
    reportTypes: OptionMessage[];
    status: Record<"pending" | "reviewing" | "resolved" | "rejected", string>;
    platforms: OptionMessage[];
    listDescription: string;
    total: (count: number) => string;
    emptyTitle: string;
    emptyDescription: string;
    artistFallback: string;
    receipt: string;
    fields: {
      artist: string;
      reportType: string;
      title: string;
      content: string;
      platform: string;
      postUrl: string;
      postedAt: string;
      authorName: string;
      postIp: string;
      evidence: string;
      confirmation: string;
    };
    placeholders: {
      artist: string;
      reportType: string;
      title: string;
      content: string;
      platform: string;
      postUrl: string;
      authorName: string;
      postIp: string;
    };
    upload: string;
    uploadHint: string;
    evidenceGuide: string;
    confirmation: string;
    missingTitle: string;
    missingCount: (count: number) => string;
    holdHint: string;
    submit: string;
    keepHolding: string;
    submitting: string;
    removeFile: (name: string) => string;
    errors: {
      maxFiles: string;
      fileType: (name: string) => string;
      fileSize: (name: string) => string;
      duplicate: (name: string) => string;
      evidenceRequired: string;
      confirmationRequired: string;
      submitFailed: string;
    };
  };
  schedule: {
    categories: Record<"show" | "release" | "anniversary" | "event" | "etc", string>;
    loading: string;
    artistNotFound: string;
    tableMissing: string;
    loadError: string;
    empty: string;
    previous: string;
    next: string;
    previousYear: string;
    nextYear: string;
    today: string;
    monthSelect: string;
    eventTypes: string;
    pageLabel: string;
    calendarLabel: (year: number, month: number) => string;
    dayLabel: (month: number, day: number, count: number) => string;
  };
  artistScene: {
    select: string;
    scene: string;
    close: string;
    previous: string;
    next: string;
    discography: string;
    profile: string;
    groupProfile: string;
    expand: string;
    collapse: string;
    loading: string;
    notFound: string;
    back: string;
  };
  discography: {
    loading: string;
    empty: string;
    loadError: string;
    tabs: { concept: string; intro: string; members: string };
    noDescription: string;
    noMembers: string;
    nowPlaying: string;
    progress: string;
    previousTrack: string;
    nextTrack: string;
    play: string;
    pause: string;
    noAudio: string;
    musicVideo: string;
    newest: string;
    oldest: string;
    sortAscending: string;
    sortDescending: string;
    previousAlbum: string;
    nextAlbum: string;
  };
}

export const publicMessages: Record<Locale, PublicMessages> = {
  ko: {
    common: { language: "언어 선택", openMenu: "메뉴 열기", closeMenu: "메뉴 닫기", mainMenu: "주 메뉴", mobileMenu: "모바일 주 메뉴", lightMode: "라이트 모드로 전환", darkMode: "다크 모드로 전환", loading: "불러오는 중…" },
    about: {
      companyDescription: "더뮤즈엔터테인먼트는 ‘YOU ARE MY MUZE’라는 슬로건 아래 대중에게 영감을 주는 독창적이고 가치 있는 대중문화를 선도하는 글로벌 엔터테인먼트 기업입니다. 음악의 깊이와 예술성, 세련된 비주얼을 결합해 전 세계 팬들의 마음을 움직이는 아티스트를 육성합니다.",
      vision: [
        { title: "예술적 깊이 (Artistic Depth)", description: "단순한 유행을 넘어 음악 본연의 진정성과 완성도를 추구합니다." },
        { title: "독창적 콘셉트 (Sensory Concept)", description: "향기와 시각을 결합한 RESCENE처럼 감각적이고 고유한 아이덴티티를 설계합니다." },
        { title: "글로벌 확장 (Global Stage)", description: "다국적 멤버와 세련된 팝 사운드를 기반으로 전 세계 무대를 지향합니다." },
      ],
      valueLabel: "THE MUZE가 지향하는 가치와 비전", valueConclusion: "THE MUZE의 핵심 아이덴티티",
      historyLabel: "그동안 걸어온 음악과 성장의 기록", historyConclusion: "아티스트와 함께 구축한 연혁",
      noticesLabel: "더뮤즈와 아티스트의 공식 안내 사항", noticesConclusion: "최근 공지 및 공식 업데이트",
      noticesLoading: "공지를 불러오는 중…", noticesEmpty: "등록된 공지가 없습니다.",
      locationLabel: "크리에이터를 위한 신사옥의 위치", locationConclusion: "신사옥 안내 및 메일 문의",
      addressFallback: "서울특별시 강남구 신사동 논현로 사옥",
      headquartersDescription: "2026년 7월 이전한 신사동 사옥은 전문 녹음 스튜디오와 연습 시설을 갖춰 크리에이터가 창작에 집중할 수 있는 환경을 제공합니다.",
    },
    protect: {
      description: "아티스트 권익 보호를 위한 신고 및 접수 내역을 확인하세요.", myReports: "내 신고", report: "신고하기", privateReport: "비공개 접수", closeError: "오류 메시지 닫기", loadError: "신고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      receivedEyebrow: "REPORT RECEIVED", receivedTitle: "신고가 접수되었습니다.", receivedDescription: "제출 자료를 확인한 뒤 필요한 조치를 검토합니다.", receiptNumber: "접수 번호", processingStatus: "처리 상태", receivedStatus: "접수 완료", viewReports: "내 신고 보기",
      reportTypes: [{ value: "defamation", label: "명예훼손·허위사실" }, { value: "harassment", label: "악성 댓글·비방" }, { value: "impersonation", label: "사칭·계정 도용" }, { value: "copyright", label: "저작권·콘텐츠 침해" }, { value: "privacy", label: "개인정보 노출" }, { value: "other", label: "기타" }],
      status: { pending: "접수", reviewing: "검토 중", resolved: "처리 완료", rejected: "종결" },
      platforms: [{ value: "instagram", label: "Instagram" }, { value: "x", label: "X (Twitter)" }, { value: "youtube", label: "YouTube" }, { value: "tiktok", label: "TikTok" }, { value: "facebook", label: "Facebook" }, { value: "community", label: "커뮤니티·게시판" }, { value: "other", label: "기타" }],
      listDescription: "접수한 신고와 현재 처리 상태를 확인할 수 있습니다.", total: (count) => `총 ${count}건`, emptyTitle: "아직 접수한 신고가 없습니다.", emptyDescription: "권익 침해 사례를 발견했다면 내용을 알려주세요.", artistFallback: "아티스트", receipt: "접수번호",
      fields: { artist: "아티스트", reportType: "신고 유형", title: "제목", content: "신고 내용", platform: "게시 플랫폼", postUrl: "게시물 URL", postedAt: "게시 일자", authorName: "게시물 작성자", postIp: "게시물 IP 주소", evidence: "첨부 자료", confirmation: "사실 확인 동의" },
      placeholders: { artist: "아티스트를 선택해 주세요", reportType: "신고 유형을 선택해 주세요", title: "신고 주요 내용을 입력해 주세요", content: "침해 내용과 발생 경위를 자세히 입력해 주세요", platform: "게시물이 올라온 플랫폼을 선택해 주세요", postUrl: "신고할 게시물의 URL을 입력해 주세요", authorName: "작성자의 ID 또는 닉네임을 입력해 주세요", postIp: "확인된 IP 주소가 있다면 입력해 주세요 (선택)" },
      upload: "파일 올리기", uploadHint: "JPG, PNG, WEBP, GIF, PDF · 파일당 50MB 이하 · 최대 3개", evidenceGuide: "캡처 날짜, 게시물 내용, URL, 작성자 정보가 보이도록 저장해 주세요. 내용이 길다면 순서를 알 수 있도록 여러 장으로 첨부해 주세요.", confirmation: "본 신고 내용이 허위나 조작 없이 사실에 근거해 작성되었음을 확인합니다.", missingTitle: "입력하지 않은 항목", missingCount: (count) => `입력하지 않은 항목이 ${count}개 있습니다.`, holdHint: "내용을 확인한 뒤 등록 버튼을 1.5초 동안 길게 눌러주세요.", submit: "1.5초 길게 눌러 등록", keepHolding: "계속 누르세요…", submitting: "안전하게 전송하는 중…", removeFile: (name) => `${name} 삭제`,
      errors: { maxFiles: "첨부 자료는 최대 3개까지 등록할 수 있습니다.", fileType: (name) => `${name}: JPG, PNG, WEBP, GIF 또는 PDF 파일만 첨부할 수 있습니다.`, fileSize: (name) => `${name}: 파일 크기는 50MB 이하여야 합니다.`, duplicate: (name) => `${name}: 이미 첨부한 파일입니다.`, evidenceRequired: "침해 내용을 확인할 수 있는 증거 자료를 1개 이상 첨부해 주세요.", confirmationRequired: "제보 내용이 사실에 근거해 작성되었음을 확인해 주세요.", submitFailed: "신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요." },
    },
    schedule: {
      categories: { show: "방송 / 공연", release: "발매", anniversary: "기념일", event: "이벤트", etc: "기타" },
      loading: "아티스트 일정을 불러오는 중…", artistNotFound: "아티스트 정보를 찾을 수 없습니다.", tableMissing: "일정 서비스를 준비 중입니다.", loadError: "일정을 불러오지 못했습니다.", empty: "이 달에 공개된 일정이 없습니다.", previous: "이전 일정", next: "다음 일정", previousYear: "이전 해", nextYear: "다음 해", today: "오늘", monthSelect: "월 선택", eventTypes: "일정 유형", pageLabel: "일정 페이지", calendarLabel: (year, month) => `${year}년 ${month}월 일정 달력`, dayLabel: (month, day, count) => `${month}월 ${day}일, 일정 ${count}개`,
    },
    artistScene: { select: "멤버 선택", scene: "콘셉트 장면", close: "프로필 닫기", previous: "이전 멤버", next: "다음 멤버", discography: "디스코그래피", profile: "프로필", groupProfile: "아티스트 프로필", expand: "소개 펼치기", collapse: "소개 접기", loading: "아티스트 장면을 불러오는 중…", notFound: "아티스트 장면을 찾을 수 없습니다.", back: "아티스트 목록으로" },
    discography: { loading: "디스코그래피를 불러오는 중입니다.", empty: "공개된 앨범이 없습니다.", loadError: "디스코그래피를 불러오지 못했습니다.", tabs: { concept: "콘셉트", intro: "트랙 소개", members: "멤버" }, noDescription: "등록된 앨범 소개가 없습니다.", noMembers: "등록된 멤버 정보가 없습니다.", nowPlaying: "재생 중", progress: "재생 위치", previousTrack: "이전 트랙", nextTrack: "다음 트랙", play: "재생", pause: "일시정지", noAudio: "등록된 음원이 없습니다.", musicVideo: "뮤직비디오 보기", newest: "최신순", oldest: "오래된순", sortAscending: "날짜 오름차순으로 정렬", sortDescending: "날짜 내림차순으로 정렬", previousAlbum: "이전 앨범", nextAlbum: "다음 앨범" },
  },
  en: {
    common: { language: "Select language", openMenu: "Open menu", closeMenu: "Close menu", mainMenu: "Main menu", mobileMenu: "Mobile main menu", lightMode: "Switch to light mode", darkMode: "Switch to dark mode", loading: "Loading…" },
    about: {
      companyDescription: "Under the slogan “YOU ARE MY MUZE,” THE MUZE Entertainment leads distinctive, meaningful pop culture that inspires audiences. We combine musical depth, artistry, and refined visuals to develop global artists who move fans around the world.",
      vision: [{ title: "Artistic Depth", description: "We pursue authenticity and completeness beyond passing trends." }, { title: "Original Concept", description: "We create sensory, singular identities like RESCENE, where scent and visual storytelling meet." }, { title: "Global Vision", description: "We aim for stages worldwide through multinational talent and sophisticated pop sound." }],
      valueLabel: "THE MUZE values and core vision", valueConclusion: "THE MUZE Core Identity", historyLabel: "Milestones of music and corporate growth", historyConclusion: "THE MUZE Company History", noticesLabel: "Official notices and announcements", noticesConclusion: "Official Announcements", noticesLoading: "Loading notices…", noticesEmpty: "No notices have been published.", locationLabel: "New creative building location", locationConclusion: "HQ Location & Email Contact", addressFallback: "Nonhyeon-ro, Sinsa-dong, Gangnam-gu, Seoul, Republic of Korea", headquartersDescription: "Relocated in July 2026, the Sinsa-dong headquarters provides professional recording studios and rehearsal facilities where creators can focus on their work.",
    },
    protect: {
      description: "Submit artist-protection reports and review their status.", myReports: "My reports", report: "Submit report", privateReport: "Private submission", closeError: "Close error message", loadError: "We couldn't load your reports. Please try again shortly.",
      receivedEyebrow: "REPORT RECEIVED", receivedTitle: "Your report has been received.", receivedDescription: "We will review the submitted evidence and consider the appropriate action.", receiptNumber: "Receipt number", processingStatus: "Status", receivedStatus: "Received", viewReports: "View my reports",
      reportTypes: [{ value: "defamation", label: "Defamation or false information" }, { value: "harassment", label: "Harassment or abusive comments" }, { value: "impersonation", label: "Impersonation or account theft" }, { value: "copyright", label: "Copyright or content infringement" }, { value: "privacy", label: "Exposure of personal information" }, { value: "other", label: "Other" }],
      status: { pending: "Received", reviewing: "Under review", resolved: "Resolved", rejected: "Closed" },
      platforms: [{ value: "instagram", label: "Instagram" }, { value: "x", label: "X (Twitter)" }, { value: "youtube", label: "YouTube" }, { value: "tiktok", label: "TikTok" }, { value: "facebook", label: "Facebook" }, { value: "community", label: "Community or forum" }, { value: "other", label: "Other" }],
      listDescription: "Review your submitted reports and their current status.", total: (count) => `${count} total`, emptyTitle: "You haven't submitted any reports.", emptyDescription: "Let us know if you find a case that infringes an artist's rights.", artistFallback: "Artist", receipt: "Receipt",
      fields: { artist: "Artist", reportType: "Report type", title: "Title", content: "Report details", platform: "Platform", postUrl: "Post URL", postedAt: "Date posted", authorName: "Post author", postIp: "Post IP address", evidence: "Evidence", confirmation: "Confirmation" },
      placeholders: { artist: "Select an artist", reportType: "Select a report type", title: "Summarize the issue", content: "Describe the infringement and how it occurred", platform: "Select the platform where the post appeared", postUrl: "Enter the URL of the post", authorName: "Enter the author's ID or nickname", postIp: "Enter the IP address if known (optional)" },
      upload: "Upload files", uploadHint: "JPG, PNG, WEBP, GIF, PDF · 50 MB per file · Up to 3 files", evidenceGuide: "Include the capture date, post content, URL, and author information. If the content is long, attach multiple images in order.", confirmation: "I confirm that this report is factual and has not been fabricated or altered.", missingTitle: "Missing fields", missingCount: (count) => `${count} required field${count === 1 ? " is" : "s are"} missing.`, holdHint: "Review the details, then press and hold the submit button for 1.5 seconds.", submit: "Hold 1.5 seconds to submit", keepHolding: "Keep holding…", submitting: "Sending securely…", removeFile: (name) => `Remove ${name}`,
      errors: { maxFiles: "You can attach up to 3 files.", fileType: (name) => `${name}: Only JPG, PNG, WEBP, GIF, or PDF files are allowed.`, fileSize: (name) => `${name}: Files must be 50 MB or smaller.`, duplicate: (name) => `${name}: This file is already attached.`, evidenceRequired: "Attach at least one item of evidence.", confirmationRequired: "Confirm that the report is based on facts.", submitFailed: "We couldn't submit your report. Please try again shortly." },
    },
    schedule: {
      categories: { show: "Show / Performance", release: "Release", anniversary: "Anniversary", event: "Event", etc: "Other" },
      loading: "Loading the artist schedule…", artistNotFound: "Artist not found.", tableMissing: "The schedule service is not ready yet.", loadError: "The schedule could not be loaded.", empty: "No public events are scheduled this month.", previous: "Previous events", next: "Next events", previousYear: "Previous year", nextYear: "Next year", today: "Today", monthSelect: "Select month", eventTypes: "Event types", pageLabel: "Schedule pages", calendarLabel: (year, month) => `Schedule calendar for ${month}/${year}`, dayLabel: (month, day, count) => `${month}/${day}, ${count} event${count === 1 ? "" : "s"}`,
    },
    artistScene: { select: "Select a member", scene: "Concept scenes", close: "Close profile", previous: "Previous member", next: "Next member", discography: "Discography", profile: "Profile", groupProfile: "Artist profile", expand: "Show introduction", collapse: "Hide introduction", loading: "Loading artist scene…", notFound: "Artist scene not found.", back: "Back to artists" },
    discography: { loading: "Loading discography…", empty: "No albums have been published.", loadError: "The discography could not be loaded.", tabs: { concept: "Concept", intro: "Track Intro", members: "Members" }, noDescription: "No album introduction is available.", noMembers: "No member information is available.", nowPlaying: "Now playing", progress: "Playback position", previousTrack: "Previous track", nextTrack: "Next track", play: "Play", pause: "Pause", noAudio: "No audio file is available.", musicVideo: "Watch music video", newest: "Newest", oldest: "Oldest", sortAscending: "Sort by oldest first", sortDescending: "Sort by newest first", previousAlbum: "Previous album", nextAlbum: "Next album" },
  },
  ja: {
    common: { language: "言語を選択", openMenu: "メニューを開く", closeMenu: "メニューを閉じる", mainMenu: "メインメニュー", mobileMenu: "モバイルメニュー", lightMode: "ライトモードに切り替え", darkMode: "ダークモードに切り替え", loading: "読み込み中…" },
    about: {
      companyDescription: "THE MUZE Entertainmentは、「YOU ARE MY MUZE」というスローガンのもと、人々にインスピレーションを与える独創的で価値ある大衆文化をリードするグローバルエンターテインメント企業です。音楽の深みと芸術性、洗練されたビジュアルを融合し、世界中のファンの心を動かすアーティストを育成しています。",
      vision: [{ title: "芸術的な深み", description: "一過性のトレンドを超え、音楽本来の真実性と完成度を追求します。" }, { title: "独創的なコンセプト", description: "香りと視覚を融合したRESCENEのように、感覚的で唯一無二のアイデンティティを設計します。" }, { title: "グローバルビジョン", description: "多国籍メンバーと洗練されたポップサウンドを基盤に、世界のステージを目指します。" }],
      valueLabel: "THE MUZEが目指す価値とビジョン", valueConclusion: "THE MUZEのアイデンティティ", historyLabel: "音楽と成長の歩み", historyConclusion: "アーティストと歩んだ沿革", noticesLabel: "THE MUZEと所属アーティストからのお知らせ", noticesConclusion: "最新のお知らせ", noticesLoading: "お知らせを読み込み中…", noticesEmpty: "公開されたお知らせはありません。", locationLabel: "クリエイターのための新社屋", locationConclusion: "新社屋案内・メールお問い合わせ", addressFallback: "大韓民国ソウル特別市江南区新沙洞ノンヒョン路", headquartersDescription: "2026年7月に移転した新沙洞の社屋には、専門のレコーディングスタジオと練習施設があり、クリエイターが制作に集中できる環境を提供しています。",
    },
    protect: {
      description: "アーティストの権益保護に関する通報と受付状況を確認できます。", myReports: "通報履歴", report: "通報する", privateReport: "非公開受付", closeError: "エラーメッセージを閉じる", loadError: "通報情報を読み込めませんでした。しばらくしてからもう一度お試しください。",
      receivedEyebrow: "REPORT RECEIVED", receivedTitle: "通報を受け付けました。", receivedDescription: "提出された資料を確認し、必要な対応を検討します。", receiptNumber: "受付番号", processingStatus: "処理状況", receivedStatus: "受付完了", viewReports: "通報履歴を見る",
      reportTypes: [{ value: "defamation", label: "名誉毀損・虚偽情報" }, { value: "harassment", label: "悪質なコメント・誹謗中傷" }, { value: "impersonation", label: "なりすまし・アカウント盗用" }, { value: "copyright", label: "著作権・コンテンツ侵害" }, { value: "privacy", label: "個人情報の公開" }, { value: "other", label: "その他" }],
      status: { pending: "受付", reviewing: "確認中", resolved: "対応完了", rejected: "終了" },
      platforms: [{ value: "instagram", label: "Instagram" }, { value: "x", label: "X (Twitter)" }, { value: "youtube", label: "YouTube" }, { value: "tiktok", label: "TikTok" }, { value: "facebook", label: "Facebook" }, { value: "community", label: "コミュニティ・掲示板" }, { value: "other", label: "その他" }],
      listDescription: "提出した通報と現在の処理状況を確認できます。", total: (count) => `全${count}件`, emptyTitle: "提出した通報はありません。", emptyDescription: "権益侵害を発見した場合はお知らせください。", artistFallback: "アーティスト", receipt: "受付番号",
      fields: { artist: "アーティスト", reportType: "通報の種類", title: "タイトル", content: "通報内容", platform: "投稿プラットフォーム", postUrl: "投稿URL", postedAt: "投稿日", authorName: "投稿者", postIp: "投稿元IPアドレス", evidence: "添付資料", confirmation: "事実確認への同意" },
      placeholders: { artist: "アーティストを選択してください", reportType: "通報の種類を選択してください", title: "通報内容の要点を入力してください", content: "侵害内容と経緯を詳しく入力してください", platform: "投稿が掲載されたプラットフォームを選択してください", postUrl: "通報する投稿のURLを入力してください", authorName: "投稿者のIDまたはニックネームを入力してください", postIp: "確認できたIPアドレスがあれば入力してください（任意）" },
      upload: "ファイルをアップロード", uploadHint: "JPG、PNG、WEBP、GIF、PDF・1ファイル50MB以下・最大3件", evidenceGuide: "撮影日、投稿内容、URL、投稿者情報が確認できるように保存してください。内容が長い場合は、順序が分かるように複数添付してください。", confirmation: "本通報は虚偽や改ざんなく、事実に基づいて作成したものであることを確認します。", missingTitle: "未入力の項目", missingCount: (count) => `未入力の項目が${count}件あります。`, holdHint: "内容を確認し、登録ボタンを1.5秒間長押ししてください。", submit: "1.5秒長押しして登録", keepHolding: "そのまま押してください…", submitting: "安全に送信しています…", removeFile: (name) => `${name}を削除`,
      errors: { maxFiles: "添付資料は最大3件まで登録できます。", fileType: (name) => `${name}：JPG、PNG、WEBP、GIF、PDFのみ添付できます。`, fileSize: (name) => `${name}：ファイルサイズは50MB以下にしてください。`, duplicate: (name) => `${name}：すでに添付されています。`, evidenceRequired: "侵害内容を確認できる証拠資料を1件以上添付してください。", confirmationRequired: "通報内容が事実に基づいていることを確認してください。", submitFailed: "通報を送信できませんでした。しばらくしてからもう一度お試しください。" },
    },
    schedule: {
      categories: { show: "放送・公演", release: "リリース", anniversary: "記念日", event: "イベント", etc: "その他" },
      loading: "アーティストのスケジュールを読み込み中…", artistNotFound: "アーティストが見つかりません。", tableMissing: "スケジュールサービスは準備中です。", loadError: "スケジュールを読み込めませんでした。", empty: "今月公開されている予定はありません。", previous: "前の予定", next: "次の予定", previousYear: "前年", nextYear: "翌年", today: "今日", monthSelect: "月を選択", eventTypes: "予定の種類", pageLabel: "スケジュールページ", calendarLabel: (year, month) => `${year}年${month}月のスケジュール`, dayLabel: (month, day, count) => `${month}月${day}日、予定${count}件`,
    },
    artistScene: { select: "メンバーを選択", scene: "コンセプトシーン", close: "プロフィールを閉じる", previous: "前のメンバー", next: "次のメンバー", discography: "ディスコグラフィー", profile: "プロフィール", groupProfile: "アーティストプロフィール", expand: "紹介を表示", collapse: "紹介を閉じる", loading: "アーティストシーンを読み込み中…", notFound: "アーティストシーンが見つかりません。", back: "アーティスト一覧へ" },
    discography: { loading: "ディスコグラフィーを読み込み中…", empty: "公開されたアルバムはありません。", loadError: "ディスコグラフィーを読み込めませんでした。", tabs: { concept: "コンセプト", intro: "トラック紹介", members: "メンバー" }, noDescription: "アルバム紹介は登録されていません。", noMembers: "登録されたメンバー情報はありません。", nowPlaying: "再生中", progress: "再生位置", previousTrack: "前のトラック", nextTrack: "次のトラック", play: "再生", pause: "一時停止", noAudio: "音源が登録されていません。", musicVideo: "ミュージックビデオを見る", newest: "新しい順", oldest: "古い順", sortAscending: "古い順に並べ替え", sortDescending: "新しい順に並べ替え", previousAlbum: "前のアルバム", nextAlbum: "次のアルバム" },
  },
};
