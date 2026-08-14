import MainLayout from "@/public/components/layout/SiteLayout";
import {
  getCachedNavigationArtists,
  getCachedSiteSettings,
  anonymousNavigationAccount,
} from "@/public/features/layout/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialArtists, initialSettings] = await Promise.all([
    getCachedNavigationArtists(),
    getCachedSiteSettings(),
  ]);

  return (
    <MainLayout
      initialArtists={initialArtists}
      initialSettings={initialSettings}
      initialAccount={anonymousNavigationAccount}
    >
      {children}
    </MainLayout>
  );
}
