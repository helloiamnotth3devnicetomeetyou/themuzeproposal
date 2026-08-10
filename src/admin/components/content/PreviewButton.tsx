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
      title="저장 전 변경사항을 새 창에서 확인합니다."
    >
      <ExternalLink aria-hidden="true" />
      미리보기
    </button>
  );
}
