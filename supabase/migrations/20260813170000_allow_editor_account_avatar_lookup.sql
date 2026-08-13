begin;

-- Editors render the account avatar beside the records they review.  The
-- profiles table intentionally exposes only the signed-in row to ordinary
-- accounts, so the avatar lookup otherwise returns no rows for an editor.
-- Keep the exception narrow: only accounts already referenced by an admin
-- review queue and that have an active avatar are visible through this table.
-- Super admins retain the existing full-profile policy.
drop policy if exists "editors read referenced account avatars" on public.profiles;
create policy "editors read referenced account avatars"
on public.profiles for select
to authenticated
using (
  public.has_admin_role('editor')
  and avatar_asset_id is not null
  and (
    exists (
      select 1
      from public.audition_submissions as submission
      where submission.user_id = profiles.id
    )
    or exists (
      select 1
      from public.protect_reports as report
      where report.user_id = profiles.id
    )
  )
);

notify pgrst, 'reload schema';
commit;
