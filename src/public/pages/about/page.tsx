import { loadPublicNotices } from "@/public/features/notices/server";
import AboutClient from "./AboutClient";

export default async function About() {
  const { data } = await loadPublicNotices();
  return <AboutClient initialNotices={data?.notices.slice(0, 3) ?? []} />;
}
