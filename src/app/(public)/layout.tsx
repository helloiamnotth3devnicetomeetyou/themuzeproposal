import MainLayout from "@/public/components/layout/SiteLayout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
