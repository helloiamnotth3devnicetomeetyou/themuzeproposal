import type { SupabaseClient } from "@supabase/supabase-js";
import type { NoticeDTO, NoticeDetailDTO, NoticeListDTO } from "./types";

const NOTICE_COLUMNS = "id,title_ko,title_en,title_ja,content_ko,content_en,content_ja,category_ko,category_en,category_ja,date";

type NoticeRow = {
  id: string;
  date: string | null;
  title_ko: string | null;
  title_en: string | null;
  title_ja: string | null;
  content_ko: string | null;
  content_en: string | null;
  content_ja: string | null;
  category_ko: string | null;
  category_en: string | null;
  category_ja: string | null;
};

type NoticeScope = {
  artistId: string | null;
  name: string;
};

async function resolveNoticeScope(client: SupabaseClient, artistSlug?: string): Promise<NoticeScope> {
  if (!artistSlug) return { artistId: null, name: "" };

  const { data, error } = await client
    .from("artists")
    .select("id,name,eng_name")
    .eq("slug", artistSlug)
    .single();

  if (error || !data) throw error ?? new Error("Artist not found");
  return { artistId: data.id, name: data.eng_name || data.name || artistSlug };
}

function toNoticeDTO(row: NoticeRow): NoticeDTO {
  return {
    id: row.id,
    date: row.date ?? "",
    title: { ko: row.title_ko ?? "", en: row.title_en ?? "", ja: row.title_ja ?? "" },
    content: { ko: row.content_ko ?? "", en: row.content_en ?? "", ja: row.content_ja ?? "" },
    category: { ko: row.category_ko ?? "", en: row.category_en ?? "", ja: row.category_ja ?? "" },
  };
}

export async function getPublicNotices(client: SupabaseClient, artistSlug?: string): Promise<NoticeListDTO> {
  const scope = await resolveNoticeScope(client, artistSlug);
  let query = client
    .from("notices")
    .select(NOTICE_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  query = scope.artistId ? query.eq("artist_id", scope.artistId) : query.is("artist_id", null);

  const { data, error } = await query;
  if (error) throw error;
  return { name: scope.name, notices: ((data ?? []) as NoticeRow[]).map(toNoticeDTO) };
}

export async function getPublicNotice(client: SupabaseClient, noticeId: string, artistSlug?: string): Promise<NoticeDetailDTO> {
  const scope = await resolveNoticeScope(client, artistSlug);
  let query = client
    .from("notices")
    .select(NOTICE_COLUMNS)
    .eq("id", noticeId)
    .eq("is_published", true);
  query = scope.artistId ? query.eq("artist_id", scope.artistId) : query.is("artist_id", null);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return { name: scope.name, notice: data ? toNoticeDTO(data as NoticeRow) : null };
}