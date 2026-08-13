import { redirect } from "next/navigation";
import AccountClient, { type AvatarArtistOption } from "./AccountClient";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createPrivatePageMetadata } from "@/core/seo/metadata";
import { getPublicAssetUrl } from "@/core/storage/public-url";

export const metadata = createPrivatePageMetadata("Account");

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const [{ data: profile }, { data: artists }, { data: avatarAssets }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("name,avatar_asset_id")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("artists")
        .select("id,name,eng_name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("avatar_assets")
        .select("id,artist_id,image_path,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

  const assets = (avatarAssets ?? []).map((asset) => ({
    id: asset.id,
    artistId: asset.artist_id,
    imageUrl: getPublicAssetUrl("artist-assets", asset.image_path),
  }));
  const avatarArtists: AvatarArtistOption[] = (artists ?? []).flatMap(
    (artist) => {
      const artistAssets = assets.filter(
        (asset) => asset.artistId === artist.id,
      );
      return artistAssets.length
        ? [
            {
              id: artist.id,
              name: artist.eng_name || artist.name,
              avatars: artistAssets.map(({ id, imageUrl }) => ({
                id,
                imageUrl,
              })),
            },
          ]
        : [];
    },
  );
  const availableAvatarIds = new Set(
    avatarArtists.flatMap((artist) =>
      artist.avatars.map((avatar) => avatar.id),
    ),
  );

  return (
    <AccountClient
      initialName={profile?.name || user.user_metadata?.name || ""}
      initialEmail={user.email || ""}
      initialAvatarAssetId={
        profile?.avatar_asset_id &&
        availableAvatarIds.has(profile.avatar_asset_id)
          ? profile.avatar_asset_id
          : null
      }
      avatarArtists={avatarArtists}
      canChangePassword={
        user.identities?.some((identity) => identity.provider === "email") ??
        false
      }
    />
  );
}
