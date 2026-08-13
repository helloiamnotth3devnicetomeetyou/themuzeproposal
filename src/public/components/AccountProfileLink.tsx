"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/core/providers/LocaleContext";
import styles from "@/styles/(public)/pages/protect.module.css";

type Locale = "ko" | "en" | "ja";

const copy: Record<
  Locale,
  {
    profileLabel: (name: string) => string;
    remaining: (count: number) => string;
    quotaInfo: string;
  }
> = {
  ko: {
    profileLabel: (name) => `${name} 프로필`,
    remaining: (count) => `오늘 제출 가능 ${count}회`,
    quotaInfo: "하루 5회 제출할 수 있습니다.",
  },
  en: {
    profileLabel: (name) => `${name} profile`,
    remaining: (count) =>
      `${count} submission${count === 1 ? "" : "s"} remaining today`,
    quotaInfo: "You can submit up to 5 times per day.",
  },
  ja: {
    profileLabel: (name) => `${name}のプロフィール`,
    remaining: (count) => `本日あと${count}回送信できます`,
    quotaInfo: "1日に5回まで送信できます。",
  },
};

export default function AccountProfileLink({
  name,
  email,
  avatarUrl,
  remaining,
}: {
  name: string;
  email: string;
  avatarUrl: string;
  remaining: number;
}) {
  const { locale } = useLocale();
  const pageCopy = copy[locale as Locale] || copy.ko;
  const label = name || "THE MUZE";
  return (
    <section className={styles.accountBlock}>
      <Link
        href="/account"
        className={styles.accountProfile}
        aria-label={pageCopy.profileLabel(label)}
      >
        <span aria-hidden="true">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={32} height={32} sizes="32px" />
          ) : (
            (label[0] || email[0] || "M").toUpperCase()
          )}
        </span>
        <b>{label}</b>
        <small>{email}</small>
      </Link>
      <div className={styles.quota} aria-label={pageCopy.remaining(remaining)}>
        <span className={styles.quotaDots} aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} data-available={index < remaining} />
          ))}
        </span>
        <span className={styles.quotaInfo} tabIndex={0}>
          i<span role="tooltip">{pageCopy.quotaInfo}</span>
        </span>
      </div>
    </section>
  );
}
