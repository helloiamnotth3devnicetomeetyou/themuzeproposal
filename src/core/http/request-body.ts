class BodyTooLargeError extends Error {}

const MULTIPART_BODY_TIMEOUT_MS = 15_000;

function limitedBody(request: Request, maxBytes: number, timeoutMs?: number) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;
  if (!request.body) return new ReadableStream<Uint8Array>();

  let size = 0;
  const body = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      size += chunk.byteLength;
      if (size > maxBytes) throw new BodyTooLargeError();
      controller.enqueue(chunk);
    },
  }), timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined);
  return body;
}

export async function parseJsonWithinLimit(request: Request, maxBytes: number): Promise<unknown | null> {
  const body = limitedBody(request, maxBytes);
  if (!body) return null;
  return new Response(body, {
    headers: { "content-type": request.headers.get("content-type") || "application/json" },
  }).json();
}

export async function parseFormDataWithinLimit(
  request: Request,
  maxBytes: number,
  timeoutMs = MULTIPART_BODY_TIMEOUT_MS,
) {
  const body = limitedBody(request, maxBytes, timeoutMs);
  if (!body) return null;
  try {
    return await new Response(body, {
      headers: { "content-type": request.headers.get("content-type") || "multipart/form-data" },
    }).formData();
  } catch (error) {
    if (
      error instanceof BodyTooLargeError
      || (error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name))
    ) return null;
    throw error;
  }
}
