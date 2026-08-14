begin;

drop trigger if exists auditions_admin_audit on public.auditions;
create trigger auditions_admin_audit
  after insert or update or delete on public.auditions
  for each row execute function public.capture_admin_audit('id', 'standard');

commit;
