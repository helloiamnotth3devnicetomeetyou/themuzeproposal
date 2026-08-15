"use client";

import { useCallback, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from "react";
import { supabase } from "@/core/supabase/client";
import { toWebP } from "@/admin/utils/image-convert";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import { revalidateArtistSceneData } from "@/core/utils/artist-events";
import {
  type ArtistScene,
  type ScenePoint,
} from "@/core/utils/artist-scenes";
import { normalizeSceneLink } from "@/core/utils/artist-scenes";
import {
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { adminDbError } from "@/admin/utils/admin-db-error";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import {
  ACCEPTED_MASK_TYPES,
  ACCEPTED_SCENE_TYPES,
  MAX_IMAGE_BYTES,
  imageDimensions,
  type MemberLookup,
} from "./artist-scene-editor-model";

type SceneRegion = ArtistScene["artist_scene_members"][number];

type UseArtistSceneActionsProps = {
  artistId: string | null;
  heroUrl: string;
  onError: (message: string) => void;
  onToast: (message: string) => void;
  scenes: ArtistScene[];
  setScenes: Dispatch<SetStateAction<ArtistScene[]>>;
  snapshot: ArtistScene[];
  setSnapshot: Dispatch<SetStateAction<ArtistScene[]>>;
  artistUpdatedAt: string | null;
  setArtistUpdatedAt: Dispatch<SetStateAction<string | null>>;
  selectedSceneId: string | null;
  setSelectedSceneId: Dispatch<SetStateAction<string | null>>;
  selectedScene: ArtistScene | null;
  selectedRegion: SceneRegion | null;
  selectedMemberId: string | null;
  selectedMember: MemberLookup | null;
  draftOutline: ScenePoint[];
  setDraftOutline: Dispatch<SetStateAction<ScenePoint[]>>;
  uploadedAssetsRef: MutableRefObject<UploadedImageAsset[]>;
  sceneInputRef: RefObject<HTMLInputElement | null>;
  maskInputRef: RefObject<HTMLInputElement | null>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setDeleteOpen: Dispatch<SetStateAction<boolean>>;
  load: (preferredSceneId?: string) => Promise<void>;
  discardBackup: () => void;
};

export function useArtistSceneActions({
  artistId,
  heroUrl,
  onError,
  onToast,
  scenes,
  setScenes,
  snapshot,
  setSnapshot,
  artistUpdatedAt,
  setArtistUpdatedAt,
  selectedSceneId,
  setSelectedSceneId,
  selectedScene,
  selectedRegion,
  selectedMemberId,
  selectedMember,
  draftOutline,
  setDraftOutline,
  uploadedAssetsRef,
  sceneInputRef,
  maskInputRef,
  setBusy,
  setDeleteOpen,
  load,
  discardBackup,
}: UseArtistSceneActionsProps) {
  const patchScene = (patch: Partial<ArtistScene>) => {
    if (!selectedSceneId) return;
    setScenes((current) =>
      current.map((scene) =>
        scene.id === selectedSceneId ? { ...scene, ...patch } : scene,
      ),
    );
  };

  const uploadScenes = async (files: FileList) => {
    if (!artistId) return;
    const list = Array.from(files);
    const invalid = list.find(
      (file) =>
        !ACCEPTED_SCENE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid)
      return onError(
        `${invalid.name}: JPG, PNG, WebP만 지원하며 파일은 최대 20MB입니다.`,
      );
    setBusy(true);
    onError("");
    try {
      let preferredId = "";
      for (const [index, file] of list.entries()) {
        const dimensions = await imageDimensions(file);
        const converted = await toWebP(file);
        const path = `${artistId}/scenes/${crypto.randomUUID()}.webp`;
        const uploadedAsset = await uploadAdminAsset(
          "artist-assets",
          path,
          converted,
        );
        const tracked = {
          bucket: "artist-assets" as const,
          path: uploadedAsset.path,
          url: uploadedAsset.url,
        };
        uploadedAssetsRef.current.push(tracked);
        trackDraftImageAsset(tracked);
        const publicUrl = uploadedAsset.url;
        const canonicalTitle = file.name.replace(/\.[^.]+$/, "");
        preferredId = crypto.randomUUID();
        setScenes((current) => [
          ...current,
          {
            id: preferredId,
            artist_id: artistId,
            title: canonicalTitle,
            title_ko: canonicalTitle,
            image_url: publicUrl,
            image_width: dimensions.width,
            image_height: dimensions.height,
            is_hero: scenes.length === 0 && index === 0,
            is_published: true,
            sort_order: scenes.length + index,
            title_en: null,
            title_ja: null,
            link_url: null,
            artist_scene_members: [],
          },
        ]);
      }
      setSelectedSceneId(preferredId);
      onToast(`${list.length}개의 인터랙티브 장면이 임시 작업에 추가되었습니다.`);
    } catch (uploadError) {
      onError(
        uploadError instanceof Error
          ? uploadError.message
          : "장면 이미지를 업로드하지 못했습니다.",
      );
    } finally {
      setBusy(false);
      if (sceneInputRef.current) sceneInputRef.current.value = "";
    }
  };

  const importHero = async () => {
    if (!artistId || !heroUrl) return;
    setBusy(true);
    onError("");
    try {
      // Download the source image and upload it as an independent copy so that
      // later changes to the hero image do not break the scene record.
      const response = await fetch(
        `/api/asset-proxy?url=${encodeURIComponent(heroUrl)}`,
      );
      if (!response.ok) throw new Error("현재 이미지를 내려받지 못했습니다.");
      const blob = await response.blob();
      const sourceFile = new File([blob], "hero", { type: blob.type });
      const [dimensions, converted] = await Promise.all([
        imageDimensions(sourceFile),
        toWebP(sourceFile),
      ]);
      const path = `${artistId}/scenes/${crypto.randomUUID()}.webp`;
      const uploadedAsset = await uploadAdminAsset(
        "artist-assets",
        path,
        converted,
      );
      const tracked = {
        bucket: "artist-assets" as const,
        path: uploadedAsset.path,
        url: uploadedAsset.url,
      };
      uploadedAssetsRef.current.push(tracked);
      trackDraftImageAsset(tracked);
      const sceneId = crypto.randomUUID();
      setScenes((current) => [
        ...current,
        {
          id: sceneId,
          artist_id: artistId,
          title: "Main scene",
          title_ko: "메인 장면",
          title_en: "Main scene",
          image_url: uploadedAsset.url,
          image_width: dimensions.width,
          image_height: dimensions.height,
          is_hero: scenes.length === 0,
          is_published: true,
          sort_order: scenes.length,
          title_ja: null,
          link_url: null,
          artist_scene_members: [],
        },
      ]);
      setSelectedSceneId(sceneId);
      onToast("현재 대표 이미지를 인터랙티브 장면 임시 작업으로 가져왔습니다.");
    } catch (importError) {
      onError(
        importError instanceof Error
          ? importError.message
          : "대표 이미지를 가져오지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  };

  const applyOutline = () => {
    if (!selectedScene || !selectedMemberId || draftOutline.length < 3) return;
    setScenes((current) =>
      current.map((scene) =>
        scene.id !== selectedScene.id
          ? scene
          : {
              ...scene,
              artist_scene_members: selectedRegion
                ? scene.artist_scene_members.map((region) =>
                    region.id === selectedRegion.id
                      ? { ...region, outline: draftOutline }
                      : region,
                  )
                : [
                    ...scene.artist_scene_members,
                    {
                      id: crypto.randomUUID(),
                      member_id: selectedMemberId,
                      outline: draftOutline,
                      mask_url: null,
                      sort_order: selectedMember?.sort_order || 0,
                    },
                  ],
            },
      ),
    );
    onToast(
      `${selectedMember?.name || "멤버"} 외곽선을 임시 작업에 적용했습니다.`,
    );
  };

  const commitScenes = useCallback(async () => {
    const removedScenes = snapshot.filter(
      (scene) => !scenes.some((item) => item.id === scene.id),
    );
    const previousRegions = snapshot.flatMap(
      (scene) => scene.artist_scene_members,
    );
    const currentRegions = scenes.flatMap(
      (scene) => scene.artist_scene_members,
    );
    const removedRegions = previousRegions.filter(
      (region) => !currentRegions.some((item) => item.id === region.id),
    );
    const replacedRegions = previousRegions.filter((region) => {
      const current = currentRegions.find((item) => item.id === region.id);
      return current && current.mask_url !== region.mask_url;
    });
    const removedRegionIds = removedRegions.map((region) => region.id);
    const { data, error } = await supabase.rpc("save_artist_scenes_checked", {
      p_artist_id: artistId,
      p_scenes: scenes.map((scene) => ({
        id: scene.id,
        artist_id: scene.artist_id,
        title: scene.title.trim(),
        title_ko: scene.title_ko?.trim() || scene.title.trim(),
        title_en: scene.title_en?.trim() || null,
        title_ja: scene.title_ja?.trim() || null,
        link_url: scene.link_url?.trim() || null,
        image_url: scene.image_url,
        image_width: scene.image_width,
        image_height: scene.image_height,
        is_hero: scene.is_hero,
        is_published: scene.is_published,
        sort_order: scene.sort_order,
        artist_scene_members: scene.artist_scene_members.map((region) => ({
          id: region.id,
          scene_id: scene.id,
          member_id: region.member_id,
          outline: region.outline,
          mask_url: region.mask_url,
          sort_order: region.sort_order,
        })),
      })),
      p_removed_scene_ids: removedScenes.map((scene) => scene.id),
      p_removed_region_ids: removedRegionIds,
      p_expected_updated_at: artistUpdatedAt,
    });
    if (error) {
      if (error.code === "P0003") await load();
      onError(adminDbError(error));
      throw error;
    }
    setArtistUpdatedAt(data);
    await finalizeDraftImageAssets(
      supabase,
      uploadedAssetsRef.current,
      scenes.flatMap((scene) => [
        scene.image_url,
        ...scene.artist_scene_members.map((region) => region.mask_url || ""),
      ]),
      [
        ...removedScenes.flatMap((scene) => [
          scene.image_url,
          ...scene.artist_scene_members.map((region) => region.mask_url || ""),
        ]),
        ...removedRegions.map((region) => region.mask_url || ""),
        ...replacedRegions.map((region) => region.mask_url || ""),
      ],
    );
    uploadedAssetsRef.current = [];
    setSnapshot(scenes);
    discardBackup();
    await revalidateArtistSceneData();
    onToast("장면과 멤버 영역 변경사항을 저장했습니다.");
  }, [
    artistId,
    artistUpdatedAt,
    discardBackup,
    load,
    onError,
    onToast,
    scenes,
    setArtistUpdatedAt,
    setSnapshot,
    snapshot,
    uploadedAssetsRef,
  ]);

  const deleteScene = () => {
    if (!selectedScene) return;
    setScenes((current) =>
      current.filter((scene) => scene.id !== selectedScene.id),
    );
    setDeleteOpen(false);
    onToast("장면을 임시 작업에서 삭제했습니다. 저장하면 반영됩니다.");
  };

  const removeOutline = () => {
    if (!selectedRegion || !selectedScene) {
      setDraftOutline([]);
      return;
    }
    setScenes((current) =>
      current.map((scene) =>
        scene.id === selectedScene.id
          ? {
              ...scene,
              artist_scene_members: scene.artist_scene_members.filter(
                (region) => region.id !== selectedRegion.id,
              ),
            }
          : scene,
      ),
    );
    setDraftOutline([]);
    onToast("멤버 외곽선을 임시 작업에서 제거했습니다.");
  };

  const uploadMask = async (file: File) => {
    if (
      !artistId ||
      !selectedScene ||
      !selectedMemberId ||
      draftOutline.length < 3
    )
      return onError("멤버 외곽선을 먼저 저장한 뒤 정밀 마스크를 올려주세요.");
    if (!ACCEPTED_MASK_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES)
      return onError("정밀 마스크는 투명 배경 PNG 또는 WebP, 최대 20MB입니다.");
    setBusy(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${artistId}/scene-masks/${selectedScene.id}/${selectedMemberId}-${crypto.randomUUID()}.${extension}`;
    let uploadedAsset;
    try {
      uploadedAsset = await uploadAdminAsset("artist-assets", path, file);
    } catch (uploadError) {
      setBusy(false);
      return onError(
        uploadError instanceof Error ? uploadError.message : "UPLOAD_FAILED",
      );
    }
    const url = `${uploadedAsset.url}?v=${Date.now()}`;
    const tracked = {
      bucket: "artist-assets" as const,
      path: uploadedAsset.path,
      url,
    };
    uploadedAssetsRef.current.push(tracked);
    trackDraftImageAsset(tracked);
    setBusy(false);
    setScenes((current) =>
      current.map((scene) =>
        scene.id !== selectedScene.id
          ? scene
          : {
              ...scene,
              artist_scene_members: selectedRegion
                ? scene.artist_scene_members.map((region) =>
                    region.id === selectedRegion.id
                      ? { ...region, outline: draftOutline, mask_url: url }
                      : region,
                  )
                : [
                    ...scene.artist_scene_members,
                    {
                      id: crypto.randomUUID(),
                      member_id: selectedMemberId,
                      outline: draftOutline,
                      mask_url: url,
                      sort_order: selectedMember?.sort_order || 0,
                    },
                  ],
            },
      ),
    );
    onToast("정밀 마스크를 임시 작업에 적용했습니다.");
    if (maskInputRef.current) maskInputRef.current.value = "";
  };

  const applySceneSettings = () => {
    const link = selectedScene?.link_url?.trim();
    if (link && !normalizeSceneLink(link))
      onError(
        "장면 링크는 https:// 주소 또는 /로 시작하는 내부 경로를 입력해 주세요.",
      );
    else onToast("장면 설정을 임시 작업에 적용했습니다.");
  };

  const toggleHero = (sceneId: string, checked: boolean) => {
    setScenes((current) =>
      current.map((scene) => ({
        ...scene,
        is_hero:
          scene.id === sceneId ? checked : checked ? false : scene.is_hero,
      })),
    );
  };

  return {
    patchScene,
    uploadScenes,
    importHero,
    applyOutline,
    commitScenes,
    deleteScene,
    removeOutline,
    uploadMask,
    applySceneSettings,
    toggleHero,
  };
}
