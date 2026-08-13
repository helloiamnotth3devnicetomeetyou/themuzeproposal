begin;

-- Protect-report evidence is uploaded and removed by the server so the R2
-- object and its database reference stay in sync.  The old browser DELETE
-- policy allowed a reporter to remove only the metadata row, leaving an
-- inaccessible object behind and breaking the report's evidence set.
drop policy if exists "users delete own protect report attachments"
  on public.protect_report_attachments;
revoke delete on table public.protect_report_attachments from authenticated;

notify pgrst, 'reload schema';
commit;
