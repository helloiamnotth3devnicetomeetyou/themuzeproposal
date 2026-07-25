"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  PREVIEW_TTL_MS,
  PREVIEW_VERSION,
  previewStorageKey,
  type PreviewEnvelope,
  type PreviewKind,
  type PreviewPayloadByKind,
} from "@/core/preview/types";

type UseAdminPreviewOptions<K extends PreviewKind> = {
  kind: K;
  payload: PreviewPayloadByKind[K] | null;
  targetPath: string;
  canPreview: boolean;
  unavailableMessage: string;
  onError: (message: string) => void;
};

export function useAdminPreview<K extends PreviewKind>({
  kind,
  payload,
  targetPath,
  canPreview,
  unavailableMessage,
  onError,
}: UseAdminPreviewOptions<K>) {
  const tokenRef = useRef<string | null>(null);
  const revisionRef = useRef(0);
  const activeRef = useRef(false);
  const latestRef = useRef({ payload, targetPath });
  useEffect(() => { latestRef.current = { payload, targetPath }; }, [payload, targetPath]);

  const writePreview = useCallback(() => {
    const token = tokenRef.current;
    const latest = latestRef.current;
    if (!token || !latest.payload || !latest.targetPath) return false;

    const now = Date.now();
    revisionRef.current += 1;
    const envelope = {
      version: PREVIEW_VERSION,
      token,
      kind,
      targetPath: latest.targetPath,
      revision: revisionRef.current,
      updatedAt: now,
      expiresAt: now + PREVIEW_TTL_MS,
      payload: latest.payload,
    } as PreviewEnvelope;

    try {
      window.localStorage.setItem(previewStorageKey(token), JSON.stringify(envelope));
      return true;
    } catch {
      onError("브라우저 임시 저장소를 사용할 수 없어 미리보기를 열 수 없습니다.");
      return false;
    }
  }, [kind, onError]);

  useEffect(() => {
    if (!activeRef.current || !payload || !targetPath) return;
    const timer = window.setTimeout(writePreview, 100);
    return () => window.clearTimeout(timer);
  }, [payload, targetPath, writePreview]);

  const openPreview = useCallback(() => {
    if (!canPreview || !payload || !targetPath) {
      onError(unavailableMessage);
      return;
    }

    if (!tokenRef.current) tokenRef.current = crypto.randomUUID();
    activeRef.current = true;
    if (!writePreview()) return;

    const params = new URLSearchParams({
      token: tokenRef.current,
      path: targetPath,
    });
    const previewWindow = window.open(
      `/api/admin/preview?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
    if (!previewWindow) {
      onError("팝업이 차단되었습니다. 이 사이트의 새 탭 열기를 허용해 주세요.");
    }
  }, [canPreview, onError, payload, targetPath, unavailableMessage, writePreview]);

  return { openPreview };
}
