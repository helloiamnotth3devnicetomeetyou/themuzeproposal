"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { supabase } from "@/core/supabase/client";
import { toWebP } from "@/admin/utils/image-convert";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import {
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { registerPageDraft } from "@/admin/hooks/usePageDrafts";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import AdminAssetImage from "./AdminAssetImage";
import { adminDbError } from "@/admin/utils/admin-db-error";

type GalleryScope = "artist" | "album" | "member";

type LookupItem = {
  id: string;
  name: string;
};

type GalleryItem = {
  id: string;
  artist_id: string;
  album_id: string | null;
  member_id: string | null;
  image_url: string;
  caption: string;
  sort_order: number;
  is_published: boolean;
};

type GalleryManagerProps = {
  artistId: string | null;
  scope: GalleryScope;
  albumId?: string | null;
  memberId?: string | null;
  onError: (message: string) => void;
  onToast: (message: string) => void;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function GalleryManager({
  artistId,
  scope,
  albumId,
  memberId,
  onError,
  onToast,
}: GalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [snapshot, setSnapshot] = useState<GalleryItem[]>([]);
  const uploadedAssets = useRef<
    { bucket: "artist-assets"; path: string; url: string }[]
  >([]);
  const [albums, setAlbums] = useState<LookupItem[]>([]);
  const [members, setMembers] = useState<LookupItem[]>([]);
  const [albumFilter, setAlbumFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [loading, setLoading] = useState(Boolean(artistId));
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<GalleryItem | null>(null);

  const loadGallery = useCallback(async () => {
    if (!artistId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [albumResult, memberResult] = await Promise.all([
      supabase
        .from("albums")
        .select("id,title")
        .eq("artist_id", artistId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("artist_members")
        .select("id,name")
        .eq("artist_id", artistId)
        .order("sort_order", { ascending: true }),
    ]);
    setAlbums(
      (albumResult.data ?? []).map((album) => ({
        id: album.id,
        name: album.title,
      })),
    );
    setMembers(
      (memberResult.data ?? []).map((member) => ({
        id: member.id,
        name: member.name,
      })),
    );

    let query = supabase
      .from("artist_gallery")
      .select("*")
      .eq("artist_id", artistId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (scope === "album" && albumId) query = query.eq("album_id", albumId);
    if (scope === "member" && memberId) query = query.eq("member_id", memberId);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setSchemaMissing(
        /artist_gallery|schema cache|does not exist/i.test(error.message),
      );
      onError(
        adminDbError(
          error,
          "갤러리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
      return;
    }
    setSchemaMissing(false);
    const nextItems = (data as GalleryItem[] | null) ?? [];
    setItems(nextItems);
    setSnapshot(nextItems);
    setSelectedId((current) =>
      current && nextItems.some((item) => item.id === current)
        ? current
        : (nextItems[0]?.id ?? null),
    );
  }, [albumId, artistId, memberId, onError, scope]);

  useEffect(() => {
    void Promise.resolve().then(loadGallery);
  }, [loadGallery]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const albumMatch =
          albumFilter === "all" || item.album_id === albumFilter;
        const memberMatch =
          memberFilter === "all" || item.member_id === memberFilter;
        return albumMatch && memberMatch;
      }),
    [albumFilter, items, memberFilter],
  );
  const selectedItem = selectedId
    ? (visibleItems.find((item) => item.id === selectedId) ?? null)
    : null;
  const dirty = JSON.stringify(items) !== JSON.stringify(snapshot);
  const restoreItems = useCallback(
    (saved: GalleryItem[]) => setItems(saved),
    [],
  );
  const backupKey = `admin-draft:gallery:${scope}:${artistId}:${albumId || memberId || "all"}`;
  const { recovery, restoreBackup, discardBackup } = useDraftBackup({
    key: backupKey,
    draft: items,
    snapshot: JSON.stringify(snapshot),
    dirty,
    restore: restoreItems,
  });

  useEffect(() => {
    if (!dirty || !artistId) return;
    return registerPageDraft(backupKey, {
      diff: [
        {
          kind:
            items.length > snapshot.length
              ? "add"
              : items.length < snapshot.length
                ? "delete"
                : "change",
          field: "갤러리",
          before: `${snapshot.length}개`,
          after: `${items.length}개`,
        },
      ],
      commit: async () => {
        const removed = snapshot.filter(
          (item) => !items.some((current) => current.id === item.id),
        );
        const { error } = await supabase.rpc("save_artist_gallery", {
          p_artist_id: artistId,
          p_items: items.map((item) => ({
            id: item.id,
            artist_id: item.artist_id,
            album_id: item.album_id,
            member_id: item.member_id,
            image_url: item.image_url,
            caption: item.caption,
            sort_order: item.sort_order,
            is_published: item.is_published,
          })),
          p_removed_ids: removed.map((item) => item.id),
        });
        if (error) throw error;
        await finalizeDraftImageAssets(
          supabase,
          uploadedAssets.current,
          items.map((item) => item.image_url),
          removed.map((item) => item.image_url),
        );
        uploadedAssets.current = [];
        setSnapshot(items);
        discardBackup();
        onToast("갤러리 변경사항을 저장했습니다.");
      },
    });
  }, [artistId, backupKey, dirty, discardBackup, items, onToast, snapshot]);

  const patchItem = (id: string, patch: Partial<GalleryItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    if (!artistId)
      return onError("아티스트를 먼저 저장한 뒤 이미지를 추가하세요.");
    if (scope === "album" && !albumId)
      return onError("앨범을 먼저 저장한 뒤 갤러리를 추가하세요.");
    if (scope === "member" && !memberId)
      return onError("멤버를 먼저 저장한 뒤 갤러리를 추가하세요.");
    const files = Array.from(fileList);
    if (!files.length) return;
    const invalid = files.find(
      (file) => !ACCEPTED_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid)
      return onError(
        `${invalid.name}: JPG, PNG, WebP 파일만 가능하며 파일당 최대 10MB입니다.`,
      );

    setUploading(true);
    onError("");
    try {
      for (const [index, file] of files.entries()) {
        const converted = await toWebP(file);
        const path = `${artistId}/gallery/${crypto.randomUUID()}.webp`;
        const uploadedAsset = await uploadAdminAsset(
          "artist-assets",
          path,
          converted,
        );
        uploadedAssets.current.push({
          bucket: "artist-assets",
          path: uploadedAsset.path,
          url: uploadedAsset.url,
        });
        trackDraftImageAsset({
          bucket: "artist-assets",
          path: uploadedAsset.path,
          url: uploadedAsset.url,
        });
        setItems((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            artist_id: artistId,
            album_id: scope === "album" ? (albumId ?? null) : null,
            member_id: scope === "member" ? (memberId ?? null) : null,
            image_url: uploadedAsset.url,
            caption: "",
            sort_order: items.length + index + 1,
            is_published: true,
          },
        ]);
      }
      onToast(
        `${files.length}개의 이미지를 임시 목록에 추가했습니다. 상단 저장 시 반영됩니다.`,
      );
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "이미지를 업로드하지 못했습니다.";
      onError(
        message.includes("artist_gallery")
          ? "갤러리 테이블이 없습니다. 006_artist_gallery.sql을 먼저 적용하세요."
          : message.includes("Bucket")
            ? "이미지 저장소가 없습니다. 004_artist_assets.sql을 먼저 적용하세요."
            : message,
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const moveItem = (id: string, to: "first" | "last") => {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (!item) return current;
      const rest = current.filter((entry) => entry.id !== id);
      const ordered = to === "first" ? [item, ...rest] : [...rest, item];
      return ordered.map((entry, index) => ({
        ...entry,
        sort_order: index + 1,
      }));
    });
  };

  const removeItem = () => {
    if (!deleteItem) return;
    setItems((current) => current.filter((item) => item.id !== deleteItem.id));
    setDeleteItem(null);
    onToast(
      "갤러리 이미지를 임시 목록에서 삭제했습니다. 상단 저장 시 반영됩니다.",
    );
  };

  const albumName = (id: string | null) =>
    albums.find((album) => album.id === id)?.name;
  const memberName = (id: string | null) =>
    members.find((member) => member.id === id)?.name;
  const deleteName = deleteItem
    ? deleteItem.caption ||
      albumName(deleteItem.album_id) ||
      memberName(deleteItem.member_id) ||
      "갤러리 이미지"
    : "";

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
  if (schemaMissing)
    return (
      <div className="gallery-save-first">
        <ImagePlus aria-hidden="true" />
        <h3>갤러리 테이블 적용이 필요합니다.</h3>
        <p>마이그레이션 적용 후 이 탭을 사용할 수 있습니다.</p>
      </div>
    );

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
