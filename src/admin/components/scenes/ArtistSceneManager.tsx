"use client";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCcw, Save, Trash2, Upload } from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { supabase } from "@/core/supabase/client";
import { toWebP } from "@/admin/utils/image-convert";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import { revalidateArtistSceneData } from "@/core/utils/artist-events";
import { normalizeSceneLink, simplifyOutline, type ArtistScene, type ScenePoint } from "@/core/utils/artist-scenes";
import styles from "@/styles/(admin)/components/scenes/ArtistSceneManager.module.css";
import SceneCanvas from "./SceneCanvas";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import FormField from "@/admin/components/content/FormField";
import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import { registerPageDraft } from "@/admin/hooks/usePageDrafts";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import { finalizeDraftImageAssets, trackDraftImageAsset } from "@/admin/utils/draft-assets";
import { adminDbError } from "@/admin/utils/admin-db-error";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import {
  ACCEPTED_MASK_TYPES,
  ACCEPTED_SCENE_TYPES,
  MAX_IMAGE_BYTES,
  imageDimensions,
  type MemberLookup,
} from "./artist-scene-editor-model";
import { useArtistSceneLoader } from "./useArtistSceneLoader";

type Props = {
  artistId: string | null;
  heroUrl: string;
  onError: (message: string) => void;
  onToast: (message: string) => void;
  language: AdminLanguage;
};


export default function ArtistSceneManager({ artistId, heroUrl, onError, onToast, language }: Props) {
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const uploadedAssets = useRef<UploadedImageAsset[]>([]);
  const [scenes, setScenes] = useState<ArtistScene[]>([]);
  const [snapshot, setSnapshot] = useState<ArtistScene[]>([]);
  const [members, setMembers] = useState<MemberLookup[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draftOutline, setDraftOutline] = useState<ScenePoint[]>([]);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { loading, schemaMissing } = useArtistSceneLoader(artistId, onError, setScenes, setSnapshot, setMembers, setSelectedSceneId);

  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const selectedRegion = selectedScene?.artist_scene_members.find((region) => region.member_id === selectedMemberId) ?? null;
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const sceneRatio = selectedScene?.image_width && selectedScene.image_height ? selectedScene.image_width / selectedScene.image_height : 16 / 9;
  const dirty = JSON.stringify(scenes) !== JSON.stringify(snapshot);
  const backupKey = `admin-draft:scenes:${artistId || "none"}`;
  const restoreScenes = useCallback((saved: ArtistScene[]) => setScenes(saved), []);
  const { recovery, restoreBackup, discardBackup } = useDraftBackup({ key: backupKey, draft: scenes, snapshot: JSON.stringify(snapshot), dirty, restore: restoreScenes });

  useEffect(() => {
    void Promise.resolve().then(() => setDraftOutline(selectedRegion?.outline ?? []));
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedMemberId && members[0]) void Promise.resolve().then(() => setSelectedMemberId(members[0].id));
  }, [members, selectedMemberId]);

  const patchScene = (patch: Partial<ArtistScene>) => {
    if (!selectedSceneId) return;
    setScenes((current) => current.map((scene) => scene.id === selectedSceneId ? { ...scene, ...patch } : scene));
  };

  const uploadScenes = async (files: FileList) => {
    if (!artistId) return;
    const list = Array.from(files);
    const invalid = list.find((file) => !ACCEPTED_SCENE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) return onError(`${invalid.name}: JPG, PNG, WebP만 가능하며 파일은 최대 20MB입니다.`);
    setBusy(true);
    onError("");
    try {
      let preferredId = "";
      for (const [index, file] of list.entries()) {
        const dimensions = await imageDimensions(file);
        const converted = await toWebP(file);
        const path = `${artistId}/scenes/${crypto.randomUUID()}.webp`;
        const uploadedAsset = await uploadAdminAsset("artist-assets", path, converted);
        const tracked = { bucket: "artist-assets" as const, path: uploadedAsset.path, url: uploadedAsset.url };
        uploadedAssets.current.push(tracked);
        trackDraftImageAsset(tracked);
        const publicUrl = uploadedAsset.url;
        const canonicalTitle = file.name.replace(/\.[^.]+$/, "");
        preferredId = crypto.randomUUID();
        setScenes((current) => [...current, {
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
        }]);
      }
      setSelectedSceneId(preferredId);
      onToast(`${list.length}개의 인터랙티브 장면을 임시 작업에 추가했습니다.`);
    } catch (uploadError) {
      onError(uploadError instanceof Error ? uploadError.message : "장면 이미지를 업로드하지 못했습니다.");
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
      const response = await fetch(heroUrl);
      if (!response.ok) throw new Error("대표 이미지를 내려받지 못했습니다.");
      const blob = await response.blob();
      const sourceFile = new File([blob], "hero", { type: blob.type });
      const [dimensions, converted] = await Promise.all([
        imageDimensions(sourceFile),
        toWebP(sourceFile),
      ]);
      const path = `${artistId}/scenes/${crypto.randomUUID()}.webp`;
      const uploadedAsset = await uploadAdminAsset("artist-assets", path, converted);
      const tracked = { bucket: "artist-assets" as const, path: uploadedAsset.path, url: uploadedAsset.url };
      uploadedAssets.current.push(tracked);
      trackDraftImageAsset(tracked);
      const sceneId = crypto.randomUUID();
      setScenes((current) => [...current, {
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
      }]);
      setSelectedSceneId(sceneId);
      onToast("현재 대표 이미지를 인터랙티브 장면 임시 작업으로 가져왔습니다.");
    } catch (importError) {
      onError(importError instanceof Error ? importError.message : "대표 이미지를 가져오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const syncSceneDimensions = (width: number, height: number) => {
    if (!selectedScene || !width || !height) return;
    if (selectedScene.image_width === width && selectedScene.image_height === height) return;
    patchScene({ image_width: width, image_height: height });
  };

  const applyOutline = () => {
    if (!selectedScene || !selectedMemberId || draftOutline.length < 3) return;
    setScenes((current) => current.map((scene) => scene.id !== selectedScene.id ? scene : {
      ...scene,
      artist_scene_members: selectedRegion
        ? scene.artist_scene_members.map((region) => region.id === selectedRegion.id ? { ...region, outline: draftOutline } : region)
        : [...scene.artist_scene_members, { id: crypto.randomUUID(), member_id: selectedMemberId, outline: draftOutline, mask_url: null, sort_order: selectedMember?.sort_order || 0 }],
    }));
    onToast(`${selectedMember?.name || "멤버"} 외곽선을 임시 작업에 적용했습니다.`);
  };

  const commitScenes = useCallback(async () => {
    const removedScenes = snapshot.filter((scene) => !scenes.some((item) => item.id === scene.id));
    const previousRegions = snapshot.flatMap((scene) => scene.artist_scene_members);
    const currentRegions = scenes.flatMap((scene) => scene.artist_scene_members);
    const removedRegions = previousRegions.filter((region) => !currentRegions.some((item) => item.id === region.id));
    const replacedRegions = previousRegions.filter((region) => {
      const current = currentRegions.find((item) => item.id === region.id);
      return current && current.mask_url !== region.mask_url;
    });
    const removedRegionIds = removedRegions.map((region) => region.id);
    const sceneResults = await Promise.all([
      ...(removedScenes.length ? [supabase.from("artist_scenes").delete().in("id", removedScenes.map((scene) => scene.id))] : []),
      ...scenes.map((scene) => supabase.from("artist_scenes").upsert({
        id: scene.id, artist_id: scene.artist_id, image_url: scene.image_url,
        title: scene.title.trim(), title_ko: scene.title_ko?.trim() || scene.title.trim(), title_en: scene.title_en?.trim() || null,
        title_ja: scene.title_ja?.trim() || null, link_url: scene.link_url?.trim() || null, image_width: scene.image_width,
        image_height: scene.image_height, is_hero: scene.is_hero, is_published: scene.is_published, sort_order: scene.sort_order,
      })),
    ]);
    const sceneError = sceneResults.find((result) => result.error)?.error;
    if (sceneError) { onError(adminDbError(sceneError)); throw sceneError; }
    const regionResults = await Promise.all([
      ...(removedRegionIds.length ? [supabase.from("artist_scene_members").delete().in("id", removedRegionIds)] : []),
      ...scenes.flatMap((scene) => scene.artist_scene_members.map((region) => supabase.from("artist_scene_members").upsert({ ...region, scene_id: scene.id }, { onConflict: "scene_id,member_id" }))),
    ]);
    const error = regionResults.find((result) => result.error)?.error;
    if (error) { onError(error.message); throw error; }
    await finalizeDraftImageAssets(
      supabase,
      uploadedAssets.current,
      scenes.flatMap((scene) => [scene.image_url, ...scene.artist_scene_members.map((region) => region.mask_url || "")]),
      [
        ...removedScenes.flatMap((scene) => [scene.image_url, ...scene.artist_scene_members.map((region) => region.mask_url || "")]),
        ...removedRegions.map((region) => region.mask_url || ""),
        ...replacedRegions.map((region) => region.mask_url || ""),
      ],
    );
    uploadedAssets.current = [];
    setSnapshot(scenes);
    discardBackup();
    await revalidateArtistSceneData();
    onToast("장면과 외곽선 변경사항을 저장했습니다.");
  }, [discardBackup, onError, onToast, scenes, snapshot]);

  useEffect(() => {
    if (!dirty || !artistId) return;
    return registerPageDraft(backupKey, {
      diff: [{ kind: "change", field: "인터랙티브 장면", before: `${snapshot.length}개`, after: `${scenes.length}개` }],
      commit: commitScenes,
    });
  }, [artistId, backupKey, commitScenes, dirty, scenes.length, snapshot.length]);

  const deleteScene = () => {
    if (!selectedScene) return;
    setScenes((current) => current.filter((scene) => scene.id !== selectedScene.id));
    setDeleteOpen(false);
    onToast("장면을 임시 작업에서 삭제했습니다. 상단 저장 시 반영됩니다.");
  };

  const removeOutline = () => {
    if (!selectedRegion || !selectedScene) {
      setDraftOutline([]);
      return;
    }
    setScenes((current) => current.map((scene) => scene.id === selectedScene.id ? { ...scene, artist_scene_members: scene.artist_scene_members.filter((region) => region.id !== selectedRegion.id) } : scene));
    setDraftOutline([]);
    onToast("멤버 외곽선을 임시 작업에서 제거했습니다.");
  };

  const uploadMask = async (file: File) => {
    if (!artistId || !selectedScene || !selectedMemberId || draftOutline.length < 3) return onError("외곽선을 먼저 저장한 뒤 정밀 마스크를 올려주세요.");
    if (!ACCEPTED_MASK_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) return onError("정밀 마스크는 투명 배경 PNG 또는 WebP, 최대 20MB입니다.");
    setBusy(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${artistId}/scene-masks/${selectedScene.id}/${selectedMemberId}-${crypto.randomUUID()}.${extension}`;
    let uploadedAsset;
    try {
      uploadedAsset = await uploadAdminAsset("artist-assets", path, file);
    } catch (uploadError) {
      setBusy(false);
      return onError(uploadError instanceof Error ? uploadError.message : "UPLOAD_FAILED");
    }
    const url = `${uploadedAsset.url}?v=${Date.now()}`;
    const tracked = { bucket: "artist-assets" as const, path: uploadedAsset.path, url };
    uploadedAssets.current.push(tracked);
    trackDraftImageAsset(tracked);
    setBusy(false);
    setScenes((current) => current.map((scene) => scene.id !== selectedScene.id ? scene : {
      ...scene,
      artist_scene_members: selectedRegion
        ? scene.artist_scene_members.map((region) => region.id === selectedRegion.id ? { ...region, outline: draftOutline, mask_url: url } : region)
        : [...scene.artist_scene_members, { id: crypto.randomUUID(), member_id: selectedMemberId, outline: draftOutline, mask_url: url, sort_order: selectedMember?.sort_order || 0 }],
    }));
    onToast("픽셀 단위 정밀 마스크를 임시 작업에 적용했습니다.");
    if (maskInputRef.current) maskInputRef.current.value = "";
  };

  if (!artistId) return <div className={styles.empty}><ImagePlus aria-hidden="true" /><b>아티스트를 먼저 저장하세요.</b></div>;
  if (loading) return <AdminSkeleton variant="media" className="min-h-[360px]" />;
  if (schemaMissing) return <div className={styles.empty}><ImagePlus aria-hidden="true" /><b>019_artist_scenes.sql 적용이 필요합니다.</b><span>스키마 적용 후 이 탭에서 장면과 멤버 실루엣을 편집할 수 있습니다.</span></div>;

  return (
    <div className={styles.manager} data-tour-id="artist-scenes">
      {recovery && <div className="content-draft-recovery" role="status"><p><b>저장하지 않은 장면 작업이 있습니다.</b></p><button type="button" onClick={discardBackup}>삭제</button><button type="button" onClick={restoreBackup}>복구</button></div>}
      <div className={styles.toolbar}>
        <div><b>Interactive scenes</b><span>장면마다 멤버 외곽선을 직접 그리고 정밀 마스크를 연결합니다.</span></div>
        {heroUrl && <button type="button" data-tour-id="scene-import" disabled={busy} onClick={() => void importHero()}><ImagePlus aria-hidden="true" />대표 이미지 가져오기</button>}
        <button type="button" data-tour-id="scene-add" disabled={busy} onClick={() => sceneInputRef.current?.click()}><Upload aria-hidden="true" />장면 추가</button>
        <input ref={sceneInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => event.target.files && void uploadScenes(event.target.files)} />
      </div>

      {!scenes.length ? <div className={styles.empty}><ImagePlus aria-hidden="true" /><b>인터랙티브 장면이 없습니다.</b><span>대표 이미지를 가져오거나 새 콘셉트 이미지를 추가하세요.</span></div> : <>
        <div className={styles.sceneTabs}>
          {scenes.map((scene) => <button type="button" key={scene.id} className={scene.id === selectedSceneId ? styles.isSelected : ""} onClick={() => setSelectedSceneId(scene.id)}><AdminAssetImage src={scene.image_url} alt="" sizes="120px" /><span>{scene.title || "이름 없는 장면"}</span>{scene.is_hero && <i>HERO</i>}</button>)}
        </div>

        {selectedScene && <div className={styles.sceneSettings} data-tour-id="scene-settings">
          <FormField activeLang={language} label="장면 제목" valueKo={selectedScene.title_ko || selectedScene.title || ""} valueEn={selectedScene.title_en || ""} valueJa={selectedScene.title_ja || ""} onChangeKo={(value) => patchScene({ title: value, title_ko: value })} onChangeEn={(value) => patchScene({ title_en: value })} onChangeJa={(value) => patchScene({ title_ja: value })} />
          <label className={styles.sceneLinkField}><span>장면 링크 (YouTube 등)</span><input className="admin-input" inputMode="url" value={selectedScene.link_url || ""} onChange={(event) => patchScene({ link_url: event.target.value })} placeholder="https://www.youtube.com/..." /></label>
          <label className={styles.toggle}><input type="checkbox" checked={selectedScene.is_hero} onChange={(event) => { const checked = event.target.checked; setScenes((current) => current.map((scene) => ({ ...scene, is_hero: scene.id === selectedScene.id ? checked : checked ? false : scene.is_hero }))); }} /><span>대표 장면</span></label>
          <label className={styles.toggle}><input type="checkbox" checked={selectedScene.is_published} onChange={(event) => patchScene({ is_published: event.target.checked })} /><span>공개</span></label>
          <button type="button" data-tour-id="scene-delete" className={styles.danger} disabled={busy} onClick={() => setDeleteOpen(true)}><Trash2 aria-hidden="true" />삭제</button>
          <button type="button" data-tour-id="scene-apply" disabled={busy} onClick={() => { const link = selectedScene.link_url?.trim(); if (link && !normalizeSceneLink(link)) onError("장면 링크는 https:// 주소 또는 /로 시작하는 내부 경로를 입력해 주세요."); else onToast("장면 설정을 임시 작업에 적용했습니다."); }}><Save aria-hidden="true" />장면 적용</button>
        </div>}

        {selectedScene && <div className={styles.editor}>
          <div className={styles.memberPicker}>
            <span>외곽선을 그릴 멤버</span>
            <div>{members.map((member) => {
              const hasRegion = selectedScene.artist_scene_members.some((region) => region.member_id === member.id);
              return <button type="button" key={member.id} className={member.id === selectedMemberId ? styles.isSelected : ""} onClick={() => setSelectedMemberId(member.id)}><i style={{ background: member.color || BRAND_PINK_HEX }} />{member.eng_name || member.name}{hasRegion && <small>완료</small>}</button>;
            })}</div>
          </div>

          <SceneCanvas
            selectedScene={selectedScene}
            selectedMemberId={selectedMemberId}
            draftOutline={draftOutline}
            setDraftOutline={setDraftOutline}
            drawingRef={drawingRef}
            syncSceneDimensions={syncSceneDimensions}
            simplifyOutline={simplifyOutline}
            sceneRatio={sceneRatio}
          />

          <aside className={styles.outlineTools}>
            <div><span>선택 멤버</span><b>{selectedMember?.eng_name || selectedMember?.name || "멤버 선택"}</b><small>{draftOutline.length ? `${draftOutline.length}개 윤곽 포인트` : "아직 외곽선이 없습니다."}</small></div>
            <button type="button" disabled={!draftOutline.length || busy} onClick={() => setDraftOutline([])}><RefreshCcw aria-hidden="true" />다시 그리기</button>
            <button type="button" data-tour-id="scene-outline-apply" disabled={draftOutline.length < 3 || busy} onClick={applyOutline}><Save aria-hidden="true" />외곽선 적용</button>
            <button type="button" data-tour-id="scene-mask" disabled={draftOutline.length < 3 || busy} onClick={() => maskInputRef.current?.click()}><Upload aria-hidden="true" />정밀 마스크 덮어쓰기</button>
            <input ref={maskInputRef} type="file" accept="image/png,image/webp" hidden onChange={(event) => event.target.files?.[0] && void uploadMask(event.target.files[0])} />
            {selectedRegion?.mask_url && <p>알파 마스크 적용됨</p>}
            <button type="button" data-tour-id="scene-region-delete" className={styles.danger} disabled={busy || (!draftOutline.length && !selectedRegion)} onClick={() => void removeOutline()}><Trash2 aria-hidden="true" />멤버 영역 제거</button>
          </aside>
        </div>}
      </>}
      {deleteOpen && selectedScene && (
        <DeleteConfirmDialog
          title="장면을 삭제할까요?"
          description="장면 이미지와 연결된 멤버 외곽선 및 정밀 마스크 파일이 함께 영구적으로 제거됩니다. 이 작업은 되돌릴 수 없습니다."
          confirmValue={selectedScene.title || "이름 없는 장면"}
          valueLabel="장면명"
          busy={busy}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => void deleteScene()}
        />
      )}
    </div>
  );
}
