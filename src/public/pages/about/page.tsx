"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import { useTheme } from "@/core/providers/ThemeContext";
import { supabase } from "@/core/supabase/client";
import { sortHistoryNewestFirst } from "@/core/content/site-content";
import { useSiteSettings } from "@/public/features/settings/useSiteSettings";

type NoticePreview = {
  id: string;
  date: string;
  title_ko: string;
  title_en: string;
  title_ja: string;
  category_ko: string;
  category_en: string;
  category_ja: string;
};

export default function About() {
  const { locale, t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { settings } = useSiteSettings();

  // 기본적으로 첫 번째 질문(0: ABOUT)이 열려있도록 초기값 설정
  const [activeTab, setActiveTab] = useState<number>(0);
  const [notices, setNotices] = useState<NoticePreview[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasChangedTab = useRef(false);

  useEffect(() => {
    if (activeTab !== null && hasChangedTab.current) {
      const timer = setTimeout(() => {
        itemRefs.current[activeTab]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  useEffect(() => {
    let active = true;

    const loadAboutContent = async () => {
      const noticesResult = await supabase
        .from("notices")
        .select("id,date,title_ko,title_en,title_ja,category_ko,category_en,category_ja")
        .eq("is_published", true)
        .is("artist_id", null)
        .order("published_at", { ascending: false })
        .limit(3);
      if (!active) return;

      setNotices((noticesResult.data ?? []) as NoticePreview[]);
      setNoticesLoading(false);
    };

    void loadAboutContent();
    return () => { active = false; };
  }, []);

  const companyDesc = t.about.companyDescription;
  const visionList = t.about.vision.map((item, index) => ({
    num: String(index + 1).padStart(2, "0"),
    title: item.title,
    desc: item.description,
  }));

  const historyList = sortHistoryNewestFirst(settings.history).map((item) => ({
    year: item.date,
    event: localizeText({ ko: item.event_ko, en: item.event_en, ja: item.event_ja }, locale),
  }));
  const companyName = localizeText({ ko: settings.company.name_ko, en: settings.company.name_en, ja: settings.company.name_ja }, locale, "THE MUZE HQ");
  const companyAddress = localizeText({ ko: settings.company.address_ko, en: settings.company.address_en, ja: settings.company.address_ja }, locale, t.about.addressFallback);
  const companyEmail = settings.company.email || "contact@themuze.kr";


  const noticeList = notices.map((notice) => ({
    id: notice.id,
    date: notice.date,
    title: localizeText({ ko: notice.title_ko, en: notice.title_en, ja: notice.title_ja }, locale),
    category: localizeText({ ko: notice.category_ko, en: notice.category_en, ja: notice.category_ja }, locale),
  }));

  const stackItems = [
    {
      id: 0,
      label: t.about.valueLabel,
      conclusion: t.about.valueConclusion,
      content: (
        <div className="flex flex-col gap-8 pt-4">
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
              <span className="text-brand-pink text-xs font-black tracking-widest uppercase">COMPANY SLOGAN</span>
              <div className="relative py-1 min-h-[56px] flex items-center overflow-hidden w-full max-w-xl">
                <svg viewBox="0 0 520 48" className="w-full h-auto overflow-visible" key={`${activeTab}-${activeTab === 0}`}>
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
                      letterSpacing: "1.5px"
                    }}
                    className="animate-stroke-draw select-none"
                  >
                    you are my muze
                  </text>
                </svg>
              </div>
              <p className="text-base leading-relaxed font-light mt-1" style={{ color: "var(--text-secondary)" }}>{companyDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            {visionList.map((val, idx) => (
              <div key={idx} className="p-6 rounded-2xl border transition-all duration-slow hover:-translate-y-1" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                <span className="text-brand-pink text-xs font-bold font-display block mb-1">{val.num}</span>
                <h4 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>{val.title}</h4>
                <p className="text-xs leading-relaxed font-light" style={{ color: "var(--text-secondary)" }}>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 1,
      label: t.about.historyLabel,
      conclusion: t.about.historyConclusion,
      content: (
        <div className="pl-6 md:pl-16 border-l py-4" style={{ borderColor: "var(--border-default)" }}>
          {historyList.map((item, idx) => (
            <div key={idx} className="mb-10 relative last:mb-0 group">
              <span className="absolute -left-[31px] md:-left-[21px] top-1.5 w-3.5 h-3.5 border-2 border-brand-pink rounded-full bg-base shadow-[0_0_8px_var(--alpha-fc6fcf-4)] group-hover:bg-brand-pink transition-colors duration-slow" style={{ backgroundColor: "var(--bg-base)" }} />
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
                <span className="text-brand-pink font-display font-black text-base sm:w-28 shrink-0">{item.year}</span>
                <p className="text-sm font-light flex-1" style={{ color: "var(--text-secondary)" }}>{item.event}</p>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 2,
      label: t.about.noticesLabel,
      conclusion: t.about.noticesConclusion,
      content: (
        <div className="flex flex-col gap-3 pt-4">
          {noticesLoading && <div className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>{t.about.noticesLoading}</div>}
          {!noticesLoading && noticeList.map((n) => (
            <Link key={n.id} href={`/notice/${n.id}`} className="flex items-center justify-between p-4 rounded-xl border transition-all hover:translate-x-1" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink shrink-0">{n.category}</span>
                <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{n.title}</span>
              </div>
              <span className="text-xs shrink-0 pl-4" style={{ color: "var(--text-muted)" }}>{n.date}</span>
            </Link>
          ))}
          {!noticesLoading && !noticeList.length && <div className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>{t.about.noticesEmpty}</div>}
        </div>
      )
    },
    {
      id: 3,
      label: t.about.locationLabel,
      conclusion: t.about.locationConclusion,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4">
          <div className="md:col-span-5 flex flex-col gap-5">
            <div>
              <span className="text-brand-pink text-xs font-extrabold tracking-widest uppercase block">NEW HEADQUARTERS</span>
              <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{companyName}</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                <MapPin className="w-4 h-4 text-brand-pink shrink-0" aria-hidden="true" />
                <span className="about-settings-address">{companyAddress}</span>
              </div>
              
              <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                <Mail className="w-4 h-4 text-brand-pink shrink-0" aria-hidden="true" />
                <a href={`mailto:${companyEmail}`} className="hover:text-brand-pink transition-colors">
                  {companyEmail}
                </a>
              </div>
            </div>

            <p className="text-xs leading-relaxed font-light" style={{ color: "var(--text-muted)" }}>
              {t.about.headquartersDescription}
            </p>
          </div>
          <div className="md:col-span-7 relative aspect-[16/10] overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)" }}>
            <Image
              src="/images/headquarters.jpg"
              alt="THE MUZE New Building"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 58vw"
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <main className="min-h-screen pb-24 transition-colors duration-slow" style={{ paddingTop: "var(--page-top-space)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-4xl mx-auto px-6 pt-16">
        
        {/* Interactive Question Stack */}
        <section className="flex flex-col gap-6 font-sans">
          {stackItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <div 
                key={item.id} 
                id={item.id === 1 ? "about-history" : item.id === 3 ? "about-company" : undefined}
                className="flex flex-col reveal reveal-delay-100"
                ref={(el) => { itemRefs.current[idx] = el; }}
              >
                
                {/* Clickable Stack Line */}
                <button
                  onClick={() => { hasChangedTab.current = true; setActiveTab(item.id); }}
                  className="w-full text-left flex items-start gap-3 py-1.5 focus:outline-none cursor-pointer group"
                >
                  {/* Arrow prefix (only visible on active) */}
                  <span
                    className={`text-2xl md:text-4xl font-extrabold tracking-tight shrink-0 transition-all duration-slow ${
                      isActive ? "opacity-100 translate-x-0 text-brand-pink" : "opacity-0 -translate-x-2"
                    }`}
                  >
                    →
                  </span>

                  <div className="flex-1">
                    {isActive ? (
                      /* Active State: Highlight background, bold text, no strike-through */
                      <span
                        className="inline-block text-2xl md:text-4xl font-extrabold tracking-tight px-3.5 py-1 rounded-xl transition-all duration-slow transform scale-102"
                        style={{
                          backgroundColor: "var(--alpha-fc6fcf-15)",
                          color: "var(--color-brand-pink)"
                        }}
                      >
                        {item.conclusion}
                      </span>
                    ) : (
                      /* Inactive State: Gray color, strike-through (line-through), regular weight */
                      <span
                        className="inline-block text-2xl md:text-4xl font-semibold tracking-tight line-through opacity-25 group-hover:opacity-45 transition-all duration-slow"
                        style={{ color: "var(--text-primary)" }}
                      >
                        &quot;{item.label}&quot;
                      </span>
                    )}
                  </div>
                </button>

                {/* Content Panel with smooth height transition */}
                <div 
                  className="overflow-hidden transition-all duration-500 ease-in-out pl-8 md:pl-11 pr-2"
                  style={{
                    maxHeight: isActive ? "800px" : "0px",
                    opacity: isActive ? 1 : 0,
                    borderBottom: isActive ? "1px solid var(--border-subtle)" : "1px solid transparent",
                    paddingBottom: isActive ? "2rem" : "0rem",
                    marginTop: isActive ? "1rem" : "0rem"
                  }}
                >
                  {item.content}
                </div>
              </div>
            );
          })}
        </section>

      </div>
    </main>
  );
}
