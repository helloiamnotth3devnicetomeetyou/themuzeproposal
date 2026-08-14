"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { supabase } from "@/core/supabase/client";
import { toWebP } from "@/admin/utils/image-convert";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import {
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { registerPageDraft } from "@/admin/hooks/usePageDrafts";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import { adminDbError } from "@/admin/utils/admin-db-error";
import type {
  GalleryItem,
  GalleryManagerProps,
  LookupItem,
} from "./gallery-manager-types";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadedAsset = {
  bucket: "artist-assets";
  path: string;
  url: string;
};

export type GalleryManagerState = {
  inputRef: RefObject<HTMLInputElement | null>;
  items: GalleryItem[];
  visibleItems: GalleryItem[];
  selectedItem: GalleryItem | null;
  albums: LookupItem[];
  members: LookupItem[];
  albumFilter: string;
  memberFilter: string;
  loading: boolean;
  schemaMissing: boolean;
  uploading: boolean;
  dragging: boolean;
  deleteItem: GalleryItem | null;
  deleteName: string;
  recovery: { draft: GalleryItem[]; updatedAt: number } | null;
  restoreBackup: () => void;
  discardBackup: () => void;
  setAlbumFilter: Dispatch<SetStateAction<string>>;
  setMemberFilter: Dispatch<SetStateAction<string>>;
  setDragging: Dispatch<SetStateAction<boolean>>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  setDeleteItem: Dispatch<SetStateAction<GalleryItem | null>>;
  uploadFiles: (fileList: FileList | File[]) => Promise<void>;
  patchItem: (id: string, patch: Partial<GalleryItem>) => void;
  moveItem: (id: string, to: "first" | "last") => void;
  removeItem: () => void;
};

export function useGalleryManager({
  artistId,
  scope,
  albumId,
  memberId,
  onError,
  onToast,
}: GalleryManagerProps): GalleryManagerState {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [snapshot, setSnapshot] = useState<GalleryItem[]>([]);
  const [artistUpdatedAt, setArtistUpdatedAt] = useState<string | null>(null);
  const uploadedAssets = useRef<UploadedAsset[]>([]);
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
  const loadVersion = useRef(0);

  const loadGallery = useCallback(async () => {
    const version = ++loadVersion.current;
    if (!artistId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [albumResult, memberResult, artistResult] = await Promise.all([
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
      supabase.from("artists").select("updated_at").eq("id", artistId).single(),
    ]);
    if (version !== loadVersion.current) return;
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
    setArtistUpdatedAt(artistResult.data?.updated_at ?? null);

    let query = supabase
      .from("artist_gallery")
      .select("*")
      .eq("artist_id", artistId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (scope === "album" && albumId) query = query.eq("album_id", albumId);
    if (scope === "member" && memberId) query = query.eq("member_id", memberId);
    const { data, error } = await query;
    if (version !== loadVersion.current) return;
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
        const { data, error } = await supabase.rpc(
          "save_artist_gallery_checked",
          {
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
            p_expected_updated_at: artistUpdatedAt,
          },
        );
        if (error) {
          if (error.code === "P0003") await loadGallery();
          throw error;
        }
        setArtistUpdatedAt(data);
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
      artistContent: {
        artistId,
        expectedUpdatedAt: artistUpdatedAt,
        gallery: {
          items: items.map((item) => ({
            id: item.id,
            artist_id: item.artist_id,
            album_id: item.album_id,
            member_id: item.member_id,
            image_url: item.image_url,
            caption: item.caption,
            sort_order: item.sort_order,
            is_published: item.is_published,
          })),
          removedIds: snapshot
            .filter((item) => !items.some((current) => current.id === item.id))
            .map((item) => item.id),
        },
        committed: async (updatedAt) => {
          const removed = snapshot.filter(
            (item) => !items.some((current) => current.id === item.id),
          );
          setArtistUpdatedAt(updatedAt);
          await finalizeDraftImageAssets(
            supabase,
            uploadedAssets.current,
            items.map((item) => item.image_url),
            removed.map((item) => item.image_url),
          );
          uploadedAssets.current = [];
          setSnapshot(items);
          discardBackup();
          onToast("Gallery changes saved.");
        },
      },
    });
  }, [
    artistId,
    artistUpdatedAt,
    backupKey,
    dirty,
    discardBackup,
    items,
    loadGallery,
    onToast,
    snapshot,
  ]);

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

  return {
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
  };
}
