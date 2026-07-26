import { draftMode } from "next/headers";
import MainLayout from "@/public/components/layout/SiteLayout";
import {
  getCachedNavigationArtists,
  getCachedSiteSettings,
} from "@/public/features/layout/server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [{ isEnabled }, initialArtists, initialSettings] = await Promise.all([
    draftMode(),
    getCachedNavigationArtists(),
    getCachedSiteSettings(),
  ]);

  return (
    <MainLayout
      draftModeEnabled={isEnabled}
      initialArtists={initialArtists}
      initialSettings={initialSettings}
    >
      {children}
    </MainLayout>
  );
}
