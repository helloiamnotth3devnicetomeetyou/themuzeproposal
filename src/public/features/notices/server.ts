import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { getPublicNotice, getPublicNotices } from "./repository";
import type { NoticeDetailDTO, NoticeListDTO } from "./types";

export type ServerDataResult<T> = {
  data: T | null;
  loadFailed: boolean;
};

const { url, anonKey } = getPublicSupabaseConfig();
const getCachedPublicNotices = unstable_cache(
  (artistSlug?: string) => getPublicNotices(createClient(url, anonKey), artistSlug),
  ["public-notices"],
  { revalidate: 300, tags: ["public-notices"] },
);
const getCachedPublicNotice = unstable_cache(
  (noticeId: string, artistSlug?: string) => getPublicNotice(createClient(url, anonKey), noticeId, artistSlug),
  ["public-notice"],
  { revalidate: 300, tags: ["public-notices"] },
);

export async function loadPublicNotices(artistSlug?: string): Promise<ServerDataResult<NoticeListDTO>> {
  try {
    return { data: await getCachedPublicNotices(artistSlug), loadFailed: false };
  } catch {
    return { data: null, loadFailed: true };
  }
}

export async function loadPublicNotice(noticeId: string, artistSlug?: string): Promise<ServerDataResult<NoticeDetailDTO>> {
  try {
    return { data: await getCachedPublicNotice(noticeId, artistSlug), loadFailed: false };
  } catch {
    return { data: null, loadFailed: true };
  }
}
