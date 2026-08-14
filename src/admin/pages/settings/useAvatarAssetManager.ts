"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import { deleteAdminAssets } from "@/admin/utils/delete-admin-assets";
import {
  cleanupAbandonedDraftImageAssets,
  discardDraftImageAssets,
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import {
  cropSquareImage,
  getSquareCrop,
} from "@/admin/utils/square-image-crop";
import { registerPageDraft } from "@/admin/hooks/usePageDrafts";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import { supabase } from "@/core/supabase/client";
import {
  ACCEPTED_TYPES,
  AvatarAsset,
  ArtistOption,
  CropQueue,
  MAX_IMAGE_BYTES,
  reindexAvatarAssets,
  serializeAvatarAssets,
} from "./avatar-asset-model";

type AvatarAssetManagerOptions = {
  onDirtyChange: (dirty: boolean) => void;
  onError: (message: string) => void;
  onToast: (message: string) => void;
};

export function useAvatarAssetManager({
  onDirtyChange,
  onError,
  onToast,
}: AvatarAssetManagerOptions) {
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

  const dirty = serializeAvatarAssets(items) !== serializeAvatarAssets(snapshot);
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
    snapshot: serializeAvatarAssets(snapshot),
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
      .select("id,name,eng_name,updated_at")
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
      return reindexAvatarAssets(next);
    });
  };

  const toggleActive = (id: string, isActive: boolean) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, is_active: isActive } : item)),
    );
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
      reindexAvatarAssets(
        current.filter((item) => item.id !== deleteItem.id),
      ),
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
    const revision = artists.find((artist) => artist.id === artistId)?.updated_at;
    const { data, error } = await supabase.rpc("save_avatar_assets_checked", {
      p_artist_id: artistId,
      p_items: payload,
      p_delete_ids: removed.map((item) => item.id),
      p_expected_updated_at: revision,
    });
    if (error) {
      onError(error.message);
      throw error;
    }
    setArtists((current) => current.map((artist) => artist.id === artistId ? { ...artist, updated_at: data as string } : artist));

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
    artists,
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

  return {
    inputRef,
    cropCanvasRef,
    artists,
    artistId,
    items,
    setItems,
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
    dirty,
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
    toggleActive,
    removeItem,
  };
}
