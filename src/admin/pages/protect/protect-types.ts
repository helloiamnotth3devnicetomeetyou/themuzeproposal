export type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";
export type ReportFilter = ReportStatus | "all";
export type ReportSeverity = "low" | "normal" | "high" | "critical";
export type ReportSeverityFilter = ReportSeverity | "all";

export type ReportAttachment = { file_path: string; file_name: string };

export type ProtectReport = {
  id: string;
  user_id: string;
  artist_id: string;
  reporter_email: string | null;
  report_type: string;
  title: string;
  content: string;
  platform: string;
  post_url: string;
  posted_at: string;
  author_name: string;
  post_ip: string | null;
  protect_report_attachments: ReportAttachment[];
  status: string;
  admin_note: string | null;
  severity: ReportSeverity;
  ai_reasoning: string | null;
  ai_classified_at: string | null;
  read_at: string | null;
  read_by: string | null;
  created_at: string;
  updated_at: string;
  artists: { name: string } | null;
};

export type ProtectReportRow = Omit<
  ProtectReport,
  "artists" | "protect_report_attachments"
>;

export const severityLabel = (severity: string) =>
  ({
    low: "낮음",
    normal: "일반",
    high: "높음",
    critical: "긴급",
  })[severity] || "분류 대기 중";

export const severityClass = (severity: string) =>
  ({
    low: "severity_low",
    normal: "severity_normal",
    high: "severity_high",
    critical: "severity_critical",
  })[severity] || "severity_pending";
