import { draftMode } from "next/headers";
import MainLayout from "@/public/components/layout/SiteLayout";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode();
  return <MainLayout draftModeEnabled={isEnabled}>{children}</MainLayout>;
}
