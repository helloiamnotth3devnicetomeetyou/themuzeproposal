"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuMail, LuMapPin } from "react-icons/lu";
import { useLocale } from "@/core/providers/LocaleContext";
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
  const { locale } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { settings } = useSiteSettings();

  // 기본적으로 첫 번째 질문(0: ABOUT)이 열려있도록 초기값 설정
  const [activeTab, setActiveTab] = useState<number>(0);
  const [notices, setNotices] = useState<NoticePreview[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (activeTab !== null) {
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

  const companyDesc = {
    ko: "더뮤즈엔터테인먼트는 'YOU ARE MY MUZE'라는 슬로건 아래, 대중의 영감이 되는 독창적이고 가치 있는 대중문화를 선도하는 글로벌 연예 기획사입니다. 음악 본연의 깊이와 예술성, 그리고 트렌디한 비주얼을 결합하여 전 세계 팬들의 마음을 움직이는 글로벌 아티스트를 육성하고 있습니다.",
    en: "THE MUZE Entertainment is a global entertainment agency leading creative and valuable pop culture under the slogan 'YOU ARE MY MUZE'. We combine musical depth, artistry, and trendy visuals to cultivate global artists who inspire fans worldwide.",
    ja: "THE MUZE Entertainmentは、「YOU ARE MY MUZE」という슬로건 아래, 大衆のインスピレーションとなる独創的で価値のある大衆文化をリードするグローバル芸能事務所です。音楽本来의深みと芸術性、高いビジュアルを融合させ、世界中のファンの心を動かすグローバルアーティストを育成しています。"
  }[locale];

  const visionList = {
    ko: [
      { num: "01", title: "예술적 깊이 (Artistic Depth)", desc: "단순한 유행을 넘어 음악 본연의 진정성과 완성도를 추구합니다." },
      { num: "02", title: "독창적 콘셉트 (Sensory Concept)", desc: "향기(Scent)와 시각을 결합한 리센느(RESCENE)와 같이 감각적이고 고유한 아이덴티티를 설계합니다." },
      { num: "03", title: "글로벌 확장 (Global Stage)", desc: "다국적 멤버와 세련된 팝 사운드를 기반으로 전 세계 무대를 지향합니다." }
    ],
    en: [
      { num: "01", title: "Artistic Depth", desc: "Pursuing the authenticity and completeness of music beyond temporary trends." },
      { num: "02", title: "Original Concept", desc: "Designing sensory and unique identities like RESCENE, blending scent and sight." },
      { num: "03", title: "Global Vision", desc: "Aiming for the global stage with multicultural members and sophisticated pop sounds." }
    ],
    ja: [
      { num: "01", title: "芸術적深み", desc: "一時のトレンドを超え、音楽本来の真実性と完成度を追求します。" },
      { num: "02", title: "独創적コンセプト", desc: "香りと視覚を融合したRESCENEのように、感覚的で唯一無二의아이덴티티를 설계합니다." },
      { num: "03", title: "グローバルビジョン", desc: "多国籍メンバーと洗練されたポップサウンドを基盤に、世界中のステージを目指します." }
    ]
  }[locale];

  const historyList = sortHistoryNewestFirst(settings.history).map((item) => ({
    year: item.date,
    event: locale === "en" ? item.event_en || item.event_ko : locale === "ja" ? item.event_ja || item.event_ko : item.event_ko,
  }));
  const companyName = settings.company[`name_${locale}`] || settings.company.name_en || settings.company.name_ko || "THE MUZE HQ";
  const fallbackAddress = locale === "ko" ? "????? ??? ??? ??? ??" : locale === "ja" ? "Tokyo, Japan" : "Nonhyeon-ro, Sinsa-dong, Gangnam-gu, Seoul, Korea";
  const companyAddress = settings.company[`address_${locale}`] || settings.company.address_en || settings.company.address_ko || fallbackAddress;
  const companyEmail = settings.company.email || "contact@themuze.kr";


  const noticeList = notices.map((notice) => ({
    id: notice.id,
    date: notice.date,
    title: locale === "en" ? notice.title_en || notice.title_ko : locale === "ja" ? notice.title_ja || notice.title_ko : notice.title_ko,
    category: locale === "en" ? notice.category_en || notice.category_ko : locale === "ja" ? notice.category_ja || notice.category_ko : notice.category_ko,
  }));

  const stackItems = [
    {
      id: 0,
      label: {
        ko: "THE MUZE가 지향하는 가치와 비전",
        en: "THE MUZE values and core vision",
        ja: "THE MUZEが目指す価値とビジョン"
      }[locale],
      conclusion: {
        ko: "THE MUZE의 핵심 아이덴티티",
        en: "THE MUZE Core Identity",
        ja: "THE MUZEのアイデンティティ"
      }[locale],
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
      label: {
        ko: "그동안 걸어온 음악과 성장의 기록",
        en: "Milestones of music and corporate growth",
        ja: "歩んできた音楽と成長の歴史"
      }[locale],
      conclusion: {
        ko: "아티스트와 함께 구축한 연혁",
        en: "THE MUZE Company History",
        ja: "アーティストと歩んだ沿革"
      }[locale],
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
      label: {
        ko: "더뮤즈와 아티스트의 공식 안내 사항",
        en: "Official notices and announcements",
        ja: "THE MUZEと所属アーティストの公式公示"
      }[locale],
      conclusion: {
        ko: "최근 공지 및 공식 업데이트",
        en: "Official Announcements",
        ja: "最近の告知とアップデート"
      }[locale],
      content: (
        <div className="flex flex-col gap-3 pt-4">
          {noticesLoading && <div className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>{locale === "ko" ? "공지를 불러오는 중…" : locale === "ja" ? "お知らせを読み込んでいます…" : "Loading notices…"}</div>}
          {!noticesLoading && noticeList.map((n) => (
            <Link key={n.id} href={`/notice/${n.id}`} className="flex items-center justify-between p-4 rounded-xl border transition-all hover:translate-x-1" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink shrink-0">{n.category}</span>
                <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{n.title}</span>
              </div>
              <span className="text-xs shrink-0 pl-4" style={{ color: "var(--text-muted)" }}>{n.date}</span>
            </Link>
          ))}
          {!noticesLoading && !noticeList.length && <div className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>{locale === "ko" ? "등록된 공지가 없습니다." : locale === "ja" ? "登録されたお知らせはありません。" : "No notices have been published."}</div>}
        </div>
      )
    },
    {
      id: 3,
      label: {
        ko: "크리에이터를 위한 신사옥의 위치",
        en: "New creative building location",
        ja: "クリエイターのための新社屋の位置"
      }[locale],
      conclusion: {
        ko: "신사옥 안내 및 메일 문의",
        en: "HQ Location & E-mail Contact",
        ja: "新社屋案内とメール問い合わせ"
      }[locale],
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4">
          <div className="md:col-span-5 flex flex-col gap-5">
            <div>
              <span className="text-brand-pink text-xs font-extrabold tracking-widest uppercase block">NEW HEADQUARTERS</span>
              <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{companyName}</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                <LuMapPin className="w-4 h-4 text-brand-pink shrink-0" aria-hidden="true" />
                <style>{`.about-settings-address + span { display: none; }`}</style>
                <span className="about-settings-address">{companyAddress}</span>
                <span>{locale === "ko" ? "서울특별시 강남구 신사동 논현로 사옥" : locale === "ja" ? "大韓民국소울特別市江南区新沙洞ノンヒョン路" : "Nonhyeon-ro, Sinsa-dong, Gangnam-gu, Seoul, Korea"}</span>
              </div>
              
              <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                <LuMail className="w-4 h-4 text-brand-pink shrink-0" aria-hidden="true" />
                <a href={`mailto:${companyEmail}`} className="hover:text-brand-pink transition-colors">
                  {companyEmail}
                </a>
              </div>
            </div>

            <p className="text-xs leading-relaxed font-light" style={{ color: "var(--text-muted)" }}>
              {locale === "ko" 
                ? "2026년 7월 새롭게 이전한 신사동 사옥은 프로페셔널 레코딩 스튜디오와 연습 시설을 구비하여 크리에이터에게 최고의 집중 환경을 보장합니다."
                : locale === "ja"
                ? "2026年7月に移転した新沙洞社屋は、スタジオとダンスルームを備え、創作に専念できる環境を提供します。"
                : "The new Sinsa-dong headquarters features custom recording studios and workspace spaces, ensuring perfect focus for our artists."}
            </p>
          </div>
          <div className="md:col-span-7 relative aspect-[16/10] overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)" }}>
            <Image
              src="/images/headquarters.jpg"
              alt="THE MUZE New Building"
              fill
              className="object-cover"
              sizes="(max-w-7xl) 100vw"
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <main className="min-h-screen pt-36 pb-24 transition-colors duration-slow" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-4xl mx-auto px-6 pt-16">
        
        {/* Interactive Question Stack */}
        <section className="flex flex-col gap-6 font-sans">
          {stackItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <div 
                key={item.id} 
                id={item.id === 1 ? "about-history" : item.id === 3 ? "about-company" : undefined}
                className={`flex flex-col reveal reveal-delay-${(idx + 1) * 100}`}
                ref={(el) => { itemRefs.current[idx] = el; }}
              >
                
                {/* Clickable Stack Line */}
                <button
                  onClick={() => setActiveTab(item.id)}
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
