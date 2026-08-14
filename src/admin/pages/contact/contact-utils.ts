import base from "@/styles/(admin)/pages/protect/protect-admin.module.css";

import type { ContactStatus } from "./useContactInquiries";

export const statuses: Array<{ value: ContactStatus; label: string }> = [
  { value: "pending", label: "접수" },
  { value: "reviewing", label: "검토 중" },
  { value: "answered", label: "답변 완료" },
  { value: "closed", label: "종결" },
];

export const typeLabels: Record<string, string> = {
  account: "계정 문의",
  notice_event: "공지·이벤트 문의",
  goods_md: "굿즈·MD 문의",
  site_error: "사이트 오류 신고",
  other: "기타",
  brand_collaboration: "브랜드 협업",
  advertising_sponsorship: "광고·협찬 제안",
  md_licensing: "MD·상품화 제안",
  performance_event: "공연·행사 섭외",
  other_business: "기타 비즈니스 제안",
};

export const statusLabel = (status: ContactStatus) =>
  statuses.find((item) => item.value === status)?.label || "접수";

export const statusClass = (status: ContactStatus) => {
  if (status === "answered") return base.status_resolved;
  if (status === "closed") return base.status_rejected;
  return base[`status_${status}`] || base.status_pending;
};

export const formatDate = (value: string, detail = false) =>
  new Intl.DateTimeFormat(
    "ko-KR",
    detail
      ? {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : { year: "numeric", month: "2-digit", day: "2-digit" },
  ).format(new Date(value));

export const formatBytes = (value: number | null) =>
  value ? `${(value / 1024 / 1024).toFixed(1)}MB` : "";
