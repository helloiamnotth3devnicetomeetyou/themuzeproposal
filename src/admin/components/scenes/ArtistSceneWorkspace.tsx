"use client";

import {
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from "react";
import { ImagePlus, RefreshCcw, Save, Trash2, Upload } from "lucide-react";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import FormField from "@/admin/components/content/FormField";
import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import {
  simplifyOutline,
  type ArtistScene,
  type ScenePoint,
} from "@/core/utils/artist-scenes";
import styles from "@/styles/(admin)/components/scenes/ArtistSceneManager.module.css";
import SceneCanvas from "./SceneCanvas";
import type { MemberLookup } from "./artist-scene-editor-model";

type SceneRegion = ArtistScene["artist_scene_members"][number];

type Props = {
  heroUrl: string;
  language: AdminLanguage;
  scenes: ArtistScene[];
  selectedSceneId: string | null;
  setSelectedSceneId: Dispatch<SetStateAction<string | null>>;
  selectedScene: ArtistScene | null;
  selectedRegion: SceneRegion | null;
  selectedMemberId: string | null;
  setSelectedMemberId: Dispatch<SetStateAction<string | null>>;
  selectedMember: MemberLookup | null;
  members: MemberLookup[];
  draftOutline: ScenePoint[];
  setDraftOutline: Dispatch<SetStateAction<ScenePoint[]>>;
  busy: boolean;
  deleteOpen: boolean;
  sceneInputRef: RefObject<HTMLInputElement | null>;
  maskInputRef: RefObject<HTMLInputElement | null>;
  drawingRef: MutableRefObject<boolean>;
  sceneRatio: number;
  onImportHero: () => Promise<void>;
  onUploadScenes: (files: FileList) => Promise<void>;
  onPatchScene: (patch: Partial<ArtistScene>) => void;
  onToggleHero: (sceneId: string, checked: boolean) => void;
  onOpenDelete: () => void;
  onApplySettings: () => void;
  onApplyOutline: () => void;
  onUploadMask: (file: File) => Promise<void>;
  onRemoveOutline: () => void;
  onDeleteScene: () => void;
  onCloseDelete: () => void;
};

export default function ArtistSceneWorkspace({
  heroUrl,
  language,
  scenes,
  selectedSceneId,
  setSelectedSceneId,
  selectedScene,
  selectedRegion,
  selectedMemberId,
  setSelectedMemberId,
  selectedMember,
  members,
  draftOutline,
  setDraftOutline,
  busy,
  deleteOpen,
  sceneInputRef,
  maskInputRef,
  drawingRef,
  sceneRatio,
  onImportHero,
  onUploadScenes,
  onPatchScene,
  onToggleHero,
  onOpenDelete,
  onApplySettings,
  onApplyOutline,
  onUploadMask,
  onRemoveOutline,
  onDeleteScene,
  onCloseDelete,
}: Props) {
  return (
    <>
      <div
        className={styles.toolbar}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!busy) void onUploadScenes(event.dataTransfer.files);
        }}
      >
        <div>
          <b>Interactive scenes</b>
          <span>
            장면마다 멤버 외곽선을 직접 그리고 정밀 마스크를 연결합니다.
          </span>
        </div>
        {heroUrl && (
          <button
            type="button"
            data-tour-id="scene-import"
            disabled={busy}
            onClick={() => void onImportHero()}
          >
            <ImagePlus aria-hidden="true" />
            대표 이미지 가져오기
          </button>
        )}
        <button
          type="button"
          data-tour-id="scene-add"
          disabled={busy}
          onClick={() => sceneInputRef.current?.click()}
        >
          <Upload aria-hidden="true" />
          장면 추가
        </button>
        <input
          ref={sceneInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(event) =>
            event.target.files && void onUploadScenes(event.target.files)
          }
        />
      </div>

      {!scenes.length ? (
        <div className={styles.empty}>
          <ImagePlus aria-hidden="true" />
          <b>인터랙티브 장면이 없습니다.</b>
          <span>대표 이미지를 가져오거나 새 콘셉트 이미지를 추가하세요.</span>
        </div>
      ) : (
        <>
          <div className={styles.sceneTabs}>
            {scenes.map((scene) => (
              <button
                type="button"
                key={scene.id}
                className={
                  scene.id === selectedSceneId ? styles.isSelected : ""
                }
                onClick={() => setSelectedSceneId(scene.id)}
              >
                <AdminAssetImage src={scene.image_url} alt="" sizes="120px" />
                <span>{scene.title || "이름 없는 장면"}</span>
                {scene.is_hero && <i>HERO</i>}
              </button>
            ))}
          </div>

          {selectedScene && (
            <div className={styles.sceneSettings} data-tour-id="scene-settings">
              <FormField
                activeLang={language}
                label="장면 제목"
                valueKo={selectedScene.title_ko || selectedScene.title || ""}
                valueEn={selectedScene.title_en || ""}
                valueJa={selectedScene.title_ja || ""}
                onChangeKo={(value) =>
                  onPatchScene({ title: value, title_ko: value })
                }
                onChangeEn={(value) => onPatchScene({ title_en: value })}
                onChangeJa={(value) => onPatchScene({ title_ja: value })}
              />
              <label className={styles.sceneLinkField}>
                <span>장면 링크 (YouTube 등)</span>
                <input
                  className="admin-input"
                  inputMode="url"
                  value={selectedScene.link_url || ""}
                  onChange={(event) =>
                    onPatchScene({ link_url: event.target.value })
                  }
                  placeholder="https://www.youtube.com/..."
                />
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={selectedScene.is_hero}
                  onChange={(event) =>
                    onToggleHero(selectedScene.id, event.target.checked)
                  }
                />
                <span>대표 장면</span>
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={selectedScene.is_published}
                  onChange={(event) =>
                    onPatchScene({ is_published: event.target.checked })
                  }
                />
                <span>공개</span>
              </label>
              <button
                type="button"
                data-tour-id="scene-delete"
                className={styles.danger}
                disabled={busy}
                onClick={onOpenDelete}
              >
                <Trash2 aria-hidden="true" />
                삭제
              </button>
              <button
                type="button"
                data-tour-id="scene-apply"
                disabled={busy}
                onClick={onApplySettings}
              >
                <Save aria-hidden="true" />
                장면 적용
              </button>
            </div>
          )}

          {selectedScene && (
            <div className={styles.editor}>
              <div className={styles.memberPicker}>
                <span>외곽선을 그릴 멤버</span>
                <div>
                  {members.map((member) => {
                    const hasRegion = selectedScene.artist_scene_members.some(
                      (region) => region.member_id === member.id,
                    );
                    return (
                      <button
                        type="button"
                        key={member.id}
                        className={
                          member.id === selectedMemberId
                            ? styles.isSelected
                            : ""
                        }
                        onClick={() => setSelectedMemberId(member.id)}
                      >
                        <i
                          style={{ background: member.color || BRAND_PINK_HEX }}
                        />
                        {member.eng_name || member.name}
                        {hasRegion && <small>완료</small>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <SceneCanvas
                selectedScene={selectedScene}
                selectedMemberId={selectedMemberId}
                draftOutline={draftOutline}
                setDraftOutline={setDraftOutline}
                drawingRef={drawingRef}
                simplifyOutline={simplifyOutline}
                sceneRatio={sceneRatio}
              />

              <aside className={styles.outlineTools}>
                <div>
                  <span>선택 멤버</span>
                  <b>
                    {selectedMember?.eng_name ||
                      selectedMember?.name ||
                      "멤버 선택"}
                  </b>
                  <small>
                    {draftOutline.length
                      ? `${draftOutline.length}개 윤곽 포인트`
                      : "아직 외곽선이 없습니다."}
                  </small>
                </div>
                <button
                  type="button"
                  disabled={!draftOutline.length || busy}
                  onClick={() => setDraftOutline([])}
                >
                  <RefreshCcw aria-hidden="true" />
                  다시 그리기
                </button>
                <button
                  type="button"
                  data-tour-id="scene-outline-apply"
                  disabled={draftOutline.length < 3 || busy}
                  onClick={onApplyOutline}
                >
                  <Save aria-hidden="true" />
                  외곽선 적용
                </button>
                <button
                  type="button"
                  data-tour-id="scene-mask"
                  disabled={draftOutline.length < 3 || busy}
                  onClick={() => maskInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!busy && event.dataTransfer.files[0])
                      void onUploadMask(event.dataTransfer.files[0]);
                  }}
                >
                  <Upload aria-hidden="true" />
                  정밀 마스크 덮어쓰기
                </button>
                <input
                  ref={maskInputRef}
                  type="file"
                  accept="image/png,image/webp"
                  hidden
                  onChange={(event) =>
                    event.target.files?.[0] &&
                    void onUploadMask(event.target.files[0])
                  }
                />
                {selectedRegion?.mask_url && <p>알파 마스크 적용됨</p>}
                <button
                  type="button"
                  data-tour-id="scene-region-delete"
                  className={styles.danger}
                  disabled={busy || (!draftOutline.length && !selectedRegion)}
                  onClick={onRemoveOutline}
                >
                  <Trash2 aria-hidden="true" />
                  멤버 영역 제거
                </button>
              </aside>
            </div>
          )}
        </>
      )}
      {deleteOpen && selectedScene && (
        <DeleteConfirmDialog
          title="장면을 삭제할까요?"
          description="장면 이미지와 연결된 멤버 외곽선 및 정밀 마스크 파일이 함께 영구적으로 제거됩니다. 이 작업은 되돌릴 수 없습니다."
          confirmValue={selectedScene.title || "이름 없는 장면"}
          valueLabel="장면명"
          busy={busy}
          onCancel={onCloseDelete}
          onConfirm={onDeleteScene}
        />
      )}
    </>
  );
}
