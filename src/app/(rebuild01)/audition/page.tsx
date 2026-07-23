"use client";

import { useState } from "react";
import { LuCircleCheck } from "react-icons/lu";
import CustomSelect from "@/components/ui/CustomSelect";
import { useLocale } from "../../context/LocaleContext";

export default function Audition() {
  const { locale } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [gender, setGender] = useState("");

  const categories = {
    ko: ["보컬 (Vocal)", "댄스 (Dance)", "랩 (Rap)", "비주얼/연기 (Visual/Acting)"],
    en: ["Vocal", "Dance", "Rap", "Visual / Acting"],
    ja: ["ボーカル (Vocal)", "ダンス (Dance)", "ラップ (Rap)", "ビジュアル/演技 (Visual/Acting)"]
  }[locale];

  const infoFields = {
    ko: {
      name: "이름",
      birth: "생년월일",
      gender: "성별",
      genderOptions: ["남성", "여성"],
      contact: "연락처",
      email: "이메일",
      intro: "자기소개",
      attach: "오디션 영상 및 사진 링크",
      submit: "지원서 제출하기",
      successTitle: "지원서 제출 완료!",
      successDesc: "소중한 지원 감사드립니다. 검토 후 서류 합격자에 한해 개별 연락드리겠습니다."
    },
    en: {
      name: "Name",
      birth: "Date of Birth",
      gender: "Gender",
      genderOptions: ["Male", "Female"],
      contact: "Contact",
      email: "Email",
      intro: "Self-Introduction",
      attach: "Audition Video & Photo Link",
      submit: "Submit Application",
      successTitle: "Submission Complete!",
      successDesc: "Thank you for applying. We will review your materials and contact qualified candidates individually."
    },
    ja: {
      name: "名前",
      birth: "生年月日",
      gender: "性別",
      genderOptions: ["男性", "女性"],
      contact: "連絡先",
      email: "メールアドレス",
      intro: "自己紹介",
      attach: "オーディション映像・写真リンク",
      submit: "応募する",
      successTitle: "応募完了!",
      successDesc: "ご応募ありがとうございます。選考の上、合格者の方にのみ個別にご連絡いたします."
    }
  }[locale];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--bg-input-border)",
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    outline: "none",
    color: "var(--text-primary)",
    transition: "border-color 0.2s",
  };

  return (
    <main className="pt-32 pb-24 min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <div className="pb-8 mb-12" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <span className="text-brand-pink text-xs font-bold tracking-widest uppercase">GLOBAL CASTING</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-2 font-display" style={{ color: "var(--text-primary)" }}>AUDITION</h1>
        </div>

        {/* Audition Criteria / Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div
            className="p-8 rounded-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="text-lg font-bold text-brand-pink uppercase tracking-widest mb-4">CATEGORIES</h3>
            <ul className="flex flex-col gap-3">
              {categories.map((cat, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-pink flex-shrink-0" />
                  {cat}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="p-8 rounded-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="text-lg font-bold text-brand-pink uppercase tracking-widest mb-4">QUALIFICATIONS</h3>
            <p className="text-sm leading-relaxed font-light" style={{ color: "var(--text-secondary)" }}>
              {locale === "ko" && "국적, 성별, 연령 제한 없음. 꿈과 열정이 있는 지망생이라면 누구나 지원 가능합니다."}
              {locale === "en" && "Open to everyone regardless of nationality, gender, or age. Anyone with passion can apply."}
              {locale === "ja" && "국적, 성별, Ages 제한 없음. 夢と情熱のある方ならどなたでも応募可能です。"}
            </p>
          </div>
        </div>

        {/* Application Form */}
        <div
          className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink/5 rounded-full blur-3xl" />

          {submitted ? (
            <div className="text-center py-16 animate-fadeInUp">
              <LuCircleCheck className="mx-auto h-14 w-14 text-brand-pink" aria-hidden="true" />
              <h3 className="text-2xl font-bold mt-6" style={{ color: "var(--text-primary)" }}>{infoFields.successTitle}</h3>
              <p className="text-sm mt-4 max-w-md mx-auto leading-relaxed font-light" style={{ color: "var(--text-muted)" }}>
                {infoFields.successDesc}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-8 text-xs font-bold tracking-widest px-8 py-3 rounded-full transition-colors hover:border-brand-pink hover:text-brand-pink"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                  background: "transparent",
                }}
              >
                GO BACK
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{infoFields.name}</label>
                  <input type="text" required style={inputStyle} />
                </div>

                {/* Birth */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{infoFields.birth}</label>
                  <input type="date" required style={inputStyle} />
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{infoFields.gender}</label>
                  <CustomSelect
                    ariaLabel={infoFields.gender}
                    value={gender || infoFields.genderOptions[0]}
                    onChange={setGender}
                    placeholder={infoFields.gender}
                    options={infoFields.genderOptions.map((option) => ({ value: option, label: option }))}
                  />
                </div>

                {/* Contact */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{infoFields.contact}</label>
                  <input type="tel" required placeholder="ex) 010-0000-0000" style={inputStyle} />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{infoFields.email}</label>
                <input type="email" required style={inputStyle} />
              </div>

              {/* Attach Link */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{infoFields.attach}</label>
                <input
                  type="url"
                  required
                  placeholder="ex) YouTube link, Google Drive link"
                  style={inputStyle}
                />
              </div>

              {/* Intro */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{infoFields.intro}</label>
                <textarea rows={5} required style={{ ...inputStyle, resize: "none" }} />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-pink hover:bg-brand-pink/90 text-black py-4 rounded-xl text-sm font-black tracking-widest transition-transform duration-300 hover:scale-[1.01] shadow-lg shadow-brand-pink/10"
              >
                {infoFields.submit}
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}
