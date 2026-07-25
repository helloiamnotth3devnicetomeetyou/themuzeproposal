"use client";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { LuImagePlus, LuRefreshCcw, LuSave, LuTrash2, LuUpload } from "react-icons/lu";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { supabase } from "@/core/supabase/client";
import { normalizeOutline, simplifyOutline, type ArtistScene, type ScenePoint } from "@/core/utils/artist-scenes";
import styles from "@/styles/(admin)/components/scenes/ArtistSceneManager.module.css";
import SceneCanvas from "./SceneCanvas";

type MemberLookup = {
  id: string;
  name: string;
  eng_name: string | null;
  color: string | null;
  sort_order: number;
};

type Props = {
  artistId: string | null;
  heroUrl: string;
  onError: (message: string) => void;
  onToast: (message: string) => void;
};

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_SCENE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_MASK_TYPES = new Set(["image/png", "image/webp"]);
const sceneSelect = "id,artist_id,title,image_url,image_width,image_height,is_hero,is_published,sort_order,artist_scene_members(id,member_id,outline,mask_url,sort_order)";

function storagePathFromUrl(url: string) {
  const match = url.match(/\/storage\/v1\/object\/public\/artist-assets\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function imageDimensions(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await imageDimensionsFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function imageDimensionsFromUrl(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("이미지 원본 크기를 확인할 수 없습니다.");
  return { width: image.naturalWidth, height: image.naturalHeight };
}

function normalizedScene(scene: ArtistScene): ArtistScene {
  return {
    ...scene,
    artist_scene_members: (scene.artist_scene_members ?? []).map((region) => ({ ...region, outline: normalizeOutline(region.outline) })),
  };
}

export default function ArtistSceneManager({ artistId, heroUrl, onError, onToast }: Props) {
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const [scenes, setScenes] = useState<ArtistScene[]>([]);
  const [members, setMembers] = useState<MemberLookup[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draftOutline, setDraftOutline] = useState<ScenePoint[]>([]);
  const [loading, setLoading] = useState(Boolean(artistId));
  const [busy, setBusy] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);

  const load = useCallback(async (preferredSceneId?: string) => {
    if (!artistId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [sceneResult, memberResult] = await Promise.all([
      supabase.from("artist_scenes").select(sceneSelect).eq("artist_id", artistId).order("is_hero", { ascending: false }).order("sort_order", { ascending: true }).overrideTypes<ArtistScene[], { merge: false }>(),
      supabase.from("artist_members").select("id,name,eng_name,color,sort_order").eq("artist_id", artistId).order("sort_order", { ascending: true }),
    ]);
    setLoading(false);
    if (sceneResult.error) {
      const missing = sceneResult.error.message.includes("artist_scenes");
      setSchemaMissing(missing);
      onError(missing ? "인터랙티브 장면 테이블이 없습니다. 019_artist_scenes.sql을 먼저 적용하세요." : sceneResult.error.message);
      return;
    }
    setSchemaMissing(false);
    const nextScenes = (sceneResult.data ?? []).map(normalizedScene);
    setScenes(nextScenes);
    setMembers((memberResult.data as MemberLookup[] | null) ?? []);
    setSelectedSceneId((current) => {
      const candidate = preferredSceneId || current;
      return candidate && nextScenes.some((scene) => scene.id === candidate) ? candidate : nextScenes[0]?.id ?? null;
    });
  }, [artistId, onError]);

  useEffect(() => { void Promise.resolve().then(() => load()); }, [load]);

  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const selectedRegion = selectedScene?.artist_scene_members.find((region) => region.member_id === selectedMemberId) ?? null;
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const sceneRatio = selectedScene?.image_width && selectedScene.image_height ? selectedScene.image_width / selectedScene.image_height : 16 / 9;

  useEffect(() => {
    void Promise.resolve().then(() => setDraftOutline(selectedRegion?.outline ?? []));
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedMemberId && members[0]) void Promise.resolve().then(() => setSelectedMemberId(members[0].id));
  }, [members, selectedMemberId]);

  const patchScene = (patch: Partial<ArtistScene>) => {
    if (!selectedSceneId) return;
    setScenes((current) => current.map((scene) => scene.id === selectedSceneId ? { ...scene, ...patch } : scene));
  };

  const uploadScenes = async (files: FileList) => {
    if (!artistId) return;
    const list = Array.from(files);
    const invalid = list.find((file) => !ACCEPTED_SCENE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) return onError(`${invalid.name}: JPG, PNG, WebP만 가능하며 파일은 최대 20MB입니다.`);
    setBusy(true);
    onError("");
    try {
      let preferredId = "";
      for (const [index, file] of list.entries()) {
        const dimensions = await imageDimensions(file);
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${artistId}/scenes/${crypto.randomUUID()}.${extension}`;
        const upload = await supabase.storage.from("artist-assets").upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) throw upload.error;
        const publicUrl = supabase.storage.from("artist-assets").getPublicUrl(path).data.publicUrl;
        const inserted = await supabase.from("artist_scenes").insert({
          artist_id: artistId,
          title: file.name.replace(/\.[^.]+$/, ""),
          image_url: publicUrl,
          image_width: dimensions.width,
          image_height: dimensions.height,
          is_hero: scenes.length === 0 && index === 0,
          is_published: true,
          sort_order: scenes.length + index,
        }).select("id").single();
        if (inserted.error) {
          await supabase.storage.from("artist-assets").remove([path]);
          throw inserted.error;
        }
        preferredId = inserted.data.id;
      }
      await load(preferredId);
      onToast(`${list.length}개의 인터랙티브 장면을 추가했습니다.`);
    } catch (uploadError) {
      onError(uploadError instanceof Error ? uploadError.message : "장면 이미지를 업로드하지 못했습니다.");
    } finally {
      setBusy(false);
      if (sceneInputRef.current) sceneInputRef.current.value = "";
    }
  };

  const importHero = async () => {
    if (!artistId || !heroUrl) return;
    setBusy(true);
    onError("");
    try {
      const dimensions = await imageDimensionsFromUrl(heroUrl);
      const result = await supabase.from("artist_scenes").insert({
        artist_id: artistId,
        title: "Main scene",
        image_url: heroUrl,
        image_width: dimensions.width,
        image_height: dimensions.height,
        is_hero: scenes.length === 0,
        is_published: true,
        sort_order: scenes.length,
      }).select("id").single();
      if (result.error) throw result.error;
      await load(result.data.id);
      onToast("현재 대표 이미지를 인터랙티브 장면으로 가져왔습니다.");
    } catch (importError) {
      onError(importError instanceof Error ? importError.message : "대표 이미지를 가져오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const syncSceneDimensions = (width: number, height: number) => {
    if (!selectedScene || !width || !height) return;
    if (selectedScene.image_width === width && selectedScene.image_height === height) return;
    patchScene({ image_width: width, image_height: height });
    void supabase
      .from("artist_scenes")
      .update({ image_width: width, image_height: height })
      .eq("id", selectedScene.id)
      .then(({ error: dimensionError }) => {
        if (dimensionError) onError(dimensionError.message);
      });
  };

  const saveScene = async () => {
    if (!selectedScene) return;
    setBusy(true);
    onError("");
    if (selectedScene.is_hero) {
      const unsetResult = await supabase.from("artist_scenes").update({ is_hero: false }).eq("artist_id", selectedScene.artist_id).neq("id", selectedScene.id);
      if (unsetResult.error) {
        setBusy(false);
        return onError(unsetResult.error.message);
      }
    }
    const result = await supabase.from("artist_scenes").update({
      title: selectedScene.title.trim(),
      is_hero: selectedScene.is_hero,
      is_published: selectedScene.is_published,
    }).eq("id", selectedScene.id);
    setBusy(false);
    if (result.error) return onError(result.error.message);
    await load(selectedScene.id);
    onToast("장면 정보를 저장했습니다.");
  };

  const deleteScene = async () => {
    if (!selectedScene) return;
    if (!window.confirm(`'${selectedScene.title || "장면"}'을 삭제할까요?`)) return;
    setBusy(true);
    const result = await supabase.from("artist_scenes").delete().eq("id", selectedScene.id);
    if (!result.error) {
      const paths = [selectedScene.image_url, ...selectedScene.artist_scene_members.map((region) => region.mask_url).filter((url): url is string => Boolean(url))]
        .map(storagePathFromUrl)
        .filter((path): path is string => Boolean(path));
      if (paths.length) await supabase.storage.from("artist-assets").remove(paths);
    }
    setBusy(false);
    if (result.error) return onError(result.error.message);
    await load();
    onToast("장면을 삭제했습니다.");
  };

  const saveOutline = async () => {
    if (!selectedScene || !selectedMemberId || draftOutline.length < 3) return onError("멤버 외곽선을 먼저 한 바퀴 그려주세요.");
    setBusy(true);
    const result = await supabase.from("artist_scene_members").upsert({
      scene_id: selectedScene.id,
      member_id: selectedMemberId,
      outline: draftOutline,
      mask_url: selectedRegion?.mask_url || null,
      sort_order: selectedMember?.sort_order || 0,
    }, { onConflict: "scene_id,member_id" });
    setBusy(false);
    if (result.error) return onError(result.error.message);
    await load(selectedScene.id);
    onToast(`${selectedMember?.name || "멤버"} 외곽선을 저장했습니다.`);
  };

  const removeOutline = async () => {
    if (!selectedRegion || !selectedScene) {
      setDraftOutline([]);
      return;
    }
    setBusy(true);
    const result = await supabase.from("artist_scene_members").delete().eq("id", selectedRegion.id);
    if (!result.error && selectedRegion.mask_url) {
      const path = storagePathFromUrl(selectedRegion.mask_url);
      if (path) await supabase.storage.from("artist-assets").remove([path]);
    }
    setBusy(false);
    if (result.error) return onError(result.error.message);
    await load(selectedScene.id);
    onToast("멤버 외곽선을 제거했습니다.");
  };

  const uploadMask = async (file: File) => {
    if (!artistId || !selectedScene || !selectedMemberId || draftOutline.length < 3) return onError("외곽선을 먼저 저장한 뒤 정밀 마스크를 올려주세요.");
    if (!ACCEPTED_MASK_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) return onError("정밀 마스크는 투명 배경 PNG 또는 WebP, 최대 20MB입니다.");
    setBusy(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${artistId}/scene-masks/${selectedScene.id}/${selectedMemberId}.${extension}`;
    const upload = await supabase.storage.from("artist-assets").upload(path, file, { contentType: file.type, upsert: true });
    if (upload.error) {
      setBusy(false);
      return onError(upload.error.message);
    }
    const url = `${supabase.storage.from("artist-assets").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const result = await supabase.from("artist_scene_members").upsert({
      scene_id: selectedScene.id,
      member_id: selectedMemberId,
      outline: draftOutline,
      mask_url: url,
      sort_order: selectedMember?.sort_order || 0,
    }, { onConflict: "scene_id,member_id" });
    setBusy(false);
    if (result.error) return onError(result.error.message);
    await load(selectedScene.id);
    onToast("픽셀 단위 정밀 마스크를 적용했습니다.");
    if (maskInputRef.current) maskInputRef.current.value = "";
  };

  if (!artistId) return <div className={styles.empty}><LuImagePlus aria-hidden="true" /><b>아티스트를 먼저 저장하세요.</b></div>;
  if (loading) return <LoadingIndicator label="인터랙티브 장면을 불러오는 중" className="min-h-[360px]" />;
  if (schemaMissing) return <div className={styles.empty}><LuImagePlus aria-hidden="true" /><b>019_artist_scenes.sql 적용이 필요합니다.</b><span>스키마 적용 후 이 탭에서 장면과 멤버 실루엣을 편집할 수 있습니다.</span></div>;

  return (
    <div className={styles.manager}>
      <div className={styles.toolbar}>
        <div><b>Interactive scenes</b><span>장면마다 멤버 외곽선을 직접 그리고 정밀 마스크를 연결합니다.</span></div>
        {heroUrl && <button type="button" disabled={busy} onClick={() => void importHero()}><LuImagePlus aria-hidden="true" />대표 이미지 가져오기</button>}
        <button type="button" disabled={busy} onClick={() => sceneInputRef.current?.click()}><LuUpload aria-hidden="true" />장면 추가</button>
        <input ref={sceneInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => event.target.files && void uploadScenes(event.target.files)} />
      </div>

      {!scenes.length ? <div className={styles.empty}><LuImagePlus aria-hidden="true" /><b>인터랙티브 장면이 없습니다.</b><span>대표 이미지를 가져오거나 새 콘셉트 이미지를 추가하세요.</span></div> : <>
        <div className={styles.sceneTabs}>
          {scenes.map((scene) => <button type="button" key={scene.id} className={scene.id === selectedSceneId ? styles.isSelected : ""} onClick={() => setSelectedSceneId(scene.id)}><img src={scene.image_url} alt="" /><span>{scene.title || "이름 없는 장면"}</span>{scene.is_hero && <i>HERO</i>}</button>)}
        </div>

        {selectedScene && <div className={styles.sceneSettings}>
          <label><span>장면 이름</span><input className="admin-input" value={selectedScene.title} onChange={(event) => patchScene({ title: event.target.value })} /></label>
          <label className={styles.toggle}><input type="checkbox" checked={selectedScene.is_hero} onChange={(event) => patchScene({ is_hero: event.target.checked })} /><span>대표 장면</span></label>
          <label className={styles.toggle}><input type="checkbox" checked={selectedScene.is_published} onChange={(event) => patchScene({ is_published: event.target.checked })} /><span>공개</span></label>
          <button type="button" className={styles.danger} disabled={busy} onClick={() => void deleteScene()}><LuTrash2 aria-hidden="true" />삭제</button>
          <button type="button" disabled={busy} onClick={() => void saveScene()}><LuSave aria-hidden="true" />장면 저장</button>
        </div>}

        {selectedScene && <div className={styles.editor}>
          <div className={styles.memberPicker}>
            <span>외곽선을 그릴 멤버</span>
            <div>{members.map((member) => {
              const hasRegion = selectedScene.artist_scene_members.some((region) => region.member_id === member.id);
              return <button type="button" key={member.id} className={member.id === selectedMemberId ? styles.isSelected : ""} onClick={() => setSelectedMemberId(member.id)}><i style={{ background: member.color || BRAND_PINK_HEX }} />{member.eng_name || member.name}{hasRegion && <small>완료</small>}</button>;
            })}</div>
          </div>

          <SceneCanvas
            selectedScene={selectedScene}
            selectedMemberId={selectedMemberId}
            draftOutline={draftOutline}
            setDraftOutline={setDraftOutline}
            drawingRef={drawingRef}
            syncSceneDimensions={syncSceneDimensions}
            simplifyOutline={simplifyOutline}
            sceneRatio={sceneRatio}
          />

          <aside className={styles.outlineTools}>
            <div><span>선택 멤버</span><b>{selectedMember?.eng_name || selectedMember?.name || "멤버 선택"}</b><small>{draftOutline.length ? `${draftOutline.length}개 윤곽 포인트` : "아직 외곽선이 없습니다."}</small></div>
            <button type="button" disabled={!draftOutline.length || busy} onClick={() => setDraftOutline([])}><LuRefreshCcw aria-hidden="true" />다시 그리기</button>
            <button type="button" disabled={draftOutline.length < 3 || busy} onClick={() => void saveOutline()}><LuSave aria-hidden="true" />외곽선 저장</button>
            <button type="button" disabled={draftOutline.length < 3 || busy} onClick={() => maskInputRef.current?.click()}><LuUpload aria-hidden="true" />정밀 마스크 덮어쓰기</button>
            <input ref={maskInputRef} type="file" accept="image/png,image/webp" hidden onChange={(event) => event.target.files?.[0] && void uploadMask(event.target.files[0])} />
            {selectedRegion?.mask_url && <p>알파 마스크 적용됨</p>}
            <button type="button" className={styles.danger} disabled={busy || (!draftOutline.length && !selectedRegion)} onClick={() => void removeOutline()}><LuTrash2 aria-hidden="true" />멤버 영역 제거</button>
          </aside>
        </div>}
      </>}
    </div>
  );
}
