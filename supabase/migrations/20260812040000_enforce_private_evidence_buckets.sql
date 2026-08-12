-- Ensure protect-evidence and contact-attachments buckets are private.
-- These buckets were created out-of-band (dashboard) before the schema
-- dump baseline, so their `public` flag was never version-controlled.
-- App code and storage.objects RLS policies (see
-- 20260812010000_harden_protect_report_access.sql) assume both buckets
-- are private; if either were ever flipped to public, RLS would be
-- bypassed entirely since Supabase serves public-bucket objects by path
-- with no policy check.
update storage.buckets
set public = false
where id in ('protect-evidence', 'contact-attachments');
