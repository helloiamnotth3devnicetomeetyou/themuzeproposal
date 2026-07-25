"use client";

import { LuExternalLink } from "react-icons/lu";

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
      className="admin-btn admin-btn-secondary"
      disabled={disabled}
      onClick={onClick}
    >
      <LuExternalLink aria-hidden="true" />
      미리보기
    </button>
  );
}
