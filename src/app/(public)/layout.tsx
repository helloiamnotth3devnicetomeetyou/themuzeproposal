import MainLayout from "@/public/components/layout/SiteLayout";
import {
  getCachedNavigationArtists,
  getCachedSiteSettings,
} from "@/public/features/layout/server";
import type { NavigationAccount } from "@/public/components/layout/navbar-types";

const anonymousAccount: NavigationAccount = { isLoggedIn: false, isAdmin: false, avatarUrl: null, initial: "A", name: "관리자" };

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [initialArtists, initialSettings] = await Promise.all([
    getCachedNavigationArtists(),
    getCachedSiteSettings(),
  ]);

  return (
    <MainLayout
      initialArtists={initialArtists}
      initialSettings={initialSettings}
      initialAccount={anonymousAccount}
    >
      {children}
    </MainLayout>
  );
}
