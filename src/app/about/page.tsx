"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "../context/LocaleContext";
import { useTheme } from "../context/ThemeContext";

export default function About() {
  const { locale } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 기본적으로 첫 번째 질문(0: ABOUT)이 열려있도록 초기값 설정
  const [activeTab, setActiveTab] = useState<number>(0);

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

  const historyList = {
    ko: [
      { year: "2026. 07", event: "이넷투자파트너스 등으로부터 20억 신규 투자 유치 및 신사동 신사옥 이전" },
      { year: "2026. 07", event: "RESCENE 스페셜 싱글 《Pretty Girl》 발매" },
      { year: "2025. 11", event: "RESCENE 미니 3집 《lip bomb》 발매" },
      { year: "2025. 02", event: "RESCENE 미니 2집 《Glow Up》 발매" },
      { year: "2024. 08", event: "RESCENE 미니 1집 《SCENEDROME》 발매" },
      { year: "2024. 03", event: "더뮤즈 첫 5인조 걸그룹 리센느(RESCENE) 공식 데뷔 (싱글 1집 《Re:Scene》)" },
      { year: "2020. 12", event: "더뮤즈엔터테인먼트 법인 설립" }
    ],
    en: [
      { year: "2026. 07", event: "Secured 2B KRW investment & Moved to Sinsa-dong headquarters" },
      { year: "2026. 07", event: "Released RESCENE Special Single 《Pretty Girl》" },
      { year: "2025. 11", event: "Released RESCENE 3rd Mini Album 《lip bomb》" },
      { year: "2025. 02", event: "Released RESCENE 2nd Mini Album 《Glow Up》" },
      { year: "2024. 08", event: "Released RESCENE 1st Mini Album 《SCENEDROME》" },
      { year: "2024. 03", event: "RESCENE Officially Debuted (1st Single Album 《Re:Scene》)" },
      { year: "2020. 12", event: "THE MUZE Entertainment Co., Ltd. Founded" }
    ],
    ja: [
      { year: "2026. 07", event: "20億ウォンの新規投資誘致および新沙洞の新社屋へ移転" },
      { year: "2026. 07", event: "RESCENE スペシャルシングル 《Pretty Girl》 リリース" },
      { year: "2025. 11", event: "RESCENE 3rdミニアルバム 《lip bomb》 リリース" },
      { year: "2025. 02", event: "RESCENE 2ndミニアルバム 《Glow Up》 リリース" },
      { year: "2024. 08", event: "RESCENE 1stミニアルバム 《SCENEDROME》 リリース" },
      { year: "2024. 03", event: "初の5人組ガールズグループRESCENEが正式デビュー (1stシングル 《Re:Scene》)" },
      { year: "2020. 12", event: "THE MUZE Entertainment 法인設立" }
    ]
  }[locale];

  const noticeList = {
    ko: [
      { date: "2026-07-16", title: "더뮤즈엔터테인먼트 공식 홈페이지 리뉴얼 안내", category: "공지" },
      { date: "2026-07-10", title: "RESCENE Special Single 'Pretty Girl' 음원 발매 및 팬이벤트 안내", category: "이벤트" },
      { date: "2026-07-01", title: "신사동 사옥 이전 완료에 따른 본사 주소지 변경 안내", category: "안내" }
    ],
    en: [
      { date: "2026-07-16", title: "Official Website Renewal Announcement", category: "Notice" },
      { date: "2026-07-10", title: "RESCENE Special Single 'Pretty Girl' Release & Fan Event Details", category: "Event" },
      { date: "2026-07-01", title: "Headquarters Address Change (Relocation to Sinsa-dong)", category: "Info" }
    ],
    ja: [
      { date: "2026-07-16", title: "公式ウェブサイトリニューアルのご案内", category: "告知" },
      { date: "2026-07-10", title: "RESCENE スペシャルシングル 'Pretty Girl' リリースおよびファンイベント案内", category: "イベント" },
      { date: "2026-07-01", title: "新沙洞社屋移転完了に伴う本社住所変更のご案内", category: "案内" }
    ]
  }[locale];

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
            <div className="relative w-64 h-20 transition-transform duration-300 hover:scale-102">
              <Image
                src="/images/logo.png"
                alt="THE MUZE Logo Emblem"
                fill
                className="object-contain"
                style={isDark ? { filter: "invert(1)" } : {}}
              />
            </div>
            <div className="flex flex-col gap-3 pl-4 border-l-4 border-brand-pink w-full">
              <span className="text-brand-pink text-xs font-black tracking-widest uppercase">COMPANY SLOGAN</span>
              <div className="relative py-1 min-h-[44px] flex items-center overflow-hidden w-full max-w-md">
                <svg viewBox="0 0 350 40" className="w-full h-auto overflow-visible" key={`${activeTab}-${activeTab === 0}`}>
                  <text
                    x="2"
                    y="28"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: "22px",
                      letterSpacing: "1px"
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
              <div key={idx} className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
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
              <span className="absolute -left-[31px] md:-left-[21px] top-1.5 w-3.5 h-3.5 border-2 border-brand-pink rounded-full bg-base shadow-[0_0_8px_rgba(252,111,207,0.4)] group-hover:bg-brand-pink transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)" }} />
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
          {noticeList.map((n, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border transition-all hover:translate-x-1" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink shrink-0">{n.category}</span>
                <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{n.title}</span>
              </div>
              <span className="text-xs shrink-0 pl-4" style={{ color: "var(--text-muted)" }}>{n.date}</span>
            </div>
          ))}
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
              <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>THE MUZE HQ</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                <svg className="w-4 h-4 text-brand-pink shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{locale === "ko" ? "서울특별시 강남구 신사동 논현로 사옥" : locale === "ja" ? "大韓民국소울特別市江南区新沙洞ノンヒョン路" : "Nonhyeon-ro, Sinsa-dong, Gangnam-gu, Seoul, Korea"}</span>
              </div>
              
              <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                <svg className="w-4 h-4 text-brand-pink shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <a href="mailto:contact@themuze.kr" className="hover:text-brand-pink transition-colors">
                  contact@themuze.kr
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
    <main className="min-h-screen pt-36 pb-24 transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-4xl mx-auto px-6 pt-16">
        
        {/* Interactive Question Stack */}
        <section className="flex flex-col gap-6 font-sans">
          {stackItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <div 
                key={item.id} 
                className="flex flex-col"
                ref={(el) => { itemRefs.current[idx] = el; }}
              >
                
                {/* Clickable Stack Line */}
                <button
                  onClick={() => setActiveTab(item.id)}
                  className="w-full text-left flex items-start gap-3 py-1.5 focus:outline-none cursor-pointer group"
                >
                  {/* Arrow prefix (only visible on active) */}
                  <span
                    className={`text-2xl md:text-4xl font-extrabold tracking-tight shrink-0 transition-all duration-300 ${
                      isActive ? "opacity-100 translate-x-0 text-brand-pink" : "opacity-0 -translate-x-2"
                    }`}
                  >
                    →
                  </span>

                  <div className="flex-1">
                    {isActive ? (
                      /* Active State: Highlight background, bold text, no strike-through */
                      <span
                        className="inline-block text-2xl md:text-4xl font-extrabold tracking-tight px-3.5 py-1 rounded-xl transition-all duration-300 transform scale-102"
                        style={{
                          backgroundColor: "rgba(252, 111, 207, 0.15)",
                          color: "var(--color-brand-pink)"
                        }}
                      >
                        {item.conclusion}
                      </span>
                    ) : (
                      /* Inactive State: Gray color, strike-through (line-through), regular weight */
                      <span
                        className="inline-block text-2xl md:text-4xl font-semibold tracking-tight line-through opacity-25 group-hover:opacity-45 transition-all duration-300"
                        style={{ color: "var(--text-primary)" }}
                      >
                        "{item.label}"
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
