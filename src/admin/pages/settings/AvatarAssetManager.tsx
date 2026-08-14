"use client";

import {
  ArrowDown,
  ArrowUp,
  Crop,
  ImagePlus,
  Trash2,
  Upload,
} from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import CustomSelect from "@/core/components/form/CustomSelect";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAvatarAssetManager } from "./useAvatarAssetManager";

export default function AvatarAssetManager({
  active,
  onDirtyChange,
  onError,
  onToast,
}: {
  active: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onError: (message: string) => void;
  onToast: (message: string) => void;
}) {
  const {
    inputRef,
    cropCanvasRef,
    artists,
    artistId,
    items,
    loading,
    uploading,
    dragging,
    setDragging,
    deleteItem,
    setDeleteItem,
    cropQueue,
    cropReady,
    cropZoom,
    setCropZoom,
    cropX,
    setCropX,
    cropY,
    setCropY,
    selectedArtist,
    recovery,
    restoreBackup,
    discardBackup,
    publicUrl,
    selectArtist,
    selectFiles,
    closeCrop,
    confirmCrop,
    moveItem,
    removeItem,
    toggleActive,
  } = useAvatarAssetManager({ onDirtyChange, onError, onToast });

  return (
    <section
      hidden={!active}
      className="avatar-manager"
      aria-labelledby="avatar-manager-title"
    >
      {recovery && (
        <div className="content-draft-recovery" role="status">
          <p>
            <b>저장하지 않은 아바타 작업이 있습니다.</b>
          </p>
          <button type="button" onClick={discardBackup}>
            삭제
          </button>
          <button type="button" onClick={restoreBackup}>
            복구
          </button>
        </div>
      )}
      <div className="content-section-heading settings-section-heading">
        <div>
          <h3 id="avatar-manager-title">사용자 아바타</h3>
          <p>
            아티스트별 선택 이미지를 등록하고 노출 순서를 관리합니다. 변경사항은
            저장 전까지 공개되지 않습니다.
          </p>
        </div>
        <ImagePlus aria-hidden="true" />
      </div>

      <div className="avatar-manager-toolbar">
        <div>
          <span>아티스트</span>
          <CustomSelect
            ariaLabel="아바타 아티스트 선택"
            value={artistId}
            onChange={(value) => void selectArtist(value)}
            options={artists.map((artist) => ({
              value: artist.id,
              label: artist.eng_name || artist.name,
            }))}
          />
        </div>
        <span>
          {selectedArtist
            ? `${selectedArtist.eng_name || selectedArtist.name} · ${items.length}개`
            : "등록된 아티스트 없음"}
        </span>
        <span className="avatar-manager-save-hint">
          상단 저장으로 일괄 반영
        </span>
      </div>

      <div
        className={`gallery-dropzone ${dragging ? "is-dragging" : ""}`}
        data-tour-id="avatar-upload"
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectFiles(event.dataTransfer.files);
        }}
      >
        <Upload aria-hidden="true" />
        <div>
          <b>{uploading ? "아바타를 업로드하는 중…" : "아바타 이미지 추가"}</b>
          <span>
            JPG, PNG, WebP · 최대 10MB · 업로드 전 정사각형으로 자릅니다
          </span>
        </div>
        <button
          type="button"
          data-tour-id="avatar-file"
          disabled={uploading || !artistId}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "업로드 중" : "파일 선택"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(event) =>
            event.target.files && selectFiles(event.target.files)
          }
        />
      </div>

      {loading ? (
        <AdminSkeleton variant="media" className="min-h-[250px]" />
      ) : !items.length ? (
        <div className="gallery-empty">
          <ImagePlus aria-hidden="true" />
          <b>등록된 사용자 아바타가 없습니다.</b>
          <span>이미지를 추가한 뒤 변경사항을 저장해 주세요.</span>
        </div>
      ) : (
        <div className="avatar-manager-grid">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={`avatar-manager-card ${item.is_active ? "" : "is-inactive"}`}
            >
              <div className="avatar-manager-image">
                <AdminAssetImage
                  src={publicUrl(item.image_path)}
                  alt={`${selectedArtist?.eng_name || selectedArtist?.name || "아티스트"} 아바타 ${index + 1}`}
                  sizes="180px"
                />
              </div>
              <div className="avatar-manager-card-meta">
                <b>{String(index + 1).padStart(2, "0")}</b>
                <label>
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={(event) => toggleActive(item.id, event.target.checked)}
                  />
                  계정에 노출
                </label>
              </div>
              <div
                className="avatar-manager-card-actions"
                data-tour-id="avatar-actions"
              >
                <button
                  type="button"
                  data-tour-id="avatar-up"
                  disabled={index === 0}
                  aria-label="앞으로 이동"
                  onClick={() => moveItem(index, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-tour-id="avatar-down"
                  disabled={index === items.length - 1}
                  aria-label="뒤로 이동"
                  onClick={() => moveItem(index, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-tour-id="avatar-delete"
                  className="is-danger"
                  aria-label="아바타 삭제"
                  onClick={() => setDeleteItem(item)}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteItem && (
        <DeleteConfirmDialog
          title="사용자 아바타를 삭제할까요?"
          description="저장하면 이 이미지는 선택 목록에서 제거됩니다. 현재 선택 중인 계정은 기본 아바타로 전환됩니다."
          confirmValue={`${selectedArtist?.eng_name || selectedArtist?.name || "아바타"} ${items.findIndex((item) => item.id === deleteItem.id) + 1}`}
          valueLabel="아바타"
          busy={false}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => void removeItem()}
        />
      )}
      {cropQueue && (
        <div
          className="avatar-crop-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="avatar-crop-title"
        >
          <div className="avatar-crop-card">
            <header>
              <span>
                <Crop aria-hidden="true" />
              </span>
              <div>
                <h3 id="avatar-crop-title">정사각형으로 자르기</h3>
                <p>
                  {cropQueue.files.length > 1
                    ? `${cropQueue.index + 1} / ${cropQueue.files.length} · `
                    : ""}
                  확대와 위치를 조절해 사용할 영역을 맞춰 주세요.
                </p>
              </div>
            </header>
            <canvas
              ref={cropCanvasRef}
              className="avatar-crop-canvas"
              width="720"
              height="720"
              aria-label="아바타 자르기 미리보기"
            />
            <div className="avatar-crop-controls">
              <label>
                <span>확대</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropZoom}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                />
              </label>
              <label>
                <span>가로 위치</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropX}
                  onChange={(event) => setCropX(Number(event.target.value))}
                />
              </label>
              <label>
                <span>세로 위치</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropY}
                  onChange={(event) => setCropY(Number(event.target.value))}
                />
              </label>
            </div>
            <footer>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={closeCrop}
              >
                취소
              </button>
              <button
                type="button"
                data-tour-id="avatar-crop"
                className="admin-btn admin-btn-primary"
                disabled={!cropReady}
                onClick={() => void confirmCrop()}
              >
                {cropQueue.index < cropQueue.files.length - 1
                  ? "다음 이미지"
                  : "자르고 추가"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
