"use client";

import {
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  Filter,
  ImagePlus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import CustomSelect from "@/core/components/form/CustomSelect";
import AdminAssetImage from "./AdminAssetImage";
import type { GalleryManagerProps } from "./gallery-manager-types";
import type { GalleryManagerState } from "./useGalleryManager";

type GalleryManagerViewProps = GalleryManagerProps & GalleryManagerState;

export default function GalleryManagerView({
  artistId,
  scope,
  albumId,
  memberId,
  inputRef,
  items,
  visibleItems,
  selectedItem,
  albums,
  members,
  albumFilter,
  memberFilter,
  loading,
  schemaMissing,
  uploading,
  dragging,
  deleteItem,
  deleteName,
  recovery,
  restoreBackup,
  discardBackup,
  setAlbumFilter,
  setMemberFilter,
  setDragging,
  setSelectedId,
  setDeleteItem,
  uploadFiles,
  patchItem,
  moveItem,
  removeItem,
}: GalleryManagerViewProps) {
  const albumName = (id: string | null) =>
    albums.find((album) => album.id === id)?.name;
  const memberName = (id: string | null) =>
    members.find((member) => member.id === id)?.name;

  if (
    !artistId ||
    (scope === "album" && !albumId) ||
    (scope === "member" && !memberId)
  ) {
    return (
      <div className="gallery-save-first">
        <ImagePlus aria-hidden="true" />
        <h3>
          {scope === "album"
            ? "앨범"
            : scope === "member"
              ? "멤버"
              : "아티스트"}
          를 먼저 저장하세요.
        </h3>
        <p>
          저장 후 이미지를 여러 장 선택하거나 드롭해 갤러리를 만들 수 있습니다.
        </p>
      </div>
    );
  }

  if (schemaMissing) {
    return (
      <div className="gallery-save-first">
        <ImagePlus aria-hidden="true" />
        <h3>갤러리 테이블 적용이 필요합니다.</h3>
        <p>마이그레이션 적용 후 이 탭을 사용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="gallery-manager"
        data-tour-id={scope === "artist" ? "artist-gallery" : undefined}
      >
        {recovery && (
          <div className="content-draft-recovery" role="status">
            <p>
              <b>저장하지 않은 갤러리 작업이 있습니다.</b>
            </p>
            <button type="button" onClick={discardBackup}>
              삭제
            </button>
            <button type="button" onClick={restoreBackup}>
              복구
            </button>
          </div>
        )}
        <div
          className={`gallery-dropzone ${dragging ? "is-dragging" : ""}`}
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
            void uploadFiles(event.dataTransfer.files);
          }}
        >
          <Upload aria-hidden="true" />
          <div>
            <b>
              {uploading ? "이미지를 업로드하는 중…" : "갤러리 이미지 추가"}
            </b>
            <span>JPG, PNG, WebP · 파일당 최대 10MB · 여러 장 선택 가능</span>
          </div>
          <button
            type="button"
            data-tour-id="gallery-upload"
            disabled={uploading}
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
              event.target.files && void uploadFiles(event.target.files)
            }
          />
        </div>

        {scope === "artist" && (
          <div className="gallery-filterbar">
            <Filter aria-hidden="true" />
            <CustomSelect
              ariaLabel="앨범 필터"
              value={albumFilter}
              onChange={setAlbumFilter}
              options={[
                { value: "all", label: "모든 앨범" },
                ...albums.map((album) => ({
                  value: album.id,
                  label: album.name,
                })),
              ]}
            />
            <CustomSelect
              ariaLabel="멤버 필터"
              value={memberFilter}
              onChange={setMemberFilter}
              options={[
                { value: "all", label: "모든 멤버" },
                ...members.map((member) => ({
                  value: member.id,
                  label: member.name,
                })),
              ]}
            />
            <span>{visibleItems.length}장</span>
          </div>
        )}

        {loading ? (
          <AdminSkeleton variant="media" className="min-h-[250px]" />
        ) : !visibleItems.length ? (
          <div className="gallery-empty">
            <ImagePlus aria-hidden="true" />
            <b>등록된 이미지가 없습니다.</b>
            <span>위 영역에 이미지를 드롭해 첫 갤러리를 만드세요.</span>
          </div>
        ) : (
          <div
            className={`gallery-contact-sheet ${selectedItem ? "has-inspector" : ""}`}
          >
            <div className="gallery-grid">
              {visibleItems.map((item) => {
                const itemAlbum = albumName(item.album_id);
                const itemMember = memberName(item.member_id);
                return (
                  <button
                    type="button"
                    className={`gallery-tile ${selectedItem?.id === item.id ? "is-selected" : ""}`}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    aria-label={`${item.caption || "갤러리 이미지"} 편집`}
                  >
                    <AdminAssetImage
                      src={item.image_url}
                      alt={item.caption || "갤러리 이미지"}
                      sizes="180px"
                    />
                    <span
                      className={`gallery-tile-status ${item.is_published ? "is-live" : ""}`}
                      aria-label={item.is_published ? "공개" : "비공개"}
                    />
                    {selectedItem?.id === item.id && (
                      <span className="gallery-tile-check">
                        <Check aria-hidden="true" />
                      </span>
                    )}
                    <span className="gallery-tile-overlay">
                      <b>{item.caption || "이름 없는 이미지"}</b>
                      {(itemAlbum || itemMember) && (
                        <small>
                          {[itemAlbum, itemMember].filter(Boolean).join(" · ")}
                        </small>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedItem && (
              <aside className="gallery-inspector">
                <div className="gallery-inspector-heading">
                  <div>
                    <span>선택한 이미지</span>
                    <b>{selectedItem.caption || "이름 없는 이미지"}</b>
                  </div>
                  <button
                    type="button"
                    aria-label="이미지 편집 닫기"
                    onClick={() => setSelectedId(null)}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
                <div className="gallery-inspector-preview">
                  <AdminAssetImage
                    src={selectedItem.image_url}
                    alt={selectedItem.caption || "갤러리 이미지"}
                    sizes="420px"
                  />
                </div>
                <div className="gallery-inspector-fields">
                  <label className="music-field">
                    <span>이미지 이름</span>
                    <input
                      className="admin-input"
                      value={selectedItem.caption}
                      onChange={(event) =>
                        patchItem(selectedItem.id, {
                          caption: event.target.value,
                        })
                      }
                      placeholder="촬영명 또는 이미지 설명"
                    />
                  </label>
                  {scope !== "album" && (
                    <div className="music-field">
                      <span>앨범</span>
                      <CustomSelect
                        ariaLabel="앨범 지정"
                        value={selectedItem.album_id || ""}
                        onChange={(value) =>
                          patchItem(selectedItem.id, {
                            album_id: value || null,
                          })
                        }
                        options={[
                          { value: "", label: "앨범 미지정" },
                          ...albums.map((album) => ({
                            value: album.id,
                            label: album.name,
                          })),
                        ]}
                      />
                    </div>
                  )}
                  {scope !== "member" && (
                    <div className="music-field">
                      <span>멤버</span>
                      <CustomSelect
                        ariaLabel="멤버 지정"
                        value={selectedItem.member_id || ""}
                        onChange={(value) =>
                          patchItem(selectedItem.id, {
                            member_id: value || null,
                          })
                        }
                        options={[
                          { value: "", label: "멤버 미지정" },
                          ...members.map((member) => ({
                            value: member.id,
                            label: member.name,
                          })),
                        ]}
                      />
                    </div>
                  )}
                  <label className="gallery-publish-toggle">
                    <input
                      type="checkbox"
                      checked={selectedItem.is_published}
                      onChange={(event) =>
                        patchItem(selectedItem.id, {
                          is_published: event.target.checked,
                        })
                      }
                    />
                    <span>공개 갤러리에 표시</span>
                  </label>
                </div>
                <div className="gallery-inspector-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    aria-label="맨 앞으로"
                    title="맨 앞으로"
                    onClick={() => moveItem(selectedItem.id, "first")}
                    disabled={items[0]?.id === selectedItem.id}
                  >
                    <ArrowUpToLine aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    aria-label="맨 뒤로"
                    title="맨 뒤로"
                    onClick={() => moveItem(selectedItem.id, "last")}
                    disabled={items.at(-1)?.id === selectedItem.id}
                  >
                    <ArrowDownToLine aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    data-tour-id="gallery-delete"
                    className="gallery-delete-button"
                    onClick={() => setDeleteItem(selectedItem)}
                  >
                    <Trash2 aria-hidden="true" />
                    삭제
                  </button>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
      {deleteItem && (
        <DeleteConfirmDialog
          title="갤러리 이미지를 삭제할까요?"
          description="상단 저장 시 이미지 파일과 분류 정보가 함께 삭제됩니다."
          confirmValue={deleteName}
          valueLabel="이미지 이름"
          busy={false}
          onCancel={() => setDeleteItem(null)}
          onConfirm={removeItem}
        />
      )}
    </>
  );
}
