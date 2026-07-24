"use client";

import { useState } from "react";
import { LuCircleCheck } from "react-icons/lu";
import CustomSelect from "@/components/ui/CustomSelect";
import { useLocale } from "../../context/LocaleContext";
import styles from "./audition.module.css";

export default function Audition() {
  const { locale } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [gender, setGender] = useState("");

  const categories: { name: string; sub: string | null }[] = {
    ko: [
      { name: "보컬", sub: "Vocal" },
      { name: "댄스", sub: "Dance" },
      { name: "랩", sub: "Rap" },
      { name: "비주얼 / 연기", sub: "Visual / Acting" },
    ],
    en: [
      { name: "Vocal", sub: null },
      { name: "Dance", sub: null },
      { name: "Rap", sub: null },
      { name: "Visual / Acting", sub: null },
    ],
    ja: [
      { name: "ボーカル", sub: "Vocal" },
      { name: "ダンス", sub: "Dance" },
      { name: "ラップ", sub: "Rap" },
      { name: "ビジュアル / 演技", sub: "Visual / Acting" },
    ],
  }[locale];

  const copy = {
    ko: {
      eyebrow: "GLOBAL CASTING",
      title: "AUDITION",
      desc: "국적, 성별, 나이 제한 없이 꿈과 열정을 가진 누구나 지원할 수 있습니다.",
      categoriesLabel: "CATEGORIES",
      qualLabel: "QUALIFICATIONS",
      qualText:
        "국적, 성별, 연령 제한 없음. 꿈과 열정이 있는 지망생이라면 누구나 지원 가능합니다. 서류 합격자에 한해 개별 연락드립니다.",
      formLabel: "APPLICATION",
      name: "이름",
      birth: "생년월일",
      gender: "성별",
      genderOptions: ["남성", "여성"],
      contact: "연락처",
      email: "이메일",
      intro: "자기소개",
      attach: "오디션 영상 및 사진 링크",
      attachPlaceholder: "YouTube, Google Drive 링크",
      submit: "지원서 제출하기",
      successTitle: "제출 완료",
      successDesc:
        "소중한 지원 감사드립니다. 검토 후 서류 합격자에 한해 개별 연락드리겠습니다.",
      back: "BACK",
      statusLabel: "STATUS",
      statusValue: "OPEN",
      periodLabel: "PERIOD",
      periodValue: "상시 모집",
    },
    en: {
      eyebrow: "GLOBAL CASTING",
      title: "AUDITION",
      desc: "Open to everyone regardless of nationality, gender, or age.",
      categoriesLabel: "CATEGORIES",
      qualLabel: "QUALIFICATIONS",
      qualText:
        "Open to all nationalities, genders, and ages. Anyone with passion and a dream is welcome. Qualified candidates will be contacted individually.",
      formLabel: "APPLICATION",
      name: "Name",
      birth: "Date of Birth",
      gender: "Gender",
      genderOptions: ["Male", "Female"],
      contact: "Contact",
      email: "Email",
      intro: "Self-Introduction",
      attach: "Audition Video & Photo Link",
      attachPlaceholder: "YouTube, Google Drive link",
      submit: "Submit Application",
      successTitle: "Submitted",
      successDesc:
        "Thank you for applying. We will review your materials and contact qualified candidates individually.",
      back: "BACK",
      statusLabel: "STATUS",
      statusValue: "OPEN",
      periodLabel: "PERIOD",
      periodValue: "Open all year",
    },
    ja: {
      eyebrow: "GLOBAL CASTING",
      title: "AUDITION",
      desc: "国籍・性別・年齢不問。夢と情熱のある方ならどなたでも応募可能です。",
      categoriesLabel: "CATEGORIES",
      qualLabel: "QUALIFICATIONS",
      qualText:
        "国籍・性別・年齢制限はありません。夢と情熱のある方ならどなたでも応募可能です。書類合格者にのみ個別にご連絡いたします。",
      formLabel: "APPLICATION",
      name: "名前",
      birth: "生年月日",
      gender: "性別",
      genderOptions: ["男性", "女性"],
      contact: "連絡先",
      email: "メールアドレス",
      intro: "自己紹介",
      attach: "オーディション映像・写真リンク",
      attachPlaceholder: "YouTube、Google Drive リンク",
      submit: "応募する",
      successTitle: "応募完了",
      successDesc:
        "ご応募ありがとうございます。選考の上、合格者の方にのみ個別にご連絡いたします。",
      back: "BACK",
      statusLabel: "STATUS",
      statusValue: "OPEN",
      periodLabel: "PERIOD",
      periodValue: "通年募集",
    },
  }[locale];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className={styles.pageFrame}>
      <div className={styles.shell}>

        {/* ── Left: sticky sidebar ─────────────────────────── */}
        <div className={styles.titleColumn}>
          <div className={styles.titleSticky}>
            <span className={styles.eyebrow}>{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.desc}</p>

            <div className={styles.sideInfoBlock}>
              <div className={styles.sideInfoItem}>
                <span className={styles.sideInfoLabel}>{copy.statusLabel}</span>
                <span className={styles.sideInfoValue} style={{ color: "var(--color-brand-pink)" }}>
                  {copy.statusValue}
                </span>
              </div>
              <div className={styles.sideInfoItem}>
                <span className={styles.sideInfoLabel}>{copy.periodLabel}</span>
                <span className={styles.sideInfoValue}>{copy.periodValue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: content ───────────────────────────────── */}
        <div className={styles.contentColumn}>

          {/* Categories */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{copy.categoriesLabel}</span>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((cat, idx) => (
              <div key={idx} className={styles.categoryItem}>
                <span className={styles.categoryIndex}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className={styles.categoryName}>
                  {cat.name}
                  {cat.sub && (
                    <span className={styles.categoryNameSub}>{cat.sub}</span>
                  )}
                </span>
                <span className={styles.categoryDot} aria-hidden="true" />
              </div>
            ))}
          </div>

          {/* Qualifications */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{copy.qualLabel}</span>
          </div>
          <div className={styles.qualBlock}>
            <p className={styles.qualText}>{copy.qualText}</p>
          </div>

          {/* Form */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{copy.formLabel}</span>
          </div>

          {submitted ? (
            <div className={styles.successState}>
              <LuCircleCheck className={styles.successIcon} aria-hidden="true" />
              <h2 className={styles.successTitle}>{copy.successTitle}</h2>
              <p className={styles.successDesc}>{copy.successDesc}</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={styles.backBtn}
              >
                {copy.back}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                {/* Name */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{copy.name}</label>
                  <input type="text" required className={styles.fieldInput} />
                </div>
                {/* Birth */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{copy.birth}</label>
                  <input type="date" required className={styles.fieldInput} />
                </div>
                {/* Gender */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{copy.gender}</label>
                  <CustomSelect
                    ariaLabel={copy.gender}
                    value={gender || copy.genderOptions[0]}
                    onChange={setGender}
                    placeholder={copy.gender}
                    options={copy.genderOptions.map((opt) => ({ value: opt, label: opt }))}
                  />
                </div>
                {/* Contact */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{copy.contact}</label>
                  <input
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    className={styles.fieldInput}
                  />
                </div>
              </div>

              {/* Email */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{copy.email}</label>
                <input type="email" required className={styles.fieldInput} />
              </div>

              {/* Link */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{copy.attach}</label>
                <input
                  type="url"
                  required
                  placeholder={copy.attachPlaceholder}
                  className={styles.fieldInput}
                />
              </div>

              {/* Self-intro */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{copy.intro}</label>
                <textarea
                  rows={6}
                  required
                  className={`${styles.fieldInput} ${styles.fieldTextarea}`}
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                {copy.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
