import type { IconType } from "react-icons";
import { LuGlobe, LuLink, LuUsers } from "react-icons/lu";
import {
  SiApplemusic,
  SiFacebook,
  SiInstagram,
  SiSoundcloud,
  SiSpotify,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";

export const SOCIAL_ICONS: Record<string, IconType> = {
  instagram: SiInstagram,
  youtube: SiYoutube,
  x: SiX,
  twitter: SiX,
  tiktok: SiTiktok,
  spotify: SiSpotify,
  weverse: LuUsers,
  facebook: SiFacebook,
  soundcloud: SiSoundcloud,
  "apple-music": SiApplemusic,
  homepage: LuGlobe,
  other: LuLink,
};

export const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  twitter: "X",
  tiktok: "TikTok",
  spotify: "Spotify",
  weverse: "Weverse",
  facebook: "Facebook",
  soundcloud: "SoundCloud",
  "apple-music": "Apple Music",
  homepage: "Official website",
  other: "Official link",
};
