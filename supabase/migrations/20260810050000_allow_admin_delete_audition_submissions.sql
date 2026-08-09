begin;

grant delete on public.audition_submissions to authenticated;

drop policy if exists "admins delete audition submissions" on public.audition_submissions;
create policy "admins delete audition submissions" on public.audition_submissions
  for delete to authenticated using (public.is_admin());

commit;
