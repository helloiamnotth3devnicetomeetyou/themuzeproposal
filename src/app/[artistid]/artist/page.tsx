"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "../../context/LocaleContext";

interface Member {
  id: string;
  name: string;
  engName: string;
  role: { ko: string; en: string; ja: string };
  birth: string;
  mbti: string;
  image: string;
  color: string;
  bio: { ko: string; en: string; ja: string };
}

export const MEMBERS: Member[] = [
  {
    id: "woni",
    name: "원이",
    engName: "WONI",
    role: { ko: "리더, 보컬", en: "Leader, Vocalist", ja: "リーダー, ボーカル" },
    birth: "2004. 05. 25",
    mbti: "ESFP",
    image: "/images/woni.png",
    color: "#FE73CF",
    bio: {
      ko: "리센느의 신뢰감을 주는 리더이자 밝고 긍정적인 에너지를 발산하는 멤버입니다.",
      en: "The reliable leader of RESCENE, radiating bright and positive energy to the team.",
      ja: "RESCENEの信頼できるリーダーであり、明るくポジティブなエネルギーを発散するメンバー입니다."
    }
  },
  {
    id: "liv",
    name: "리브",
    engName: "LIV",
    role: { ko: "메인 댄서, 래퍼", en: "Main Dancer, Rapper", ja: "メインダンサー, ラッパー" },
    birth: "2006. 10. 11",
    mbti: "INFP",
    image: "/images/liv.png",
    color: "#01ACCE",
    bio: {
      ko: "파워풀하면서도 섬세한 춤선과 매력적인 로우톤 래핑이 특징인 메인 댄서입니다.",
      en: "Main dancer known for her powerful yet delicate dance lines and charming low-tone rapping.",
      ja: "パワフルでありながら繊細なダンスラインと魅力的なロートーンのラップが特徴のメインダンサー입니다."
    }
  },
  {
    id: "minami",
    name: "미나미",
    engName: "MINAMI",
    role: { ko: "메인 보컬", en: "Main Vocalist", ja: "メインボーカル" },
    birth: "2006. 11. 29",
    mbti: "ENFP",
    image: "/images/minami.png",
    color: "#E285B0",
    bio: {
      ko: "방과후 설렘 파이널리스트 출신으로, 청량하고 탄탄한 가창력으로 곡의 중심을 잡는 보컬리스트입니다.",
      en: "A finalist from My Teenage Girl, holding the team's core with her crystal-clear, solid vocals.",
      ja: "「放課後のときめき」ファイナリスト出身で、清涼感のあるしっかりとした歌唱力でグループの核となるボーカリスト입니다."
    }
  },
  {
    id: "may",
    name: "메이",
    engName: "MAY",
    role: { ko: "서브 보컬", en: "Sub Vocalist", ja: "サブボーカル" },
    birth: "2008. 08. 19",
    mbti: "ESTP",
    image: "/images/may.png",
    color: "#3D9C2E",
    bio: {
      ko: "맑은 보이스 컬러와 귀여운 비주얼로 리센느의 막내 같은 매력을 담당합니다.",
      en: "Possesses a clear voice and cute visuals, representing the lovely charm of the group.",
      ja: "澄んだ声の持ち主で、可愛らしいビジュアルでRESCENEの愛らしさを担当しています."
    }
  },
  {
    id: "zena",
    name: "제나",
    engName: "ZENA",
    role: { ko: "리드 보컬, 비주얼", en: "Lead Vocalist, Visual", ja: "リードボーカル, ビジュアル" },
    birth: "2008. 11. 27",
    mbti: "ISTP",
    image: "/images/zena.png",
    color: "#FC6FCF",
    bio: {
      ko: "청춘스타 출신으로, 매혹적인 고양이상 비주얼과 세련된 음색을 지닌 올라운더입니다.",
      en: "An all-rounder with a captivating cat-like visual and sophisticated tone.",
      ja: "「青春スター」出身で、魅惑的なキャットアイビジュアルと洗練された音色を持つオールラウンダー입니다."
    }
  }
];

export default function Artists() {
  const { locale } = useLocale();

  const groupDesc = {
    ko: "RESCENE (리센느)는 2024년 3월 26일 데뷔한 더뮤즈엔터테인먼트의 대표 5인조 걸그룹입니다. 그룹명 리센느(RESCENE)는 'Scene(장면)을 다시(RE) 떠올린다'는 뜻과 '향기(Scent)로 기억을 소환한다'는 중의적 의미를 담고 있습니다. 음악을 통해 전 세계 대중들에게 잊지 못할 강렬하고 향기로운 예술적 장치를 선물합니다.",
    en: "RESCENE is a 5-member girl group under THE MUZE Entertainment, debuting on March 26, 2024. The group name combines 'RE' (again) + 'SCENE' (visual memories) and 'SCENT' (fragrance), conveying their mission to evoke beautiful, nostalgic memories in listeners' hearts through sensory and artistic music.",
    ja: "RESCENE (リセン느)は、2024년 3월 26일デビューしたTHE MUZE Entertainment所属の5人組ガールズグループです。グループ名「RESCENE」には、「シーン(場面)を再び(RE)思い起こす」という意味と「香り(Scent)で記憶を呼び覚ます」という二重の意味が込められています。音楽を通じて全世界の人々に忘れられない強烈で香りのある芸術体験を届けます."
  }[locale];

  return (
    <main className="pt-32 pb-24 min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="pb-8 mb-16" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <span className="text-brand-pink text-xs font-bold tracking-widest uppercase">ARTIST ROSTER</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-2 font-display" style={{ color: "var(--text-primary)" }}>ARTISTS</h1>
        </div>

        {/* Group Info Banner */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 md:p-16 mb-24 flex flex-col lg:flex-row gap-12 items-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(252,111,207,0.08),transparent_50%)]" />
          <div
            className="relative w-full lg:w-1/2 aspect-[16/10] overflow-hidden rounded-2xl shadow-2xl"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <Image
              src="/images/hero_1.png"
              alt="RESCENE Group Photo"
              fill
              className="object-cover object-center"
            />
          </div>
          <div className="relative w-full lg:w-1/2 flex flex-col gap-6">
            <span className="text-brand-pink text-xs font-bold tracking-[0.3em] uppercase">THE MUZE REPRESENTATIVE GROUP</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight font-display" style={{ color: "var(--text-primary)" }}>RESCENE</h2>
            <p className="leading-relaxed font-light text-sm md:text-base" style={{ color: "var(--text-muted)" }}>
              {groupDesc}
            </p>
          </div>
        </div>

        {/* Member Grid */}
        <div className="mb-24">
          <h3 className="text-2xl md:text-3xl font-black mb-12 font-display text-center" style={{ color: "var(--text-primary)" }}>MEMBERS</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {MEMBERS.map((member) => (
              <Link
                key={member.id}
                href={`/rescene/artist/${member.id}`}
                className="group flex flex-col text-left focus:outline-none"
              >
                <div
                  className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300 group-hover:border-brand-pink/50"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Name overlay */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col">
                    <span className="text-white text-base md:text-lg font-black tracking-tight font-display">
                      {member.engName}
                    </span>
                    <span className="text-brand-pink text-xs font-semibold mt-1">
                      {member.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
