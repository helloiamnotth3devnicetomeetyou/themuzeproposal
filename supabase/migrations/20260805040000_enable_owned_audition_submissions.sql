begin;

create unique index if not exists audition_submissions_campaign_user_uidx
  on public.audition_submissions (campaign_id, user_id)
  where campaign_id is not null and user_id is not null;

drop policy if exists "users read own audition submissions" on public.audition_submissions;
create policy "users read own audition submissions" on public.audition_submissions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "applicants read submitted audition campaigns" on public.audition_campaigns;
create policy "applicants read submitted audition campaigns" on public.audition_campaigns
  for select to authenticated using (
    exists (
      select 1 from public.audition_submissions submission
      where submission.campaign_id = audition_campaigns.id
        and submission.user_id = auth.uid()
    )
  );

grant select on public.audition_submissions to authenticated;

notify pgrst, 'reload schema';
commit;
