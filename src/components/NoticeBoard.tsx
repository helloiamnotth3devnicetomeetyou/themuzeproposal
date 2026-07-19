"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/app/context/LocaleContext";
import { supabase } from "@/lib/supabase";

type Notice = {
  id: string;
  date: string;
  title: { ko: string; en: string; ja: string };
  content: { ko: string; en: string; ja: string };
  category: { ko: string; en: string; ja: string };
};

export default function NoticeBoard({ artistSlug }: { artistSlug?: string }) {
  const { locale } = useLocale();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotices() {
      let artistId: string | null = null;
      if (artistSlug) {
        const { data: artist } = await supabase.from("artists").select("id").eq("slug", artistSlug).single();
        if (!artist) return;
        artistId = artist.id;
      }

      let query = supabase
        .from("notices")
        .select("id,title_ko,title_en,title_ja,content_ko,content_en,content_ja,category_ko,category_en,category_ja,date")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      query = artistId ? query.eq("artist_id", artistId) : query.is("artist_id", null);

      const { data } = await query;
      setNotices((data ?? []).map((notice) => ({
        id: notice.id,
        date: notice.date ?? "",
        title: { ko: notice.title_ko ?? "", en: notice.title_en ?? "", ja: notice.title_ja ?? "" },
        content: { ko: notice.content_ko ?? "", en: notice.content_en ?? "", ja: notice.content_ja ?? "" },
        category: { ko: notice.category_ko ?? "", en: notice.category_en ?? "", ja: notice.category_ja ?? "" },
      })));
    }
    void loadNotices();
  }, [artistSlug]);

  return (
    <div className="flex flex-col" style={{ borderTop: "1px solid var(--border-default)" }}>
      {notices.map((notice) => {
        const isExpanded = expandedId === notice.id;
        return (
          <div key={notice.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <button onClick={() => setExpandedId(isExpanded ? null : notice.id)} className="w-full px-4 py-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-left hover:bg-[var(--bg-subtle)]" style={{ color: "var(--text-primary)" }}>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-pink/15 text-brand-pink uppercase">{notice.category[locale]}</span>
                <h3 className="text-sm md:text-base font-semibold">{notice.title[locale]}</h3>
              </div>
              <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>{notice.date}</span>
            </button>
            {isExpanded && <div className="px-8 py-6 text-sm leading-relaxed" style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)" }}>{notice.content[locale]}</div>}
          </div>
        );
      })}
      {!notices.length && <p className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>등록된 공지가 없습니다.</p>}
    </div>
  );
}
