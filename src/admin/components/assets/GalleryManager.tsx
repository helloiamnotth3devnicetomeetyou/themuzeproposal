"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuFilter, LuImagePlus, LuSave, LuTrash2, LuUpload, LuX } from "react-icons/lu";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import LoadingIndicator from "@/components/LoadingIndicator";
import CustomSelect from "@/components/ui/CustomSelect";
import { supabase } from "@/lib/supabase";

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

function storagePathFromUrl(url: string) {
  const match = url.match(/\/storage\/v1\/object\/public\/artist-assets\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function GalleryManager({ artistId, scope, albumId, memberId, onError, onToast }: GalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<LookupItem[]>([]);
  const [members, setMembers] = useState<LookupItem[]>([]);
  const [albumFilter, setAlbumFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [loading, setLoading] = useState(Boolean(artistId));
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadGallery = useCallback(async () => {
    if (!artistId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [albumResult, memberResult] = await Promise.all([
      supabase.from("albums").select("id,title").eq("artist_id", artistId).order("sort_order", { ascending: true }),
      supabase.from("artist_members").select("id,name").eq("artist_id", artistId).order("sort_order", { ascending: true }),
    ]);
    setAlbums((albumResult.data ?? []).map((album) => ({ id: album.id, name: album.title })));
    setMembers((memberResult.data ?? []).map((member) => ({ id: member.id, name: member.name })));

    let query = supabase.from("artist_gallery").select("*").eq("artist_id", artistId).order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (scope === "album" && albumId) query = query.eq("album_id", albumId);
    if (scope === "member" && memberId) query = query.eq("member_id", memberId);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      onError(error.message.includes("artist_gallery") ? "갤러리 테이블이 없습니다. 006_artist_gallery.sql을 먼저 적용하세요." : error.message);
      return;
    }
    const nextItems = (data as GalleryItem[] | null) ?? [];
    setItems(nextItems);
    setSelectedId((current) => current && nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id ?? null);
  }, [albumId, artistId, memberId, onError, scope]);

  useEffect(() => { void Promise.resolve().then(loadGallery); }, [loadGallery]);

  const visibleItems = useMemo(() => items.filter((item) => {
    const albumMatch = albumFilter === "all" || item.album_id === albumFilter;
    const memberMatch = memberFilter === "all" || item.member_id === memberFilter;
    return albumMatch && memberMatch;
  }), [albumFilter, items, memberFilter]);
  const selectedItem = selectedId ? visibleItems.find((item) => item.id === selectedId) ?? null : null;

  const patchItem = (id: string, patch: Partial<GalleryItem>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    if (!artistId) return onError("아티스트를 먼저 저장한 뒤 이미지를 추가하세요.");
    if (scope === "album" && !albumId) return onError("앨범을 먼저 저장한 뒤 갤러리를 추가하세요.");
    if (scope === "member" && !memberId) return onError("멤버를 먼저 저장한 뒤 갤러리를 추가하세요.");
    const files = Array.from(fileList);
    if (!files.length) return;
    const invalid = files.find((file) => !ACCEPTED_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) return onError(`${invalid.name}: JPG, PNG, WebP 파일만 가능하며 파일당 최대 10MB입니다.`);

    setUploading(true);
    onError("");
    try {
      for (const [index, file] of files.entries()) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${artistId}/gallery/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("artist-assets").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("artist-assets").getPublicUrl(path);
        const { error: insertError } = await supabase.from("artist_gallery").insert({
          artist_id: artistId,
          album_id: scope === "album" ? albumId : null,
          member_id: scope === "member" ? memberId : null,
          image_url: publicUrl.publicUrl,
          caption: "",
          sort_order: items.length + index + 1,
          is_published: true,
        });
        if (insertError) {
          await supabase.storage.from("artist-assets").remove([path]);
          throw insertError;
        }
      }
      await loadGallery();
      onToast(`${files.length}개의 이미지를 추가했습니다.`);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "이미지를 업로드하지 못했습니다.";
      onError(message.includes("artist_gallery") ? "갤러리 테이블이 없습니다. 006_artist_gallery.sql을 먼저 적용하세요." : message.includes("Bucket") ? "이미지 저장소가 없습니다. 004_artist_assets.sql을 먼저 적용하세요." : message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const saveItem = async (item: GalleryItem) => {
    setSavingId(item.id);
    const { error } = await supabase.from("artist_gallery").update({
      album_id: scope === "album" ? albumId : item.album_id || null,
      member_id: scope === "member" ? memberId : item.member_id || null,
      caption: item.caption.trim(),
      is_published: item.is_published,
    }).eq("id", item.id);
    setSavingId(null);
    if (error) return onError(error.message);
    onToast("이미지 정보를 저장했습니다.");
    await loadGallery();
  };

  const removeItem = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    const { error } = await supabase.from("artist_gallery").delete().eq("id", deleteItem.id);
    if (!error) {
      const path = storagePathFromUrl(deleteItem.image_url);
      if (path) await supabase.storage.from("artist-assets").remove([path]);
    }
    setDeleting(false);
    setDeleteItem(null);
    if (error) return onError(error.message);
    onToast("갤러리 이미지를 삭제했습니다.");
    await loadGallery();
  };

  const albumName = (id: string | null) => albums.find((album) => album.id === id)?.name;
  const memberName = (id: string | null) => members.find((member) => member.id === id)?.name;
  const deleteName = deleteItem ? deleteItem.caption || albumName(deleteItem.album_id) || memberName(deleteItem.member_id) || "갤러리 이미지" : "";

  if (!artistId || (scope === "album" && !albumId) || (scope === "member" && !memberId)) {
    return <div className="gallery-save-first"><LuImagePlus aria-hidden="true" /><h3>{scope === "album" ? "앨범" : scope === "member" ? "멤버" : "아티스트"}를 먼저 저장하세요.</h3><p>저장 후 이미지를 여러 장 선택하거나 드롭해 갤러리를 만들 수 있습니다.</p></div>;
  }

  return <>
    <div className="gallery-manager">
      <div
        className={`gallery-dropzone ${dragging ? "is-dragging" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFiles(event.dataTransfer.files); }}
      >
        <LuUpload aria-hidden="true" />
        <div><b>{uploading ? "이미지를 업로드하는 중…" : "갤러리 이미지 추가"}</b><span>JPG, PNG, WebP · 파일당 최대 10MB · 여러 장 선택 가능</span></div>
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? "업로드 중" : "파일 선택"}</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => event.target.files && void uploadFiles(event.target.files)} />
      </div>

      {scope === "artist" && <div className="gallery-filterbar">
        <LuFilter aria-hidden="true" />
        <CustomSelect ariaLabel="앨범 필터" value={albumFilter} onChange={setAlbumFilter} options={[{ value: "all", label: "모든 앨범" }, ...albums.map((album) => ({ value: album.id, label: album.name }))]} />
        <CustomSelect ariaLabel="멤버 필터" value={memberFilter} onChange={setMemberFilter} options={[{ value: "all", label: "모든 멤버" }, ...members.map((member) => ({ value: member.id, label: member.name }))]} />
        <span>{visibleItems.length}장</span>
      </div>}

      {loading ? <LoadingIndicator label="갤러리를 불러오는 중…" className="min-h-[250px] rounded-[11px] border border-[var(--border-default)] bg-[var(--bg-card)]" /> : !visibleItems.length ? <div className="gallery-empty"><LuImagePlus aria-hidden="true" /><b>등록된 이미지가 없습니다.</b><span>위 영역에 이미지를 드롭해 첫 갤러리를 만드세요.</span></div> : <div className={`gallery-contact-sheet ${selectedItem ? "has-inspector" : ""}`}>
        <div className="gallery-grid">
          {visibleItems.map((item) => {
            const itemAlbum = albumName(item.album_id);
            const itemMember = memberName(item.member_id);
            return <button type="button" className={`gallery-tile ${selectedItem?.id === item.id ? "is-selected" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)} aria-label={`${item.caption || "갤러리 이미지"} 편집`}>
              <img src={item.image_url} alt={item.caption || "갤러리 이미지"} />
              <span className={`gallery-tile-status ${item.is_published ? "is-live" : ""}`} aria-label={item.is_published ? "공개" : "비공개"} />
              {selectedItem?.id === item.id && <span className="gallery-tile-check"><LuCheck aria-hidden="true" /></span>}
              <span className="gallery-tile-overlay">
                <b>{item.caption || "이름 없는 이미지"}</b>
                {(itemAlbum || itemMember) && <small>{[itemAlbum, itemMember].filter(Boolean).join(" · ")}</small>}
              </span>
            </button>;
          })}
        </div>

        {selectedItem && <aside className="gallery-inspector">
          <div className="gallery-inspector-heading"><div><span>선택한 이미지</span><b>{selectedItem.caption || "이름 없는 이미지"}</b></div><button type="button" aria-label="이미지 편집 닫기" onClick={() => setSelectedId(null)}><LuX aria-hidden="true" /></button></div>
          <div className="gallery-inspector-preview"><img src={selectedItem.image_url} alt={selectedItem.caption || "갤러리 이미지"} /></div>
          <div className="gallery-inspector-fields">
            <label className="music-field"><span>이미지 이름</span><input className="admin-input" value={selectedItem.caption} onChange={(event) => patchItem(selectedItem.id, { caption: event.target.value })} placeholder="촬영명 또는 이미지 설명" /></label>
            {scope !== "album" && <div className="music-field"><span>앨범</span><CustomSelect ariaLabel="앨범 지정" value={selectedItem.album_id || ""} onChange={(value) => patchItem(selectedItem.id, { album_id: value || null })} options={[{ value: "", label: "앨범 미지정" }, ...albums.map((album) => ({ value: album.id, label: album.name }))]} /></div>}
            {scope !== "member" && <div className="music-field"><span>멤버</span><CustomSelect ariaLabel="멤버 지정" value={selectedItem.member_id || ""} onChange={(value) => patchItem(selectedItem.id, { member_id: value || null })} options={[{ value: "", label: "멤버 미지정" }, ...members.map((member) => ({ value: member.id, label: member.name }))]} /></div>}
            <label className="gallery-publish-toggle"><input type="checkbox" checked={selectedItem.is_published} onChange={(event) => patchItem(selectedItem.id, { is_published: event.target.checked })} /><span>공개 갤러리에 표시</span></label>
          </div>
          <div className="gallery-inspector-actions"><button type="button" className="gallery-delete-button" onClick={() => setDeleteItem(selectedItem)}><LuTrash2 aria-hidden="true" />삭제</button><button type="button" className="admin-btn admin-btn-primary" disabled={savingId === selectedItem.id} onClick={() => void saveItem(selectedItem)}><LuSave aria-hidden="true" />{savingId === selectedItem.id ? "저장 중" : "정보 저장"}</button></div>
        </aside>}
      </div>}
    </div>
    {deleteItem && <DeleteConfirmDialog title="갤러리 이미지를 삭제할까요?" description="이미지 파일과 분류 정보가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다." confirmValue={deleteName} valueLabel="이미지 이름" busy={deleting} onCancel={() => setDeleteItem(null)} onConfirm={() => void removeItem()} />}
  </>;
}
