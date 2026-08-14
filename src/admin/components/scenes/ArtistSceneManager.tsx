"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import type { ArtistScene, ScenePoint } from "@/core/utils/artist-scenes";
import styles from "@/styles/(admin)/components/scenes/ArtistSceneManager.module.css";
import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import { registerPageDraft } from "@/admin/hooks/usePageDrafts";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import type { MemberLookup } from "./artist-scene-editor-model";
import { useArtistSceneLoader } from "./useArtistSceneLoader";
import { useArtistSceneActions } from "./useArtistSceneActions";
import ArtistSceneWorkspace from "./ArtistSceneWorkspace";

type Props = {
  artistId: string | null;
  heroUrl: string;
  onError: (message: string) => void;
  onToast: (message: string) => void;
  language: AdminLanguage;
};

export default function ArtistSceneManager({
  artistId,
  heroUrl,
  onError,
  onToast,
  language,
}: Props) {
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const uploadedAssets = useRef<UploadedImageAsset[]>([]);
  const [scenes, setScenes] = useState<ArtistScene[]>([]);
  const [snapshot, setSnapshot] = useState<ArtistScene[]>([]);
  const [artistUpdatedAt, setArtistUpdatedAt] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberLookup[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draftOutline, setDraftOutline] = useState<ScenePoint[]>([]);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { load, loading, schemaMissing } = useArtistSceneLoader(
    artistId,
    onError,
    setScenes,
    setSnapshot,
    setMembers,
    setArtistUpdatedAt,
    setSelectedSceneId,
  );

  const selectedScene =
    scenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const selectedRegion =
    selectedScene?.artist_scene_members.find(
      (region) => region.member_id === selectedMemberId,
    ) ?? null;
  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ?? null;
  const sceneRatio =
    selectedScene?.image_width && selectedScene.image_height
      ? selectedScene.image_width / selectedScene.image_height
      : 16 / 9;
  const dirty = JSON.stringify(scenes) !== JSON.stringify(snapshot);
  const backupKey = `admin-draft:scenes:${artistId || "none"}`;
  const restoreScenes = useCallback(
    (saved: ArtistScene[]) => setScenes(saved),
    [],
  );
  const { recovery, restoreBackup, discardBackup } = useDraftBackup({
    key: backupKey,
    draft: scenes,
    snapshot: JSON.stringify(snapshot),
    dirty,
    restore: restoreScenes,
  });

  useEffect(() => {
    void Promise.resolve().then(() =>
      setDraftOutline(selectedRegion?.outline ?? []),
    );
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedMemberId && members[0])
      void Promise.resolve().then(() => setSelectedMemberId(members[0].id));
  }, [members, selectedMemberId]);

  const {
    patchScene,
    uploadScenes,
    importHero,
    syncSceneDimensions,
    applyOutline,
    commitScenes,
    deleteScene,
    removeOutline,
    uploadMask,
    applySceneSettings,
    toggleHero,
  } = useArtistSceneActions({
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
    uploadedAssetsRef: uploadedAssets,
    sceneInputRef,
    maskInputRef,
    setBusy,
    setDeleteOpen,
    load,
    discardBackup,
  });

  useEffect(() => {
    if (!dirty || !artistId) return;
    return registerPageDraft(backupKey, {
      diff: [
        {
          kind: "change",
          field: "인터랙티브 장면",
          before: `${snapshot.length}개`,
          after: `${scenes.length}개`,
        },
      ],
      commit: commitScenes,
    });
  }, [
    artistId,
    backupKey,
    commitScenes,
    dirty,
    scenes.length,
    snapshot.length,
  ]);

  if (!artistId)
    return (
      <div className={styles.empty}>
        <ImagePlus aria-hidden="true" />
        <b>아티스트를 먼저 저장하세요.</b>
      </div>
    );
  if (loading)
    return <AdminSkeleton variant="media" className="min-h-[360px]" />;
  if (schemaMissing)
    return (
      <div className={styles.empty}>
        <ImagePlus aria-hidden="true" />
        <b>019_artist_scenes.sql 적용이 필요합니다.</b>
        <span>
          스키마 적용 후 이 탭에서 장면과 멤버 실루엣을 편집할 수 있습니다.
        </span>
      </div>
    );

  return (
    <div className={styles.manager} data-tour-id="artist-scenes">
      {recovery && (
        <div className="content-draft-recovery" role="status">
          <p>
            <b>저장하지 않은 장면 작업이 있습니다.</b>
          </p>
          <button type="button" onClick={discardBackup}>
            삭제
          </button>
          <button type="button" onClick={restoreBackup}>
            복구
          </button>
        </div>
      )}
      <ArtistSceneWorkspace
        heroUrl={heroUrl}
        language={language}
        scenes={scenes}
        selectedSceneId={selectedSceneId}
        setSelectedSceneId={setSelectedSceneId}
        selectedScene={selectedScene}
        selectedRegion={selectedRegion}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        selectedMember={selectedMember}
        members={members}
        draftOutline={draftOutline}
        setDraftOutline={setDraftOutline}
        busy={busy}
        deleteOpen={deleteOpen}
        sceneInputRef={sceneInputRef}
        maskInputRef={maskInputRef}
        drawingRef={drawingRef}
        sceneRatio={sceneRatio}
        onImportHero={importHero}
        onUploadScenes={uploadScenes}
        onPatchScene={patchScene}
        onToggleHero={toggleHero}
        onOpenDelete={() => setDeleteOpen(true)}
        onApplySettings={applySceneSettings}
        onSyncSceneDimensions={syncSceneDimensions}
        onApplyOutline={applyOutline}
        onUploadMask={uploadMask}
        onRemoveOutline={removeOutline}
        onDeleteScene={deleteScene}
        onCloseDelete={() => setDeleteOpen(false)}
      />
    </div>
  );
}
