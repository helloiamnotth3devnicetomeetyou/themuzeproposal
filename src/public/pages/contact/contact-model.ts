export type ContactCategory = "general" | "business";
export type FormValues = { inquiryType: string; companyName: string; name: string; phone: string; email: string; message: string };

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
export const contactCopy = {
  ko: { intro: "문의 목적에 맞는 창구를 선택해 주세요. 남겨주신 내용을 확인한 뒤 담당자가 답변드립니다.", general: "일반 문의", business: "Business", form: "무엇을 도와드릴까요?", businessForm: "협업·광고·제휴 제안", required: "표시는 필수 입력 항목입니다.", inquiryType: "문의 유형", proposalType: "제안 유형", select: "선택", name: "이름", contactName: "담당자 이름", company: "회사명 / 소속", phone: "연락처", email: "이메일", message: "문의 내용", proposal: "제안 내용", consent: "개인정보 수집·이용 동의", submit: "문의하기", submitting: "접수 중...", success: "문의가 접수되었습니다.", receipt: "접수 번호", category: "문의 구분", again: "새 문의 작성하기" },
  en: { intro: "Choose the channel that best fits your inquiry. Our team will review your message and reply by email.", general: "General inquiry", business: "Business", form: "How can we help?", businessForm: "Partnership, advertising & collaboration", required: "Required fields", inquiryType: "Inquiry type", proposalType: "Proposal type", select: "Select", name: "Name", contactName: "Contact name", company: "Company / organization", phone: "Phone", email: "Email", message: "Message", proposal: "Proposal details", consent: "Consent to personal-information collection and use", submit: "Send inquiry", submitting: "Sending...", success: "Your inquiry has been received.", receipt: "Receipt number", category: "Inquiry type", again: "Write another inquiry" },
  ja: { intro: "お問い合わせ内容に合う窓口を選択してください。内容を確認のうえ、担当者がメールでご返信します。", general: "一般お問い合わせ", business: "ビジネス", form: "どのようなご用件ですか？", businessForm: "協業・広告・提携のご提案", required: "は必須項目です。", inquiryType: "お問い合わせ種別", proposalType: "ご提案種別", select: "選択", name: "お名前", contactName: "ご担当者名", company: "会社名 / 所属", phone: "電話番号", email: "メールアドレス", message: "お問い合わせ内容", proposal: "ご提案内容", consent: "個人情報の収集・利用に同意します", submit: "送信する", submitting: "送信中...", success: "お問い合わせを受け付けました。", receipt: "受付番号", category: "お問い合わせ区分", again: "新しいお問い合わせを作成" },
} as const;
