"use client";


import { useParams } from "next/navigation";
import ArtistSceneExperience from "./ArtistSceneExperience";

export default function ArtistPage() {
  const { artistid } = useParams<{ artistid: string }>();
  return <ArtistSceneExperience artistSlug={artistid} />;
}
