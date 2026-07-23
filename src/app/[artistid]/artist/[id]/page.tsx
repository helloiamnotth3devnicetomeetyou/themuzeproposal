"use client";

import { useParams } from "next/navigation";
import ArtistSceneExperience from "../ArtistSceneExperience";

export default function ArtistMemberPage() {
  const { artistid, id } = useParams<{ artistid: string; id: string }>();
  return <ArtistSceneExperience artistSlug={artistid} initialMemberSlug={id} />;
}
