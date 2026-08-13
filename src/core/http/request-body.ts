class BodyTooLargeError extends Error {}
class MultipartTooComplexError extends Error {}

const BODY_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_MULTIPART_PARTS = 128;
const DEFAULT_MAX_MULTIPART_METADATA_BYTES = 64 * 1024;

type MultipartLimits = {
  maxParts?: number;
  maxMetadataBytes?: number;
};

function limitedBody(request: Request, maxBytes: number, timeoutMs?: number) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;
  if (!request.body) return new ReadableStream<Uint8Array>();

  let size = 0;
  const body = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > maxBytes) throw new BodyTooLargeError();
        controller.enqueue(chunk);
      },
    }),
    timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined,
  );
  return body;
}

export async function parseJsonWithinLimit(
  request: Request,
  maxBytes: number,
  timeoutMs = BODY_TIMEOUT_MS,
): Promise<unknown | null> {
  const body = limitedBody(request, maxBytes, timeoutMs);
  if (!body) return null;
  return new Response(body, {
    headers: {
      "content-type": request.headers.get("content-type") || "application/json",
    },
  }).json();
}

export async function parseFormDataWithinLimit(
  request: Request,
  maxBytes: number,
  timeoutMs = BODY_TIMEOUT_MS,
  limits: MultipartLimits = {},
) {
  const body = limitedBody(request, maxBytes, timeoutMs);
  if (!body) return null;
  const contentType = request.headers.get("content-type") || "";
  const boundary =
    /(?:^|;)\s*boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)?.[1] ||
    /(?:^|;)\s*boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)?.[2]?.trim();
  const guardedBody = boundary
    ? body.pipeThrough(multipartGuard(boundary, limits))
    : body;
  try {
    return await new Response(guardedBody, {
      headers: { "content-type": contentType || "multipart/form-data" },
    }).formData();
  } catch (error) {
    if (
      error instanceof BodyTooLargeError ||
      error instanceof MultipartTooComplexError ||
      (error instanceof DOMException &&
        ["AbortError", "TimeoutError"].includes(error.name))
    )
      return null;
    throw error;
  }
}

function multipartGuard(boundary: string, limits: MultipartLimits) {
  const delimiter = `\r\n--${boundary}`;
  const opening = `--${boundary}`;
  const maxParts = limits.maxParts ?? DEFAULT_MAX_MULTIPART_PARTS;
  const maxMetadataBytes =
    limits.maxMetadataBytes ?? DEFAULT_MAX_MULTIPART_METADATA_BYTES;
  const decoder = new TextDecoder("latin1");
  let mode: "preamble" | "boundary" | "headers" | "body" | "done" = "preamble";
  let buffer = "";
  let partCount = 0;
  let metadataBytes = 0;

  const scan = (input: string) => {
    buffer += input;
    while (mode !== "done") {
      if (mode === "preamble") {
        const start = buffer.indexOf(opening);
        if (start < 0) {
          buffer = buffer.slice(-opening.length + 1);
          return;
        }
        const afterOpening = buffer.slice(start + opening.length);
        if (afterOpening.length < 2) {
          buffer = buffer.slice(start);
          return;
        }
        if (
          !afterOpening.startsWith("--") &&
          !afterOpening.startsWith("\r\n")
        ) {
          buffer = buffer.slice(start + 2);
          continue;
        }
        buffer = afterOpening;
        partCount = 0;
        mode = "boundary";
        continue;
      }

      if (mode === "boundary") {
        if (buffer.startsWith("--")) {
          mode = "done";
          buffer = buffer.slice(2);
          continue;
        }
        if (buffer.startsWith("\r\n")) {
          buffer = buffer.slice(2);
          partCount += 1;
          if (partCount > maxParts) throw new MultipartTooComplexError();
          mode = "headers";
          continue;
        }
        if (buffer.length < 2) return;
        throw new MultipartTooComplexError();
      }

      if (mode === "headers") {
        const end = buffer.indexOf("\r\n\r\n");
        if (end < 0) {
          const keep = Math.min(3, buffer.length);
          metadataBytes += buffer.length - keep;
          if (metadataBytes > maxMetadataBytes)
            throw new MultipartTooComplexError();
          buffer = buffer.slice(-keep);
          return;
        }
        metadataBytes += end + 4;
        if (metadataBytes > maxMetadataBytes)
          throw new MultipartTooComplexError();
        buffer = buffer.slice(end + 4);
        mode = "body";
        continue;
      }

      const nextBoundary = buffer.indexOf(delimiter);
      if (nextBoundary < 0) {
        buffer = buffer.slice(-delimiter.length + 1);
        return;
      }
      const afterDelimiter = buffer.slice(nextBoundary + delimiter.length);
      if (afterDelimiter.length < 2) {
        buffer = buffer.slice(nextBoundary);
        return;
      }
      if (
        !afterDelimiter.startsWith("--") &&
        !afterDelimiter.startsWith("\r\n")
      ) {
        buffer = buffer.slice(nextBoundary + 2);
        continue;
      }
      buffer = afterDelimiter;
      mode = "boundary";
    }
  };

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      scan(decoder.decode(chunk, { stream: true }));
      controller.enqueue(chunk);
    },
    flush() {
      scan(decoder.decode());
    },
  });
}
