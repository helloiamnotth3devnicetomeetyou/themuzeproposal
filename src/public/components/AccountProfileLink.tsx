import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/(public)/pages/protect.module.css";

export default function AccountProfileLink({ name, email, avatarUrl, remaining }: { name: string; email: string; avatarUrl: string; remaining: number }) {
  const label = name || "THE MUZE";
  return <section className={styles.accountBlock}>
    <Link href="/account" className={styles.accountProfile} aria-label={`${label} profile`}>
      <span aria-hidden="true">{avatarUrl ? <Image src={avatarUrl} alt="" width={32} height={32} sizes="32px" /> : (label[0] || email[0] || "M").toUpperCase()}</span>
      <b>{label}</b>
      <small>{email}</small>
    </Link>
    <div className={styles.quota} aria-label={`오늘 제출 가능 ${remaining}회`}>
      <span className={styles.quotaDots} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <i key={index} data-available={index < remaining} />)}
      </span>
      <span className={styles.quotaInfo} tabIndex={0}>i<span role="tooltip">하루 5회 제출할 수 있습니다.</span></span>
    </div>
  </section>;
}
