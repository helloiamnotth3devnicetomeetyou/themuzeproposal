import MainLayout from "@/public/components/layout/SiteLayout";
import {
  getCachedNavigationArtists,
  getCachedSiteSettings,
  getNavigationAccount,
} from "@/public/features/layout/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialArtists, initialSettings, initialAccount] = await Promise.all([
    getCachedNavigationArtists(),
    getCachedSiteSettings(),
    getNavigationAccount(),
  ]);

  return (
    <MainLayout
      initialArtists={initialArtists}
      initialSettings={initialSettings}
      initialAccount={initialAccount}
    >
      {children}
    </MainLayout>
  );
}
