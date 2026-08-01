export async function parseFormDataWithinLimit(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;
  if (!request.body) return new FormData();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const contentType = request.headers.get("content-type");
  return new Request(request.url, {
    method: "POST",
    headers: contentType ? { "content-type": contentType } : undefined,
    body: new Blob(chunks.map((chunk) => Uint8Array.from(chunk).buffer as ArrayBuffer)),
  }).formData();
}
