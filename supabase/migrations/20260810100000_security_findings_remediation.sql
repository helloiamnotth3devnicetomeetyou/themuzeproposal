begin;

-- Keep persisted attacker-controlled display metadata bounded at the database boundary.
-- NOT VALID preserves legacy rows while enforcing every new or updated row.
alter table public.protect_reports
  add constraint protect_reports_post_url_length
  check (char_length(post_url) between 1 and 2048) not valid;

alter table public.contact_inquiries
  add constraint contact_inquiries_attachment_name_length
  check (attachment_name is null or char_length(attachment_name) <= 255) not valid;

alter table public.protect_report_attachments
  add constraint protect_report_attachments_file_name_length
  check (char_length(file_name) between 1 and 255) not valid;

notify pgrst, 'reload schema';
commit;
