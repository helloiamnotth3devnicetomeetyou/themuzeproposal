begin;

-- The RLS policy "users read own protect reports" filters on user_id, but
-- the column-level grant added in 20260812010000 omitted it. Postgres
-- requires SELECT privilege on any column referenced by a policy's USING
-- clause even when it isn't in the target list, so every authenticated
-- user's own-reports query was failing with "permission denied for column
-- user_id". Re-grant with user_id included.
revoke select on table public.protect_reports from authenticated;
grant select (
  id,
  user_id,
  artist_id,
  report_type,
  title,
  platform,
  status,
  created_at
) on table public.protect_reports to authenticated;

notify pgrst, 'reload schema';
commit;
