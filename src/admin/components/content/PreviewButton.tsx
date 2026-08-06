"use client";

import { ExternalLink } from "lucide-react";

export default function PreviewButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-tour-id="preview"
      className="admin-btn admin-btn-secondary preview-button"
      disabled={disabled}
      onClick={onClick}
    >
      <ExternalLink aria-hidden="true" />
      미리보기
    </button>
  );
}
