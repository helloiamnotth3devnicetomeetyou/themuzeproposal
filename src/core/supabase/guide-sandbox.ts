const ACTIVE_KEY = "admin-guide-sandbox";
const DRAFT_SNAPSHOT_KEY = "admin-guide-sandbox-drafts";
const RETURN_TO_KEY = "admin-guide-sandbox-return-to";
const DRAFT_PREFIX = "admin-draft:";
const objectUrls = new Set<string>();
let lastNoticeAt = 0;

const browserStorage = () => typeof window === "undefined" ? null : window.localStorage;

export const isGuideSandboxActive = () => browserStorage()?.getItem(ACTIVE_KEY) === "true";

export function startGuideSandbox() {
  const storage = browserStorage();
  if (!storage || isGuideSandboxActive()) return;
  const drafts = Object.fromEntries(Object.keys(storage)
    .filter((key) => key.startsWith(DRAFT_PREFIX))
    .map((key) => [key, storage.getItem(key)]));
  storage.setItem(DRAFT_SNAPSHOT_KEY, JSON.stringify(drafts));
  Object.keys(drafts).forEach((key) => storage.removeItem(key));
  storage.setItem(RETURN_TO_KEY, `${window.location.pathname}${window.location.search}`);
  storage.setItem(ACTIVE_KEY, "true");
}

export function finishGuideSandbox() {
  const storage = browserStorage();
  if (!storage) return null;
  const returnTo = storage.getItem(RETURN_TO_KEY);
  let snapshot: Record<string, string | null> = {};
  try { snapshot = JSON.parse(storage.getItem(DRAFT_SNAPSHOT_KEY) ?? "{}"); } catch { /* discard an invalid sandbox snapshot */ }
  Object.keys(storage).filter((key) => key.startsWith(DRAFT_PREFIX)).forEach((key) => storage.removeItem(key));
  Object.entries(snapshot).forEach(([key, value]) => { if (value !== null) storage.setItem(key, value); });
  objectUrls.forEach(URL.revokeObjectURL);
  objectUrls.clear();
  storage.removeItem(ACTIVE_KEY);
  storage.removeItem(DRAFT_SNAPSHOT_KEY);
  storage.removeItem(RETURN_TO_KEY);
  return returnTo;
}

export function createGuideSandboxAsset<Bucket extends string>(file: Blob, bucket: Bucket, path: string) {
  const url = URL.createObjectURL(file);
  objectUrls.add(url);
  return { bucket, path, url };
}

export function isGuideSandboxWrite(url: string, method: string) {
  if (!isGuideSandboxActive() || method === "GET" || method === "HEAD") return false;
  if (url.includes("/auth/v1/")) return false;
  if (url.includes("/storage/v1/object/sign/")) return false;
  if (url.includes("/rest/v1/admin_onboarding_progress")) return false;
  if (url.includes("/rest/v1/rpc/get_admin_audition_submissions")) return false;
  return url.includes("/rest/v1/") || url.includes("/storage/v1/") || url.includes("/api/admin/") || url.includes("/api/uploads/");
}

async function sandboxResponse(request: Request) {
  const url = new URL(request.url, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (url.pathname.startsWith("/api/uploads/")) {
    const form = await request.clone().formData();
    const file = form.get("file");
    if (file instanceof Blob) {
      const bucket = String(form.get("bucket") || "artist-assets");
      const path = String(form.get("path") || `guide/${crypto.randomUUID()}`);
      return Response.json({ asset: createGuideSandboxAsset(file, bucket, path), token: "guide-sandbox" });
    }
  }
  if (url.pathname === "/api/admin/accounts" && request.method === "POST") return Response.json({ invited: true });
  if (url.pathname.startsWith("/api/")) return Response.json({ sandbox: true });

  const payload = await request.clone().json().catch(() => null) as Record<string, unknown> | null;
  if (url.pathname.includes("/rpc/save_album_with_tracks")) {
    const album = payload?.p_album as Record<string, unknown> | undefined;
    return Response.json(album?.id ?? crypto.randomUUID());
  }
  if (url.pathname.includes("/rpc/")) return Response.json(null);
  if (request.method === "POST" || request.method === "PATCH") {
    const id = url.searchParams.get("id")?.replace(/^eq\./, "") || crypto.randomUUID();
    const rows = Array.isArray(payload) ? payload : [{ id, ...(payload ?? {}) }];
    const body = request.headers.get("accept")?.includes("vnd.pgrst.object") ? rows[0] : rows;
    return Response.json(body, { headers: { "Content-Range": `0-${Math.max(0, rows.length - 1)}/${rows.length}` } });
  }
  return new Response(null, { status: 204 });
}

export async function guideSandboxFetch(input: RequestInfo | URL, init?: RequestInit) {
  const requestInput = typeof input === "string" && input.startsWith("/") && typeof window !== "undefined"
    ? new URL(input, window.location.origin)
    : input;
  const request = new Request(requestInput, init);
  if (!isGuideSandboxWrite(request.url, request.method)) return fetch(input, init);
  if (typeof window !== "undefined" && Date.now() - lastNoticeAt > 800) {
    lastNoticeAt = Date.now();
    window.dispatchEvent(new CustomEvent("admin-toast", { detail: "연습 모드라서 실제 데이터에는 반영하지 않았습니다." }));
  }
  return sandboxResponse(request);
}
