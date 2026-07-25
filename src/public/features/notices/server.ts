import "server-only";

import { createSupabaseServerClient } from "@/core/supabase/server";
import { getPublicNotice, getPublicNotices } from "./repository";
import type { NoticeDetailDTO, NoticeListDTO } from "./types";

export type ServerDataResult<T> = {
  data: T | null;
  loadFailed: boolean;
};

export async function loadPublicNotices(artistSlug?: string): Promise<ServerDataResult<NoticeListDTO>> {
  try {
    const client = await createSupabaseServerClient();
    return { data: await getPublicNotices(client, artistSlug), loadFailed: false };
  } catch {
    return { data: null, loadFailed: true };
  }
}

export async function loadPublicNotice(noticeId: string, artistSlug?: string): Promise<ServerDataResult<NoticeDetailDTO>> {
  try {
    const client = await createSupabaseServerClient();
    return { data: await getPublicNotice(client, noticeId, artistSlug), loadFailed: false };
  } catch {
    return { data: null, loadFailed: true };
  }
}