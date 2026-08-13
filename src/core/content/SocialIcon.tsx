import { Globe, Link, Music2, Users } from "lucide-react";
import type { SVGProps } from "react";
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

export function SocialIcon({ platform, ...props }: SVGProps<SVGSVGElement> & { platform: string }) {
  const Icon = {
    instagram: SiInstagram,
    youtube: SiYoutube,
    x: SiX,
    twitter: SiX,
    tiktok: SiTiktok,
    spotify: SiSpotify,
    facebook: SiFacebook,
    soundcloud: SiSoundcloud,
    "apple-music": SiApplemusic,
  }[platform];

  if (!Icon) {
    const Fallback = platform === "weverse" ? Users : platform === "homepage" ? Globe : platform === "other" ? Link : Music2;
    return <Fallback {...props} />;
  }
  return <Icon {...props} />;
}
