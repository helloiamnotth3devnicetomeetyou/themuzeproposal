"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Crop,
  ImagePlus,
  Trash2,
  Upload,
} from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import CustomSelect from "@/core/components/form/CustomSelect";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import { deleteAdminAssets } from "@/admin/utils/delete-admin-assets";
import {
  cropSquareImage,
  getSquareCrop,
} from "@/admin/utils/square-image-crop";
import {
  cleanupAbandonedDraftImageAssets,
  discardDraftImageAssets,
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import { supabase } from "@/core/supabase/client";
import { registerPageDraft } from "@/admin/hooks/usePageDrafts";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";

type ArtistOption = { id: string; name: string; eng_name: string | null };
type AvatarAsset = {
  id: string;
  artist_id: string;
  image_path: string;
  sort_order: number;
  is_active: boolean;
};
type CropQueue = { files: File[]; index: number; cropped: File[] };

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const serialize = (items: AvatarAsset[]) =>
  JSON.stringify(
    items.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    })),
  );

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
  const inputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const uploadedAssets = useRef<UploadedImageAsset[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [artistId, setArtistId] = useState("");
  const [items, setItems] = useState<AvatarAsset[]>([]);
  const [snapshot, setSnapshot] = useState<AvatarAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AvatarAsset | null>(null);
  const [cropQueue, setCropQueue] = useState<CropQueue | null>(null);
  const [cropReady, setCropReady] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  const dirty = serialize(items) !== serialize(snapshot);
  const publicUrl = useCallback(
    (path: string) => getPublicAssetUrl("artist-assets", path),
    [],
  );
  const backupKey = `admin-draft:avatar-assets:${artistId || "none"}`;
  const restoreItems = useCallback(
    (saved: AvatarAsset[]) => {
      const persistedPaths = new Set(snapshot.map((item) => item.image_path));
      uploadedAssets.current = saved
        .filter((item) => !persistedPaths.has(item.image_path))
        .map((item) => ({
          bucket: "artist-assets",
          path: item.image_path,
          url: publicUrl(item.image_path),
        }));
      setItems(saved);
    },
    [publicUrl, snapshot],
  );
  const { recovery, restoreBackup, discardBackup } = useDraftBackup({
    key: backupKey,
    draft: items,
    snapshot: serialize(snapshot),
    dirty,
    restore: restoreItems,
  });

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    void cleanupAbandonedDraftImageAssets(supabase);
  }, []);
  useEffect(() => {
    const confirmLeave = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [dirty]);

  const loadAssets = useCallback(
    async (nextArtistId: string) => {
      if (!nextArtistId) {
        setItems([]);
        setSnapshot([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("avatar_assets")
        .select("id,artist_id,image_path,sort_order,is_active")
        .eq("artist_id", nextArtistId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      setLoading(false);
      if (error) return onError(error.message);
      const nextItems = (data ?? []) as AvatarAsset[];
      setItems(nextItems);
      setSnapshot(nextItems);
    },
    [onError],
  );

  useEffect(() => {
    let mounted = true;
    void supabase
      .from("artists")
      .select("id,name,eng_name")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setLoading(false);
          onError(error.message);
          return;
        }
        const nextArtists = (data ?? []) as ArtistOption[];
        const firstArtistId = nextArtists[0]?.id ?? "";
        setArtists(nextArtists);
        setArtistId(firstArtistId);
        void loadAssets(firstArtistId);
      });
    return () => {
      mounted = false;
    };
  }, [loadAssets, onError]);

  const selectArtist = async (nextArtistId: string) => {
    if (nextArtistId === artistId) return;
    if (
      dirty &&
      !window.confirm(
        "저장하지 않은 아바타 변경사항을 버리고 아티스트를 변경할까요?",
      )
    )
      return;
    if (uploadedAssets.current.length) {
      await discardDraftImageAssets(supabase, uploadedAssets.current);
      uploadedAssets.current = [];
    }
    setArtistId(nextArtistId);
    await loadAssets(nextArtistId);
  };

  const uploadFiles = async (selected: File[]) => {
    if (!selected.length) return;
    setUploading(true);
    onError("");
    try {
      const additions: AvatarAsset[] = [];
      for (const file of selected) {
        const asset = await uploadAdminAsset(
          "artist-assets",
          `${artistId}/avatars/${crypto.randomUUID()}.webp`,
          file,
        );
        uploadedAssets.current.push(asset);
        trackDraftImageAsset(asset);
        additions.push({
          id: crypto.randomUUID(),
          artist_id: artistId,
          image_path: asset.path,
          sort_order: items.length + additions.length + 1,
          is_active: true,
        });
      }
      setItems((current) => [...current, ...additions]);
      onToast(
        `${additions.length}개의 정사각형 아바타를 임시 목록에 추가했습니다. 저장하면 반영됩니다.`,
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "아바타를 업로드하지 못했습니다.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const selectFiles = (files: FileList | File[]) => {
    if (!artistId) return onError("아티스트를 먼저 선택해 주세요.");
    const selected = Array.from(files);
    const invalid = selected.find(
      (file) => !ACCEPTED_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid)
      return onError(
        `${invalid.name}: JPG, PNG, WebP 파일만 10MB까지 업로드할 수 있습니다.`,
      );
    if (!selected.length) return;
    onError("");
    cropImageRef.current = null;
    setCropReady(false);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setCropQueue({ files: selected, index: 0, cropped: [] });
  };

  const closeCrop = () => {
    setCropQueue(null);
    setCropReady(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const confirmCrop = async () => {
    if (!cropQueue || !cropImageRef.current) return;
    const cropped = [
      ...cropQueue.cropped,
      await cropSquareImage(
        cropImageRef.current,
        cropQueue.files[cropQueue.index].name,
        cropZoom,
        cropX,
        cropY,
      ),
    ];
    if (cropQueue.index < cropQueue.files.length - 1) {
      cropImageRef.current = null;
      setCropReady(false);
      setCropZoom(1);
      setCropX(0);
      setCropY(0);
      setCropQueue({ ...cropQueue, index: cropQueue.index + 1, cropped });
      return;
    }
    closeCrop();
    await uploadFiles(cropped);
  };

  useEffect(() => {
    const file = cropQueue?.files[cropQueue.index];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      cropImageRef.current = image;
      setCropReady(true);
    };
    image.onerror = () => {
      onError("이미지를 읽을 수 없습니다.");
      closeCrop();
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [cropQueue?.files, cropQueue?.index, onError]);

  useEffect(() => {
    const canvas = cropCanvasRef.current;
    const image = cropImageRef.current;
    if (!canvas || !image || !cropReady) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const crop = getSquareCrop(
      image.naturalWidth,
      image.naturalHeight,
      cropZoom,
      cropX,
      cropY,
    );
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [cropReady, cropX, cropY, cropZoom]);

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, position) => ({
        ...item,
        sort_order: position + 1,
      }));
    });
  };

  const removeItem = async () => {
    if (!deleteItem) return;
    const queued = uploadedAssets.current.find(
      (asset) => asset.path === deleteItem.image_path,
    );
    if (queued) {
      await discardDraftImageAssets(supabase, [queued]);
      uploadedAssets.current = uploadedAssets.current.filter(
        (asset) => asset.path !== queued.path,
      );
    }
    setItems((current) =>
      current
        .filter((item) => item.id !== deleteItem.id)
        .map((item, index) => ({ ...item, sort_order: index + 1 })),
    );
    setDeleteItem(null);
  };

  const commitAssets = useCallback(async () => {
    if (!artistId || !dirty) return;
    onError("");
    const removed = snapshot.filter(
      (item) => !items.some((current) => current.id === item.id),
    );
    const payload = items.map((item, index) => ({
      id: item.id,
      image_path: item.image_path,
      sort_order: index + 1,
      is_active: item.is_active,
    }));
    const { error } = await supabase.rpc("save_avatar_assets", {
      p_artist_id: artistId,
      p_items: payload,
      p_delete_ids: removed.map((item) => item.id),
    });
    if (error) {
      onError(error.message);
      throw error;
    }

    if (removed.length)
      await deleteAdminAssets(
        "artist-assets",
        removed.map((item) => item.image_path),
      );
    const currentPaths = new Set(items.map((item) => item.image_path));
    await finalizeDraftImageAssets(
      supabase,
      uploadedAssets.current,
      uploadedAssets.current
        .filter((asset) => currentPaths.has(asset.path))
        .map((asset) => asset.url),
      [],
    );
    uploadedAssets.current = [];
    await loadAssets(artistId);
    discardBackup();
    onToast("사용자 아바타 설정을 저장했습니다.");
  }, [
    artistId,
    dirty,
    discardBackup,
    items,
    loadAssets,
    onError,
    onToast,
    snapshot,
  ]);

  useEffect(() => {
    if (!dirty || !artistId) return;
    const removedCount = snapshot.filter(
      (item) => !items.some((current) => current.id === item.id),
    ).length;
    const addedCount = items.filter(
      (item) => !snapshot.some((current) => current.id === item.id),
    ).length;
    return registerPageDraft(backupKey, {
      diff: [
        {
          kind: addedCount ? "add" : removedCount ? "delete" : "order",
          field: "사용자 아바타",
          before: `${snapshot.length}개`,
          after: `${items.length}개`,
        },
      ],
      commit: commitAssets,
    });
  }, [artistId, backupKey, commitAssets, dirty, items, snapshot]);

  const selectedArtist = useMemo(
    () => artists.find((artist) => artist.id === artistId),
    [artistId, artists],
  );

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
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, is_active: event.target.checked }
                            : entry,
                        ),
                      )
                    }
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
