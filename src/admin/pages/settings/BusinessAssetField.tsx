"use client";

import { type DragEvent, useId, useState } from "react";
import type { IconType } from "react-icons";
import { safeHref } from "@/core/http/safe-href";

export default function BusinessAssetField({
  label,
  hint,
  accept,
  icon: Icon,
  value,
  busy,
  onUpload,
}: {
  label: string;
  hint: string;
  accept: string;
  icon: IconType;
  value: string;
  busy: boolean;
  onUpload: (file: File) => void;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const upload = (file?: File) => {
    if (file && !busy) onUpload(file);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files?.[0]);
  };
  const href = safeHref(value);

  return (
    <div
      className={`track-asset-field ${value ? "has-file" : ""} ${dragging ? "is-dragging" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setDragging(false);
      }}
      onDrop={drop}
    >
      <span className="track-asset-icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="track-asset-copy">
        <b>{label}</b>
        <small>
          {busy
            ? "업로드 중…"
            : dragging
              ? "여기에 놓아 업로드"
              : value
                ? "업로드 완료"
                : hint}
        </small>
      </span>
      {href && (
        <a href={href} target="_blank" rel="noreferrer">
          보기
        </a>
      )}
      <label htmlFor={inputId}>{value ? "교체" : "업로드"}</label>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept={accept}
        disabled={busy}
        onChange={(event) => {
          upload(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
