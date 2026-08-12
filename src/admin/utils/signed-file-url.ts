export async function fetchSignedFileUrl(bucket: string, path: string, downloadName?: string): Promise<string> {
  try {
    const response = await fetch("/api/files/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path, downloadName }),
    });
    if (!response.ok) return "";
    const data = await response.json() as { url?: string };
    return data.url || "";
  } catch {
    return "";
  }
}
