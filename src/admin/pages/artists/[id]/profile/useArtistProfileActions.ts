"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import {
  deleteAdminAssetUrls,
  deleteAdminAssets,
} from "@/admin/utils/delete-admin-assets";
import {
  discardDraftImageAssets,
  finalizeDraftImageAssets,
} from "@/admin/utils/draft-assets";
import { adminDbError } from "@/admin/utils/admin-db-error";
import { supabase } from "@/core/supabase/client";
import { notifyArtistsChanged } from "@/core/utils/artist-events";
import type { ProfileDraft } from "./profile-editor-model";
import { toArtistProfilePayload } from "./profile-payload";

type ProfileActionProps = {
  artistId: string | null;
  draft: ProfileDraft | null;
  snapshot: string;
  isNew: boolean;
  routeId: string | undefined;
  saveIssues: string[];
  uploadedAssetsRef: MutableRefObject<UploadedImageAsset[]>;
  setArtistId: Dispatch<SetStateAction<string | null>>;
  setDraft: Dispatch<SetStateAction<ProfileDraft | null>>;
  setSnapshot: Dispatch<SetStateAction<string>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setDeleting: Dispatch<SetStateAction<boolean>>;
  setDeleteOpen: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
  setToast: Dispatch<SetStateAction<string>>;
  discardDraftBackup: () => void;
};

export function useArtistProfileActions({
  artistId,
  draft,
  snapshot,
  isNew,
  routeId,
  saveIssues,
  uploadedAssetsRef,
  setArtistId,
  setDraft,
  setSnapshot,
  setSaving,
  setDeleting,
  setDeleteOpen,
  setError,
  setToast,
  discardDraftBackup,
}: ProfileActionProps) {
  const router = useRouter();

  const cancelNewArtist = async () => {
    const queued = uploadedAssetsRef.current;
    uploadedAssetsRef.current = [];
    await discardDraftImageAssets(supabase, queued);
    router.push("/admin");
  };

  const handleSave = async () => {
    if (!draft) return;
    if (saveIssues.length || !artistId) {
      setError(`필수 정보를 확인하세요: ${saveIssues.join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    const originalDraft = snapshot
      ? (JSON.parse(snapshot) as ProfileDraft)
      : null;
    const payload = toArtistProfilePayload(draft);
    const result = isNew
      ? await supabase
          .from("artists")
          .insert({ id: artistId, ...payload })
          .select("id,updated_at")
          .single()
      : await supabase
          .from("artists")
          .update(payload)
          .eq("id", artistId)
          .eq("updated_at", draft.updatedAt ?? "")
          .select("id,updated_at")
          .single();
    if (result.error) {
      setError(
        result.error.code === "23505"
          ? "같은 영문명으로 생성된 공개 경로가 이미 사용 중입니다."
          : result.error.message.includes(
                "column of 'artists' in the schema cache",
              )
            ? "아티스트 프로필 DB 컬럼이 누락되었습니다. 최신 007_artist_profile_schema.sql을 적용한 뒤 다시 저장하세요."
            : result.error.message.includes("social_links")
              ? "공식 계정 컬럼이 없습니다. 005_artist_social_links.sql을 먼저 적용하세요."
              : result.error.message.includes("logo_url")
                ? "아티스트 로고 컬럼이 없습니다. 004_artist_assets.sql을 먼저 적용하세요."
                : adminDbError(
                    result.error,
                    "아티스트 정보를 저장하지 못했습니다.",
                  ),
      );
      setSaving(false);
      return;
    }
    setArtistId(result.data.id);
    const savedDraft = { ...draft, updatedAt: result.data.updated_at };
    setDraft(savedDraft);
    setSnapshot(JSON.stringify(savedDraft));
    discardDraftBackup();
    await finalizeDraftImageAssets(
      supabase,
      uploadedAssetsRef.current,
      [draft.imageUrl, draft.logoUrl],
      originalDraft ? [originalDraft.imageUrl, originalDraft.logoUrl] : [],
    );
    uploadedAssetsRef.current = [];
    setSaving(false);
    await notifyArtistsChanged();
    setToast(isNew ? "아티스트를 만들었습니다." : "변경사항을 저장했습니다.");
    if (routeId !== result.data.id)
      router.replace(`/admin/artists/${result.data.id}/profile`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!artistId || isNew) return;
    setDeleting(true);
    setError("");
    const [
      galleryResult,
      memberResult,
      sceneResult,
      avatarResult,
      albumResult,
    ] = await Promise.all([
      supabase
        .from("artist_gallery")
        .select("image_url")
        .eq("artist_id", artistId),
      supabase
        .from("artist_members")
        .select("id,image_url")
        .eq("artist_id", artistId),
      supabase
        .from("artist_scenes")
        .select("id,image_url")
        .eq("artist_id", artistId),
      supabase
        .from("avatar_assets")
        .select("image_path")
        .eq("artist_id", artistId),
      supabase
        .from("albums")
        .select("id,cover_url,hero_image_url,typo_logo_url")
        .eq("artist_id", artistId),
    ]);
    const sceneIds = (sceneResult.data ?? [])
      .map((scene) => scene.id)
      .filter(Boolean);
    const memberIds = (memberResult.data ?? [])
      .map((member) => member.id)
      .filter(Boolean);
    const albumIds = (albumResult.data ?? [])
      .map((album) => album.id)
      .filter(Boolean);
    const [sceneRegionResult, memberRegionResult, trackResult] =
      await Promise.all([
        sceneIds.length
          ? supabase
              .from("artist_scene_members")
              .select("mask_url")
              .in("scene_id", sceneIds)
          : Promise.resolve({ data: [] }),
        memberIds.length
          ? supabase
              .from("artist_scene_members")
              .select("mask_url")
              .in("member_id", memberIds)
          : Promise.resolve({ data: [] }),
        albumIds.length
          ? supabase
              .from("tracks")
              .select("audio_url,music_video_url,logo_url")
              .in("album_id", albumIds)
          : Promise.resolve({ data: [] }),
      ]);
    const assetUrls = [
      draft?.imageUrl,
      draft?.logoUrl,
      ...(galleryResult.data ?? []).map((item) => item.image_url),
      ...(memberResult.data ?? []).map((member) => member.image_url),
      ...(sceneResult.data ?? []).map((scene) => scene.image_url),
      ...(sceneRegionResult.data ?? []).map((region) => region.mask_url),
      ...(memberRegionResult.data ?? []).map((region) => region.mask_url),
      ...(albumResult.data ?? []).flatMap((album) => [
        album.cover_url,
        album.hero_image_url,
        album.typo_logo_url,
      ]),
      ...(trackResult.data ?? []).flatMap((track) => [
        track.audio_url,
        track.music_video_url,
        track.logo_url,
      ]),
    ].filter((url): url is string => typeof url === "string" && Boolean(url));
    const avatarPaths = (avatarResult.data ?? [])
      .map((asset) => asset.image_path)
      .filter(
        (path): path is string => typeof path === "string" && Boolean(path),
      );
    const queued = uploadedAssetsRef.current;
    const { error: deleteError } = await supabase
      .from("artists")
      .delete()
      .eq("id", artistId);
    setDeleting(false);
    if (deleteError) {
      setDeleteOpen(false);
      setError(adminDbError(deleteError, "아티스트를 삭제하지 못했습니다."));
      return;
    }
    await deleteAdminAssetUrls(assetUrls);
    if (avatarPaths.length)
      await deleteAdminAssets("artist-assets", avatarPaths);
    await discardDraftImageAssets(supabase, queued);
    uploadedAssetsRef.current = [];
    await notifyArtistsChanged();
    router.replace("/admin");
    router.refresh();
  };

  return { cancelNewArtist, handleSave, handleDelete };
}
