import type { Metadata } from "next";

export const SITE_NAME = "THE MUZE";
export const SITE_DESCRIPTION =
  "Artists, music, auditions and news from THE MUZE Entertainment.";

export function createPageMetadata(
  title: string,
  description = SITE_DESCRIPTION,
): Metadata {
  return {
    title,
    description,
    openGraph: { title: `${title} | ${SITE_NAME}`, description },
  };
}

export function createPrivatePageMetadata(title: string): Metadata {
  return {
    ...createPageMetadata(title),
    robots: { index: false, follow: false },
  };
}
