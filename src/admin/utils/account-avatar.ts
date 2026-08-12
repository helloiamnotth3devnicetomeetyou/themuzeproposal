import { getPublicAssetUrl } from "@/core/storage/public-url";
import { supabase } from "@/core/supabase/client";

type ProfileAvatar = { id: string; avatar_asset_id: string | null };
type AvatarAsset = { id: string; image_path: string };

export function matchAccountAvatarPaths(profiles: ProfileAvatar[], assets: AvatarAsset[]) {
  const paths = new Map(assets.map((asset) => [asset.id, asset.image_path]));
  return Object.fromEntries(profiles.flatMap((profile) => {
    const path = profile.avatar_asset_id ? paths.get(profile.avatar_asset_id) : undefined;
    return path ? [[profile.id, path]] : [];
  }));
}

export async function loadAccountAvatarUrls(userIds: Array<string | null>) {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return {};
  const { data: profiles } = await supabase.from("profiles").select("id,avatar_asset_id").in("id", ids);
  const assetIds = (profiles ?? []).flatMap((profile) => profile.avatar_asset_id ? [profile.avatar_asset_id] : []);
  if (!assetIds.length) return {};
  const { data: assets } = await supabase.from("avatar_assets").select("id,image_path").in("id", assetIds).eq("is_active", true);
  return Object.fromEntries(Object.entries(matchAccountAvatarPaths(profiles ?? [], assets ?? [])).map(([userId, path]) => [
    userId,
    getPublicAssetUrl("artist-assets", path),
  ]));
}
