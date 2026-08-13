import { DiscographyExperience } from "./components/DiscographyExperience";
import { loadDiscography } from "./discography-server";

export default async function DiscographyPage({
  params,
}: {
  params: Promise<{ artistid: string }>;
}) {
  const { artistid } = await params;
  const { data, error } = await loadDiscography(artistid);
  return (
    <DiscographyExperience
      artistSlug={artistid}
      initialData={data}
      initialLoadError={error}
    />
  );
}
