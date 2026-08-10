"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/core/supabase/client";
import { type GuideProgressRow, type GuideRole, type GuideStep } from "./guide-content";

type GuideCapabilities = { artistScenes: boolean; artistGallery: boolean };

const missingTable = (message?: string) => Boolean(message && /does not exist|schema cache|could not find/i.test(message));

export function useAdminOnboardingProgress({ userId, role }: { userId?: string; role?: GuideRole }) {
  const [ready, setReady] = useState(false);
  const [progressRows, setProgressRows] = useState<Record<string, GuideProgressRow>>({});
  const [capabilities, setCapabilities] = useState<GuideCapabilities>({ artistScenes: true, artistGallery: true });
  const progressRef = useRef<Record<string, GuideProgressRow>>({});

  useEffect(() => {
    if (!userId || !role) return;
    let active = true;
    void Promise.all([
      supabase.from("admin_onboarding_progress").select("chapter_id,furthest_step_id,completed_at"),
      supabase.from("artist_scenes").select("id", { head: true, count: "exact" }).limit(1),
      supabase.from("artist_gallery").select("id", { head: true, count: "exact" }).limit(1),
    ]).then(([progressResult, scenesResult, galleryResult]) => {
      if (!active) return;
      const rows = (progressResult.data ?? []) as GuideProgressRow[];
      const nextRows = Object.fromEntries(rows.map((row) => [row.chapter_id, row]));
      progressRef.current = nextRows;
      setProgressRows(nextRows);
      setCapabilities({ artistScenes: !missingTable(scenesResult.error?.message), artistGallery: !missingTable(galleryResult.error?.message) });
      setReady(true);
    });
    return () => { active = false; };
  }, [role, userId]);

  const saveStepProgress = async (chapterId: string, stepId: string, available: GuideStep[]) => {
    if (!userId) return;
    const current = progressRef.current[chapterId];
    const currentIndex = available.findIndex((item) => item.id === current?.furthest_step_id);
    const nextIndex = available.findIndex((item) => item.id === stepId);
    if (current?.completed_at || nextIndex <= currentIndex) return;
    const next: GuideProgressRow = { chapter_id: chapterId, furthest_step_id: stepId, completed_at: current?.completed_at ?? null };
    progressRef.current = { ...progressRef.current, [chapterId]: next };
    setProgressRows(progressRef.current);
    const { error } = await supabase.from("admin_onboarding_progress").upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id,chapter_id" });
    if (error) window.dispatchEvent(new CustomEvent("admin-toast", { detail: "가이드 진행도를 저장하지 못했습니다." }));
  };

  const completeChapter = async (chapterId: string, furthestStepId: string | null) => {
    if (!userId) return;
    const completedAt = new Date().toISOString();
    const { error } = await supabase.from("admin_onboarding_progress").upsert({ user_id: userId, chapter_id: chapterId, furthest_step_id: furthestStepId, completed_at: completedAt, updated_at: completedAt }, { onConflict: "user_id,chapter_id" });
    if (error) {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: "가이드 진행도를 저장하지 못했습니다." }));
      return;
    }
    const next = { chapter_id: chapterId, furthest_step_id: furthestStepId, completed_at: completedAt };
    progressRef.current = { ...progressRef.current, [chapterId]: next };
    setProgressRows(progressRef.current);
  };

  return { ready, progressRows, capabilities, saveStepProgress, completeChapter };
}
