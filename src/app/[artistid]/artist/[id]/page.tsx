"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "../../../context/LocaleContext";
import { MEMBERS } from "../page";

export default function ArtistDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { locale } = useLocale();

  // Find current member
  const currentIndex = MEMBERS.findIndex((m) => m.id === id);
  const member = MEMBERS[currentIndex];

  if (!member) {
    return (
      <main className="pt-40 pb-24 min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <p className="text-xl mb-4 font-light" style={{ color: "var(--text-secondary)" }}>
          {locale === "ko" ? "멤버를 찾을 수 없습니다." : locale === "ja" ? "メンバーが見つかりません。" : "Member not found."}
        </p>
        <Link href="/rescene/artist" className="text-brand-pink font-bold hover:underline">
          {locale === "ko" ? "아티스트 목록으로 돌아가기" : locale === "ja" ? "アーティスト一覧に戻る" : "Back to Artists"}
        </Link>
      </main>
    );
  }

  // Prev / Next index wrapping
  const prevIndex = (currentIndex - 1 + MEMBERS.length) % MEMBERS.length;
  const nextIndex = (currentIndex + 1) % MEMBERS.length;
  const prevMember = MEMBERS[prevIndex];
  const nextMember = MEMBERS[nextIndex];

  return (
    <main 
      className="pt-36 pb-24 min-h-screen relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Background Radial Glow based on artist theme color */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.06] pointer-events-none transition-all duration-700"
        style={{ backgroundColor: member.color }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-12">
          <Link 
            href="/rescene/artist"
            className="flex items-center gap-2 group text-sm font-semibold transition-colors duration-300"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="text-lg transition-transform duration-300 group-hover:-translate-x-1">←</span>
            <span className="group-hover:text-brand-pink">
              {locale === "ko" ? "아티스트 목록" : locale === "ja" ? "アーティスト" : "All Artists"}
            </span>
          </Link>

          {/* Quick Switch Nav */}
          <div className="flex gap-4">
            <Link 
              href={`/rescene/artist/${prevMember.id}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:border-brand-pink/50 hover:text-brand-pink"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
            >
              PREV
            </Link>
            <Link 
              href={`/rescene/artist/${nextMember.id}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:border-brand-pink/50 hover:text-brand-pink"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
            >
              NEXT
            </Link>
          </div>
        </div>

        {/* Profile Card Container */}
        <div 
          className="rounded-3xl p-8 md:p-16 border flex flex-col md:flex-row gap-12 items-center md:items-start transition-all duration-500"
          style={{ 
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            boxShadow: `0 20px 40px -15px ${member.color}15`
          }}
        >
          {/* Portrait Image Frame */}
          <div 
            className="relative w-64 h-80 md:w-80 md:h-[420px] shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
            style={{ 
              border: `2px solid ${member.color}40`,
              boxShadow: `0 0 30px ${member.color}10`
            }}
          >
            <Image
              src={member.image}
              alt={member.name}
              fill
              priority
              className="object-cover object-top"
              sizes="(max-w-7xl) 100vw"
            />
          </div>

          {/* Bio & Profile Detail */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="pb-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: member.color }}>
                RESCENE MEMBER
              </span>
              <div className="flex items-baseline gap-4 mt-2">
                <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {member.engName}
                </h1>
                <span className="text-xl font-bold" style={{ color: member.color }}>
                  {member.name}
                </span>
              </div>
            </div>

            {/* Profile Grid metadata */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 max-w-md my-2">
              <div>
                <span className="block text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
                  POSITION
                </span>
                <span className="text-base font-semibold mt-1 block" style={{ color: "var(--text-primary)" }}>
                  {member.role[locale]}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
                  BIRTHDAY
                </span>
                <span className="text-base font-semibold mt-1 block" style={{ color: "var(--text-primary)" }}>
                  {member.birth}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
                  MBTI
                </span>
                <span className="text-base font-semibold mt-1 block" style={{ color: "var(--text-primary)" }}>
                  {member.mbti}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
                  THEME COLOR
                </span>
                <span className="text-base font-semibold mt-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <span 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: member.color, borderColor: "var(--border-subtle)" }}
                  />
                  <span style={{ color: member.color }}>{member.color}</span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <span className="block text-xs font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>
                BIOGRAPHY
              </span>
              <p className="text-base leading-relaxed font-light" style={{ color: "var(--text-secondary)" }}>
                {member.bio[locale]}
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
