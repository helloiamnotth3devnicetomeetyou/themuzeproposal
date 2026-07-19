import NoticeBoard from "@/components/NoticeBoard";

export default async function ArtistNotice({ params }: { params: Promise<{ artistid: string }> }) {
  const { artistid } = await params;
  return (
    <main className="pt-32 pb-24 min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="pb-8 mb-12" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <span className="text-brand-pink text-xs font-bold tracking-widest uppercase">ARTIST NEWS</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-2 font-display" style={{ color: "var(--text-primary)" }}>{artistid.toUpperCase()} NOTICE</h1>
        </div>
        <NoticeBoard artistSlug={artistid} />
      </div>
    </main>
  );
}
