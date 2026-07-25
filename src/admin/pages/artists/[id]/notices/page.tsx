"use client";

import { useParams } from "next/navigation";
import NoticeManager from "@/admin/components/content/NoticeManager";

export default function ArtistNoticesAdmin() {
  const params = useParams<{ id: string }>();
  return <NoticeManager artistId={params.id} />;
}
