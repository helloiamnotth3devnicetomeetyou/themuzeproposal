import { Globe, Link, Music2, Users } from "lucide-react";
import type { SVGProps } from "react";

export function SocialIcon({ platform, ...props }: SVGProps<SVGSVGElement> & { platform: string }) {
  const path = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>,
    youtube: <><path fill="currentColor" stroke="none" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z" /><path fill="var(--bg-input)" stroke="none" d="m9.6 15.8 6.2-3.8-6.2-3.8v7.6Z" /></>,
    x: <path fill="currentColor" stroke="none" d="M14.2 10.2 23 0h-2.1l-7.6 8.8L7.3 0H.3l9.2 13.3L.3 24h2.1l8-9.3 6.4 9.3h7L14.2 10.2Zm-2.8 3.3L3.1 1.6h3.2l14.6 20.8h-3.2L11.4 13.5Z" />,
    tiktok: <path fill="currentColor" stroke="none" d="M12.5 0h3.9c.1 3.2 2.2 5.7 6 6v4c-2.1 0-4-.6-5.8-1.8v8.6c0 4.2-3.4 7.2-7.3 7.2-4.3 0-7.7-3.4-7.7-7.7 0-4.6 4-8 8.6-7.3v4.4c-1.9-.6-4 .8-4 2.8 0 1.9 1.6 3.4 3.5 3.3 2.1 0 2.8-1.6 2.8-3.3V0Z" />,
    spotify: <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><path d="M6.7 9.8c3.5-1 7.3-.6 10.4 1M7.3 13c3-.8 6.3-.5 9 1M8 16c2.5-.6 5.1-.3 7.2.9" stroke="var(--bg-input)" strokeWidth="1.5" strokeLinecap="round" /></>,
    facebook: <path fill="currentColor" stroke="none" d="M13.5 23.9v-8.2h3.2l.7-3.7h-3.9v-1.3c0-1.5.5-2.6 2.7-2.6h1.9V4.8c-.3 0-1.5-.3-3-.3-3.1 0-5.2 1.9-5.2 5.4v2.1H6.6v3.7h3.3v8a12 12 0 1 1 3.6.2Z" />,
    soundcloud: <path fill="currentColor" stroke="none" d="M20.6 10.8a5.5 5.5 0 0 0-10.8-1.3v7.8h10.8a3.2 3.2 0 0 0 0-6.5ZM7.8 10.2v7.1H6.6v-6.5l1.2-.6Zm-3.1 1.5v5.6H3.5v-5.1l1.2-.5Zm-3.1 1.7v3.9H.5V14l1.1-.6Z" />,
    "apple-music": <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><path d="M15.5 6.8v8.1a2.3 2.3 0 1 1-1.2-2v-5l-5.1 1.2v7.1a2.3 2.3 0 1 1-1.2-2V8.1l7.5-1.7Z" fill="var(--bg-input)" stroke="none" /></>,
  }[platform];

  if (!path) {
    const Fallback = platform === "weverse" ? Users : platform === "homepage" ? Globe : platform === "other" ? Link : Music2;
    return <Fallback {...props} />;
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>{path}</svg>;
}
