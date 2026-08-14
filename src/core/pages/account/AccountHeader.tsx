"use client";

import Image from "next/image";
import styles from "@/styles/(core)/pages/account.module.css";
import type {
  AccountCopy,
  AccountSection,
  AccountSectionMeta,
} from "./account-types";

type AccountHeaderProps = {
  t: AccountCopy;
  sections: AccountSectionMeta[];
  activeSection: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  name: string;
  originalEmail: string;
  savedAvatarUrl?: string;
};

export function AccountHeader({
  t,
  sections,
  activeSection,
  onSectionChange,
  name,
  originalEmail,
  savedAvatarUrl,
}: AccountHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerSticky}>
        <h1>ACCOUNT</h1>
        <p>{t.intro}</p>
        <nav className={styles.tabs} aria-label="Account settings">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? styles.activeTab : ""}
              onClick={() => onSectionChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className={styles.accountMeta}>
          <div className={styles.accountMetaAvatar}>
            {savedAvatarUrl ? (
              <Image
                src={savedAvatarUrl}
                alt={`${name || "사용자"} 아바타`}
                width={58}
                height={58}
                sizes="58px"
              />
            ) : (
              <b aria-hidden="true">
                {(originalEmail.trim()[0] || "M").toUpperCase()}
              </b>
            )}
          </div>
          <div className={styles.accountMetaCopy}>
            <span>{name || "THE MUZE"}</span>
            <b>{originalEmail}</b>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AccountContentHeader({
  activeMeta,
  activeIndex,
  totalSections,
}: {
  activeMeta: AccountSectionMeta;
  activeIndex: number;
  totalSections: number;
}) {
  return (
    <header className={styles.contentHeader}>
      <div>
        <h2>{activeMeta.label}</h2>
        <p>{activeMeta.description}</p>
      </div>
      <em>
        {String(activeIndex + 1).padStart(2, "0")} /{" "}
        {String(totalSections).padStart(2, "0")}
      </em>
    </header>
  );
}
