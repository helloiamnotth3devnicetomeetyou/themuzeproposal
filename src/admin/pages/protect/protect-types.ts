export type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";
export type ReportFilter = ReportStatus | "all";

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
  created_at: string;
  updated_at: string;
  artists: { name: string } | null;
};

export type ProtectReportRow = Omit<
  ProtectReport,
  "artists" | "protect_report_attachments"
>;
