import Link from "next/link";
import styles from "@/styles/(public)/pages/protect.module.css";

export default function AccountProfileLink({ name, email }: { name: string; email: string }) {
  const label = name || "THE MUZE";
  return <Link href="/account" className={styles.accountProfile} aria-label={`${label} profile`}>
    <span aria-hidden="true">{(label[0] || email[0] || "M").toUpperCase()}</span>
    <b>{label}</b>
    <small>{email}</small>
  </Link>;
}
