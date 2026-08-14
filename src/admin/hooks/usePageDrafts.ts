"use client";

import { useSyncExternalStore } from "react";
import type { DraftDiffItem } from "@/admin/utils/draft-diff";
import { supabase } from "@/core/supabase/client";

type ArtistContentSave = {
  artistId: string;
  expectedUpdatedAt: string | null;
  gallery?: { items: unknown[]; removedIds: string[] };
  scenes?: {
    items: unknown[];
    removedSceneIds: string[];
    removedRegionIds: string[];
  };
  committed: (updatedAt: string) => Promise<void> | void;
};
type Entry = {
  diff: DraftDiffItem[];
  commit: () => Promise<void>;
  artistContent?: ArtistContentSave;
};
const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;

const emit = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

export function registerPageDraft(key: string, entry: Entry | null) {
  if (entry) entries.set(key, entry);
  else entries.delete(key);
  emit();
  return () => {
    if (entries.delete(key)) emit();
  };
}

export function usePageDrafts() {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => version,
    () => 0,
  );
  const current = [...entries.values()];
  return {
    dirty: current.length > 0,
    diff: current.flatMap((entry) => entry.diff),
    commit: async () => {
      const grouped = new Map<string, Entry[]>();
      current.forEach((entry) => {
        const artistId = entry.artistContent?.artistId;
        if (artistId)
          grouped.set(artistId, [...(grouped.get(artistId) ?? []), entry]);
      });
      const committed = new Set<Entry>();
      for (const entries of grouped.values()) {
        const gallery = entries.find((entry) => entry.artistContent?.gallery);
        const scenes = entries.find((entry) => entry.artistContent?.scenes);
        if (!gallery || !scenes) continue;
        const gallerySave = gallery.artistContent!;
        const sceneSave = scenes.artistContent!;
        const { data, error } = await supabase.rpc(
          "save_artist_content_checked",
          {
            p_artist_id: gallerySave.artistId,
            p_gallery_items: gallerySave.gallery!.items,
            p_gallery_removed_ids: gallerySave.gallery!.removedIds,
            p_scenes: sceneSave.scenes!.items,
            p_removed_scene_ids: sceneSave.scenes!.removedSceneIds,
            p_removed_region_ids: sceneSave.scenes!.removedRegionIds,
            p_expected_updated_at: gallerySave.expectedUpdatedAt,
          },
        );
        if (error) throw error;
        await gallerySave.committed(String(data));
        await sceneSave.committed(String(data));
        committed.add(gallery);
        committed.add(scenes);
      }
      for (const entry of current)
        if (!committed.has(entry)) await entry.commit();
    },
  };
}
