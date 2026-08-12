import { getCachedNavigationArtists } from "@/public/features/layout/server";
import NotFoundClient from "./NotFoundClient";

export default async function NotFound() {
  const artists = await getCachedNavigationArtists().catch(() => []);

  const routes = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/artists", label: "Artists" },
    { path: "/notice", label: "Notice" },
    { path: "/audition", label: "Audition" },
    { path: "/protect", label: "Protect" },
    { path: "/contact", label: "Contact" },
    ...artists.flatMap((artist) => {
      const name = (artist.name_ko || artist.name || artist.slug).toUpperCase();
      return [
        { path: `/${artist.slug}/artist`, label: `${name} — Artist` },
        { path: `/${artist.slug}/discography`, label: `${name} — Discography` },
        { path: `/${artist.slug}/schedule`, label: `${name} — Schedule` },
      ];
    }),
  ];

  return <NotFoundClient routes={routes} />;
}
