export type ImagePreloadCandidate = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

type PreloadOptions = {
  concurrency?: number;
};

const loadedImages = new Set<string>();
const pendingImages = new Map<string, Promise<boolean>>();

function candidateKey(candidate: ImagePreloadCandidate) {
  return `${candidate.src}\n${candidate.srcSet ?? ""}\n${candidate.sizes ?? ""}`;
}

function preloadOne(candidate: ImagePreloadCandidate) {
  const key = candidateKey(candidate);
  if (loadedImages.has(key)) return Promise.resolve(true);

  const pending = pendingImages.get(key);
  if (pending) return pending;

  const request = new Promise<boolean>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    if (candidate.sizes) image.sizes = candidate.sizes;
    if (candidate.srcSet) image.srcset = candidate.srcSet;
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = candidate.src;
  }).then((loaded) => {
    pendingImages.delete(key);
    if (loaded) loadedImages.add(key);
    return loaded;
  });

  pendingImages.set(key, request);
  return request;
}

export async function preloadImages(
  candidates: ImagePreloadCandidate[],
  { concurrency = 2 }: PreloadOptions = {},
) {
  const queue = Array.from(
    new Map(
      candidates
        .filter((candidate) => Boolean(candidate.src))
        .map((candidate) => [candidateKey(candidate), candidate]),
    ).values(),
  );
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < queue.length) {
      const candidate = queue[nextIndex];
      nextIndex += 1;
      await preloadOne(candidate);
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), queue.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

export function scheduleImagePreload(
  candidates: ImagePreloadCandidate[],
  options: PreloadOptions = {},
) {
  if (!candidates.length) return () => undefined;

  let cancelled = false;
  const start = () => {
    if (!cancelled) void preloadImages(candidates, options);
  };

  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(start, { timeout: 1200 });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(handle);
    };
  }

  const handle = globalThis.setTimeout(start, 180);
  return () => {
    cancelled = true;
    globalThis.clearTimeout(handle);
  };
}
