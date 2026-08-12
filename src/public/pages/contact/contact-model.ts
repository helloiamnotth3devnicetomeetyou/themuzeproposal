export type ContactCategory = "general" | "business";
export type FormValues = { inquiryType: string; companyName: string; name: string; phone: string; email: string; message: string };
export type CategoryDraft = { inquiryType: string; companyName: string; message: string; consented: boolean };

export const generalTypes = [
  { value: "account", label: "계정 문의" }, { value: "notice_event", label: "공지·이벤트 문의" }, { value: "goods_md", label: "굿즈·MD 문의" },
  { value: "site_error", label: "사이트 오류 신고" }, { value: "other", label: "기타" },
];
export const businessTypes = [
  { value: "brand_collaboration", label: "브랜드 협업" }, { value: "advertising_sponsorship", label: "광고·협찬 제안" }, { value: "md_licensing", label: "MD·상품화 제안" },
  { value: "performance_event", label: "공연·행사 섭외" }, { value: "other_business", label: "기타 비즈니스 제안" },
];
export const inquiryLabels = {
  en: { account: "Account", notice_event: "Notices & events", goods_md: "Goods & MD", site_error: "Website issue", other: "Other", brand_collaboration: "Brand collaboration", advertising_sponsorship: "Advertising & sponsorship", md_licensing: "MD & licensing", performance_event: "Performance & event", other_business: "Other business proposal" },
  ja: { account: "アカウント", notice_event: "お知らせ・イベント", goods_md: "グッズ・MD", site_error: "サイトの不具合", other: "その他", brand_collaboration: "ブランドコラボレーション", advertising_sponsorship: "広告・スポンサーシップ", md_licensing: "MD・ライセンス", performance_event: "公演・イベント", other_business: "その他のビジネス提案" },
} as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = new Set(["pdf"]);
export const EMPTY_ERROR = "";
export const emptyCategoryDraft: CategoryDraft = { inquiryType: "", companyName: "", message: "", consented: false };

export const contactCopy = {
  ko: {
    intro: "문의 목적에 맞는 창구를 선택해 주세요. 남겨주신 내용을 확인한 뒤 담당자가 답변드립니다.", general: "일반 문의", business: "Business", form: "무엇을 도와드릴까요?", businessForm: "협업·광고·제휴 제안", required: "표시는 필수 입력 항목입니다.", inquiryType: "문의 유형", proposalType: "제안 유형", select: "선택", name: "이름", contactName: "담당자 이름", company: "회사명 / 소속", phone: "연락처", email: "이메일", message: "문의 내용", proposal: "제안 내용", consent: "개인정보 수집·이용 동의", submit: "문의하기", submitting: "접수 중...", success: "문의가 접수되었습니다.", receipt: "접수 번호", category: "문의 구분", again: "새 문의 작성하기",
    successNote: "남겨주신 이메일로 순차적으로 답변드리겠습니다.",
    closeErrorLabel: "오류 메시지 닫기",
    submitNote: "남겨주신 이메일로 순차적으로 답변드리고 있으며, 문의량에 따라 답변이 지연될 수 있는 점 양해 부탁드립니다.",
    pressKit: { title: "프레스킷 다운로드", desc: "협업 검토에 필요한 공식 자료를 내려받을 수 있습니다.", zip: "프레스킷 ZIP", pdf: "프로필 PDF" },
    placeholders: { company: "회사명 또는 소속을 입력해 주세요.", nameBusiness: "담당자 성함을 입력해 주세요.", nameGeneral: "이름을 입력해 주세요.", phoneBusiness: "연락 가능한 번호를 입력해 주세요.", phoneGeneral: "연락처를 입력해 주세요. (선택)", proposal: "제안하시는 내용과 원하시는 협업 방향을 구체적으로 남겨주시면 검토에 큰 도움이 됩니다.", message: "문의하실 내용을 자세히 남겨주시면 더 빠르고 정확한 답변을 드릴 수 있습니다." },
    attachment: { label: "제안서 첨부", chooseTitle: "파일을 선택해 주세요.", hint: "PDF · 최대 5MB", select: "파일 선택", remove: (name: string) => `${name} 삭제` },
    privacy: {
      title: "개인정보 수집 및 이용 안내",
      items: [
        { term: "수집 항목", desc: "이름, 이메일, 연락처, 회사명·소속(비즈니스 문의 시), 문의 내용" },
        { term: "이용 목적", desc: "문의 접수, 본인 확인, 문의 내용 검토 및 답변" },
        { term: "보유 기간", desc: "문의 처리 완료 후 3년 또는 관계 법령에서 정한 기간" },
      ],
      note: "동의를 거부할 수 있으나, 필수 정보 수집에 동의하지 않으면 문의 접수가 어렵습니다.",
      consentLabel: "개인정보 수집·이용에 동의합니다.",
    },
    validation: {
      inquiryType: "문의 유형을 선택해 주세요.", company: "회사명 또는 소속을 입력해 주세요.", nameBusiness: "담당자 이름을 입력해 주세요.", nameGeneral: "이름을 입력해 주세요.",
      phone: "연락처를 입력해 주세요.", email: "이메일 주소를 입력해 주세요.", emailInvalid: "올바른 이메일 주소를 입력해 주세요.",
      messageBusiness: "제안 내용을 입력해 주세요.", messageGeneral: "문의 내용을 입력해 주세요.", consent: "개인정보 수집·이용에 동의해 주세요.",
      fileType: "PDF 형식의 파일만 첨부할 수 있습니다.", fileSize: "첨부 파일은 최대 5MB까지 등록할 수 있습니다.",
      captcha: "보안 인증을 완료해 주세요.",
    },
    errors: {
      INVALID_REQUEST: "입력 내용을 다시 확인해 주세요.", UNAUTHORIZED: "로그인이 필요합니다. 다시 로그인한 뒤 시도해 주세요.",
      RATE_LIMITED: "문의 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", FILE_TOO_LARGE: "첨부 파일은 최대 5MB까지 등록할 수 있습니다.",
      INVALID_FILE: "이 문의 유형에는 파일을 첨부할 수 없습니다.", INVALID_FILE_TYPE: "PDF 형식의 파일만 첨부할 수 있습니다.",
      UPLOAD_FAILED: "파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.", SERVICE_UNAVAILABLE: "일시적으로 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      SUBMISSION_FAILED: "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      CAPTCHA_FAILED: "보안 인증에 실패했습니다. 다시 시도해 주세요.",
    },
  },
  en: {
    intro: "Choose the channel that best fits your inquiry. Our team will review your message and reply by email.", general: "General inquiry", business: "Business", form: "How can we help?", businessForm: "Partnership, advertising & collaboration", required: "Required fields", inquiryType: "Inquiry type", proposalType: "Proposal type", select: "Select", name: "Name", contactName: "Contact name", company: "Company / organization", phone: "Phone", email: "Email", message: "Message", proposal: "Proposal details", consent: "Consent to personal-information collection and use", submit: "Send inquiry", submitting: "Sending...", success: "Your inquiry has been received.", receipt: "Receipt number", category: "Inquiry type", again: "Write another inquiry",
    successNote: "We will reply to the email address you provided.",
    closeErrorLabel: "Close error message",
    submitNote: "We reply to inquiries in the order received; responses may be delayed depending on volume.",
    pressKit: { title: "Download press kit", desc: "Download official materials for reviewing this proposal.", zip: "Press kit (ZIP)", pdf: "Profile (PDF)" },
    placeholders: { company: "Enter your company or organization.", nameBusiness: "Enter the contact person's name.", nameGeneral: "Enter your name.", phoneBusiness: "Enter a phone number we can reach you at.", phoneGeneral: "Enter your phone number. (optional)", proposal: "Describe your proposal and the collaboration you have in mind — specifics help us review it faster.", message: "Share the details of your inquiry so we can respond quickly and accurately." },
    attachment: { label: "Attach proposal", chooseTitle: "Choose a file.", hint: "PDF · Up to 5MB", select: "Choose file", remove: (name: string) => `Remove ${name}` },
    privacy: {
      title: "Personal information collection and use",
      items: [
        { term: "Items collected", desc: "Name, email, phone, company/organization (for business inquiries), inquiry content" },
        { term: "Purpose of use", desc: "Receiving inquiries, identity verification, reviewing and responding to inquiries" },
        { term: "Retention period", desc: "3 years after the inquiry is resolved, or the period required by applicable law" },
      ],
      note: "You may decline consent, but we may be unable to accept your inquiry without the required information.",
      consentLabel: "I consent to the collection and use of my personal information.",
    },
    validation: {
      inquiryType: "Please select an inquiry type.", company: "Please enter your company or organization.", nameBusiness: "Please enter the contact person's name.", nameGeneral: "Please enter your name.",
      phone: "Please enter your phone number.", email: "Please enter your email address.", emailInvalid: "Please enter a valid email address.",
      messageBusiness: "Please enter your proposal details.", messageGeneral: "Please enter your inquiry.", consent: "Please consent to the collection and use of personal information.",
      fileType: "Only PDF files can be attached.", fileSize: "Attachments must be 5MB or smaller.",
      captcha: "Please complete the security check.",
    },
    errors: {
      INVALID_REQUEST: "Please check your information and try again.", UNAUTHORIZED: "Please log in again and try again.",
      RATE_LIMITED: "Too many inquiries submitted. Please try again shortly.", FILE_TOO_LARGE: "Attachments must be 5MB or smaller.",
      INVALID_FILE: "This inquiry type does not accept attachments.", INVALID_FILE_TYPE: "Only PDF files can be attached.",
      UPLOAD_FAILED: "The file could not be uploaded. Please try again shortly.", SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again shortly.",
      SUBMISSION_FAILED: "We couldn't submit your inquiry. Please try again shortly.",
      CAPTCHA_FAILED: "Security verification failed. Please try again.",
    },
  },
  ja: {
    intro: "お問い合わせ内容に合う窓口を選択してください。内容を確認のうえ、担当者がメールでご返信します。", general: "一般お問い合わせ", business: "ビジネス", form: "どのようなご用件ですか？", businessForm: "協業・広告・提携のご提案", required: "は必須項目です。", inquiryType: "お問い合わせ種別", proposalType: "ご提案種別", select: "選択", name: "お名前", contactName: "ご担当者名", company: "会社名 / 所属", phone: "電話番号", email: "メールアドレス", message: "お問い合わせ内容", proposal: "ご提案内容", consent: "個人情報の収集・利用に同意します", submit: "送信する", submitting: "送信中...", success: "お問い合わせを受け付けました。", receipt: "受付番号", category: "お問い合わせ区分", again: "新しいお問い合わせを作成",
    successNote: "ご記入いただいたメールアドレスへ順次ご返信いたします。",
    closeErrorLabel: "エラーメッセージを閉じる",
    submitNote: "お問い合わせは受付順にご返信しております。件数によりご返信が遅れる場合がございます。",
    pressKit: { title: "プレスキットのダウンロード", desc: "ご検討に必要な公式資料をダウンロードいただけます。", zip: "プレスキット (ZIP)", pdf: "プロフィール (PDF)" },
    placeholders: { company: "会社名または所属を入力してください。", nameBusiness: "ご担当者様のお名前を入力してください。", nameGeneral: "お名前を入力してください。", phoneBusiness: "ご連絡可能な電話番号を入力してください。", phoneGeneral: "電話番号を入力してください。（任意）", proposal: "ご提案内容とご希望の協業方針を具体的にご記入いただくと、検討がスムーズです。", message: "お問い合わせ内容を詳しくご記入いただくと、より早く正確にご案内できます。" },
    attachment: { label: "提案書の添付", chooseTitle: "ファイルを選択してください。", hint: "PDF・最大5MB", select: "ファイルを選択", remove: (name: string) => `${name}を削除` },
    privacy: {
      title: "個人情報の収集および利用に関するご案内",
      items: [
        { term: "収集項目", desc: "氏名、メールアドレス、電話番号、会社名・所属（ビジネスお問い合わせの場合）、お問い合わせ内容" },
        { term: "利用目的", desc: "お問い合わせの受付、本人確認、お問い合わせ内容の確認およびご返信" },
        { term: "保有期間", desc: "お問い合わせ対応完了後3年間、または関係法令で定める期間" },
      ],
      note: "同意を拒否することができますが、必須情報の収集に同意いただけない場合、お問い合わせを受け付けられないことがあります。",
      consentLabel: "個人情報の収集・利用に同意します。",
    },
    validation: {
      inquiryType: "お問い合わせ種別を選択してください。", company: "会社名または所属を入力してください。", nameBusiness: "ご担当者様のお名前を入力してください。", nameGeneral: "お名前を入力してください。",
      phone: "電話番号を入力してください。", email: "メールアドレスを入力してください。", emailInvalid: "正しいメールアドレスを入力してください。",
      messageBusiness: "ご提案内容を入力してください。", messageGeneral: "お問い合わせ内容を入力してください。", consent: "個人情報の収集・利用に同意してください。",
      fileType: "PDF形式のファイルのみ添付できます。", fileSize: "添付ファイルは最大5MBまで登録できます。",
      captcha: "セキュリティ認証を完了してください。",
    },
    errors: {
      INVALID_REQUEST: "入力内容をご確認のうえ、もう一度お試しください。", UNAUTHORIZED: "ログインが必要です。再度ログインしてお試しください。",
      RATE_LIMITED: "お問い合わせが多く送信されています。しばらくしてからもう一度お試しください。", FILE_TOO_LARGE: "添付ファイルは最大5MBまで登録できます。",
      INVALID_FILE: "このお問い合わせ種別にはファイルを添付できません。", INVALID_FILE_TYPE: "PDF形式のファイルのみ添付できます。",
      UPLOAD_FAILED: "ファイルのアップロードに失敗しました。しばらくしてからもう一度お試しください。", SERVICE_UNAVAILABLE: "一時的にサービスをご利用いただけません。しばらくしてからもう一度お試しください。",
      SUBMISSION_FAILED: "お問い合わせの送信中に問題が発生しました。しばらくしてからもう一度お試しください。",
      CAPTCHA_FAILED: "セキュリティ認証に失敗しました。もう一度お試しください。",
    },
  },
} as const;

export type ContactMessages = typeof contactCopy["ko"];
