"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import { useTheme } from "@/core/providers/ThemeContext";
import type { NoticeListItemDTO } from "@/public/features/notices/types";
import { sortHistoryNewestFirst } from "@/core/content/site-content";
import { useSiteSettings } from "@/public/features/settings/useSiteSettings";

export default function About({
  initialNotices,
}: {
  initialNotices: NoticeListItemDTO[];
}) {
  const { locale, t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { settings } = useSiteSettings();

  // 기본적으로 첫 번째 질문(0: ABOUT)이 열려있도록 초기값 설정
  const [activeTab, setActiveTab] = useState<number>(0);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasChangedTab = useRef(false);

  useEffect(() => {
    if (activeTab !== null && hasChangedTab.current) {
      const timer = setTimeout(() => {
        itemRefs.current[activeTab]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const companyDesc = t.about.companyDescription;
  const visionList = t.about.vision.map((item, index) => ({
    num: String(index + 1).padStart(2, "0"),
    title: item.title,
    desc: item.description,
  }));

  const historyList = sortHistoryNewestFirst(settings.history).map((item) => ({
    year: item.date,
    event: localizeText(
      { ko: item.event_ko, en: item.event_en, ja: item.event_ja },
      locale,
    ),
  }));
  const companyName = localizeText(
    {
      ko: settings.company.name_ko,
      en: settings.company.name_en,
      ja: settings.company.name_ja,
    },
    locale,
    "THE MUZE HQ",
  );
  const companyAddress = localizeText(
    {
      ko: settings.company.address_ko,
      en: settings.company.address_en,
      ja: settings.company.address_ja,
    },
    locale,
    t.about.addressFallback,
  );
  const companyEmail = settings.company.email || "contact@themuze.kr";

  const noticeList = initialNotices.map((notice) => ({
    id: notice.id,
    date: notice.date,
    title: localizeText(notice.title, locale),
    category: localizeText(notice.category, locale),
  }));

  const stackItems = [
    {
      id: 0,
      label: t.about.valueLabel,
      conclusion: t.about.valueConclusion,
      content: (
        <div className="flex flex-col gap-8 md:pt-4">
          <div className="flex flex-col gap-6 items-start">
            <div className="relative w-64 h-20 transition-transform duration-slow hover:scale-102">
              <Image
                src="/images/logo.png"
                alt="THE MUZE Logo Emblem"
                fill
                sizes="256px"
                className="object-contain"
                style={isDark ? { filter: "invert(1)" } : {}}
              />
            </div>
            <div className="flex flex-col gap-3 pl-4 border-l-4 border-brand-pink w-full">
              <span className="text-brand-pink text-xs font-black tracking-widest uppercase">
                COMPANY SLOGAN
              </span>
              <div className="relative py-1 min-h-[56px] flex items-center overflow-hidden w-full max-w-xl">
                <svg
                  viewBox="0 0 520 48"
                  className="w-full h-auto overflow-visible"
                  key={`${activeTab}-${activeTab === 0}`}
                >
                  <text
                    x="2"
                    y="34"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="1"
                    style={{
                      fontFamily: "var(--font-hero)",
                      fontWeight: 700,
                      fontSize: "25px",
                      letterSpacing: "1.5px",
                    }}
                    className="animate-stroke-draw select-none"
                  >
                    you are my muze
                  </text>
                </svg>
              </div>
              <p
                className="text-base leading-relaxed font-light mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {companyDesc}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            {visionList.map((val, idx) => (
              <div
                key={idx}
                className="rounded-xl border p-5 transition-transform duration-slow hover:-translate-y-1 md:rounded-2xl md:p-6"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <span className="text-brand-pink text-xs font-bold font-display block mb-1">
                  {val.num}
                </span>
                <h4
                  className="text-base font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {val.title}
                </h4>
                <p
                  className="text-xs leading-relaxed font-light"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 1,
      label: t.about.historyLabel,
      conclusion: t.about.historyConclusion,
      content: (
        <div
          className="border-l py-1 pl-5 md:pl-16 md:py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          {historyList.map((item, idx) => (
            <div key={idx} className="mb-9 last:mb-0">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
                <span className="text-brand-pink font-display font-black text-base sm:w-28 shrink-0">
                  {item.year}
                </span>
                <p
                  className="text-sm font-light flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 2,
      label: t.about.noticesLabel,
      conclusion: t.about.noticesConclusion,
      content: (
        <div className="flex flex-col gap-3 pt-4">
          {noticeList.map((n) => (
            <Link
              key={n.id}
              href={`/notice/${n.id}`}
              className="flex items-center justify-between p-4 rounded-xl border transition-all hover:translate-x-1"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink shrink-0">
                  {n.category}
                </span>
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {n.title}
                </span>
              </div>
              <span
                className="text-xs shrink-0 pl-4"
                style={{ color: "var(--text-muted)" }}
              >
                {n.date}
              </span>
            </Link>
          ))}
          {!noticeList.length && (
            <div className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>
              {t.about.noticesEmpty}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 3,
      label: t.about.locationLabel,
      conclusion: t.about.locationConclusion,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4">
          <div className="md:col-span-5 flex flex-col gap-5">
            <div>
              <span className="text-brand-pink text-xs font-extrabold tracking-widest uppercase block">
                NEW HEADQUARTERS
              </span>
              <h3
                className="text-2xl font-black mt-1"
                style={{ color: "var(--text-primary)" }}
              >
                {companyName}
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              <div
                className="flex items-center gap-2.5 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                <MapPin
                  className="w-4 h-4 text-brand-pink shrink-0"
                  aria-hidden="true"
                />
                <span className="about-settings-address">{companyAddress}</span>
              </div>

              <div
                className="flex items-center gap-2.5 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                <Mail
                  className="w-4 h-4 text-brand-pink shrink-0"
                  aria-hidden="true"
                />
                <a
                  href={`mailto:${companyEmail}`}
                  className="hover:text-brand-pink transition-colors"
                >
                  {companyEmail}
                </a>
              </div>
            </div>

            <p
              className="text-xs leading-relaxed font-light"
              style={{ color: "var(--text-muted)" }}
            >
              {t.about.headquartersDescription}
            </p>
          </div>
          <div
            className="md:col-span-7 relative aspect-[16/10] overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <Image
              src="/images/headquarters.jpg"
              alt="THE MUZE New Building"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 58vw"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <main
      className="min-h-screen pb-24 transition-colors duration-slow"
      style={{
        paddingTop: "var(--page-top-space)",
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      <div className="mx-auto max-w-4xl px-6 pt-10 md:pt-16">
        <section className="font-sans">
          {stackItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                id={
                  item.id === 1
                    ? "about-history"
                    : item.id === 3
                      ? "about-company"
                      : undefined
                }
                className="flex flex-col border-b py-10 last:border-b-0 md:border-b-0 md:py-0"
                style={{ borderColor: "var(--border-subtle)" }}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
              >
                <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-brand-pink md:hidden">
                  {item.conclusion}
                </h2>
                <button
                  onClick={() => {
                    hasChangedTab.current = true;
                    setActiveTab(item.id);
                  }}
                  aria-controls={`about-panel-${item.id}`}
                  aria-expanded={isActive}
                  className="hidden w-full cursor-pointer items-start gap-3 py-1.5 text-left focus:outline-none md:flex group"
                >
                  <span
                    className={`text-2xl md:text-4xl font-extrabold tracking-tight shrink-0 transition-all duration-slow ${
                      isActive
                        ? "opacity-100 translate-x-0 text-brand-pink"
                        : "opacity-0 -translate-x-2"
                    }`}
                  >
                    →
                  </span>

                  <div className="flex-1">
                    {isActive ? (
                      <span
                        className="inline-block text-2xl md:text-4xl font-extrabold tracking-tight px-3.5 py-1 rounded-xl transition-all duration-slow transform scale-102"
                        style={{
                          backgroundColor: "var(--alpha-fc6fcf-15)",
                          color: "var(--color-brand-pink)",
                        }}
                      >
                        {item.conclusion}
                      </span>
                    ) : (
                      <span
                        className="inline-block text-2xl md:text-4xl font-semibold tracking-tight line-through opacity-25 group-hover:opacity-45 transition-all duration-slow"
                        style={{ color: "var(--text-primary)" }}
                      >
                        &quot;{item.label}&quot;
                      </span>
                    )}
                  </div>
                </button>

                <div
                  id={`about-panel-${item.id}`}
                  className={`mt-5 block opacity-100 transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out md:mt-0 md:grid ${
                    isActive
                      ? "md:mt-4 md:grid-rows-[1fr] md:opacity-100"
                      : "md:grid-rows-[0fr] md:opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div
                      className={`pb-0 md:pl-11 md:pr-2 ${
                        isActive
                          ? "md:border-b md:pb-8"
                          : "md:border-b-transparent"
                      }`}
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      {item.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
