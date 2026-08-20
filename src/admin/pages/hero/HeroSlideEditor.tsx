"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
} from "@dnd-kit/sortable";
import { Image as ImageIcon } from "lucide-react";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import {
  SortableSlideCard,
  type HeroAlbum as Album,
  type HeroArtist as Artist,
  type HeroSlide,
} from "./HeroSlideCard";

type HeroRecovery = { updatedAt: number } | null;

type HeroSlideEditorProps = {
  slides: HeroSlide[];
  orderSnapshot: string;
  orderDirty: boolean;
  savingId: string | null;
  error: string;
  notice: string;
  videoStatus: string | null;
  recovery: HeroRecovery;
  draggingId: string | null;
  deleteSlideItem: HeroSlide | null;
  albumById: Map<string, Album>;
  artistById: Map<string, Artist>;
  isLiveAlbum: (album: Album) => boolean;
  onSave: () => Promise<void>;
  onRestoreBackup: () => void;
  onDiscardBackup: () => void;
  onClearError: () => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragCancel: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onMove: (index: number, offset: number) => void;
  onRemoveRequest: (slide: HeroSlide) => void;
  onRemove: (slide: HeroSlide) => void;
  onCancelRemove: () => void;
  onVideoChange: (slideId: string, videoUrl: string | null) => Promise<void>;
  onVideoStatus: (message: string | null) => void;
};

export default function HeroSlideEditor({
  slides,
  orderSnapshot,
  orderDirty,
  savingId,
  error,
  notice,
  videoStatus,
  recovery,
  draggingId,
  deleteSlideItem,
  albumById,
  artistById,
  isLiveAlbum,
  onSave,
  onRestoreBackup,
  onDiscardBackup,
  onClearError,
  onDragStart,
  onDragCancel,
  onDragEnd,
  onMove,
  onRemoveRequest,
  onRemove,
  onCancelRemove,
  onVideoChange,
  onVideoStatus,
}: HeroSlideEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <>
      <section className="hero-admin-summary">
        <div className="hero-admin-summary-icon">
          <ImageIcon aria-hidden="true" />
        </div>
        <div>
          <h2>공개 앨범의 메인 노출 순서를 관리합니다.</h2>
          <p>
            앨범의 기본 정렬과 별개로, 홈 화면에 보여줄 앨범과 노출 순서를
            지정합니다.
          </p>
        </div>
        <dl>
          <div>
            <dt>등록</dt>
            <dd>{slides.length}</dd>
          </div>
          <div>
            <dt>공개 방식</dt>
            <dd className="is-label">자동</dd>
          </div>
        </dl>
        <div className="hero-admin-save-actions">
          <DraftSaveButton
            snapshot={orderSnapshot}
            draft={slides}
            dirty={orderDirty}
            saving={savingId === "order"}
            onSave={onSave}
            labels={{ $root: "메인 노출 목록" }}
          />
        </div>
      </section>

      {recovery && (
        <div className="content-draft-recovery" role="status">
          <p>
            <b>저장하지 않은 임시 작업이 있습니다.</b>
            <span>
              {new Date(recovery.updatedAt).toLocaleString("ko-KR")} 자동 백업
            </span>
          </p>
          <button
            type="button"
            data-tour-id="draft-discard"
            onClick={onDiscardBackup}
          >
            삭제
          </button>
          <button
            type="button"
            data-tour-id="draft-restore"
            onClick={onRestoreBackup}
          >
            복구
          </button>
        </div>
      )}

      {error && (
        <div className="hero-admin-alert is-error" role="alert">
          <b>!</b>
          <span>{error}</span>
          <button type="button" onClick={onClearError}>
            닫기
          </button>
        </div>
      )}
      <AdminToast message={videoStatus || notice} />

      <section className="hero-admin-panel hero-admin-queue">
        <div className="hero-admin-panel-heading">
          <div>
            <h3>메인 슬라이드 순서</h3>
            <p>
              드래그한 순서는 브라우저에 임시 적용되며, 상단 저장 버튼을 눌러
              공개합니다.
            </p>
          </div>
          <em>총 {slides.length}개</em>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragCancel={onDragCancel}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={slides.map((slide) => slide.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className={`hero-slide-strip ${draggingId ? "is-sorting" : ""}`}
            >
              {slides.map((slide, index) => {
                const album = albumById.get(slide.album_id);
                const artist = album
                  ? artistById.get(album.artist_id)
                  : undefined;
                return (
                  <SortableSlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    album={album}
                    artist={artist}
                    live={album ? isLiveAlbum(album) : false}
                    accent={album?.color || artist?.color || BRAND_PINK_HEX}
                    disabled={Boolean(savingId)}
                    onMoveUp={() => onMove(index, -1)}
                    onMoveDown={() => onMove(index, 1)}
                    canMoveUp={index > 0}
                    canMoveDown={index < slides.length - 1}
                    onRemove={() => onRemoveRequest(slide)}
                    onVideoChange={(videoUrl) =>
                      onVideoChange(slide.id, videoUrl)
                    }
                    onVideoStatus={onVideoStatus}
                  />
                );
              })}
              {!slides.length && (
                <div className="hero-admin-empty">
                  <ImageIcon aria-hidden="true" />
                  <b>메인에 등록된 앨범이 없습니다.</b>
                  <span>
                    아래 앨범 라이브러리에서 메인에 노출할 앨범을 추가해 주세요.
                  </span>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      {deleteSlideItem && (
        <DeleteConfirmDialog
          title="메인 목록에서 제외할까요?"
          description="홈 화면에서만 제외하며 앨범과 트랙 데이터는 그대로 유지됩니다."
          confirmValue={
            albumById.get(deleteSlideItem.album_id)?.title || "앨범"
          }
          valueLabel="앨범명"
          busy={savingId === deleteSlideItem.id}
          onCancel={onCancelRemove}
          onConfirm={() => onRemove(deleteSlideItem)}
        />
      )}
    </>
  );
}
