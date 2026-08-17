begin;

select plan(7);

select ok(
  has_function_privilege(
    'service_role',
    'public.reserve_submission_deletion(text,uuid,uuid,uuid)',
    'execute'
  )
  and not has_function_privilege(
    'authenticated',
    'public.reserve_submission_deletion(text,uuid,uuid,uuid)',
    'execute'
  ),
  'manual submission reservation is server-only'
);

select ok(
  pg_get_functiondef(
    'public.reserve_submission_deletion(text,uuid,uuid,uuid)'::regprocedure
  ) !~ $$30 days$$,
  'manual deletion does not weaken the scheduled 30-day cutoff'
);

select ok(
  pg_get_functiondef(
    'public.reserve_submission_deletion(text,uuid,uuid,uuid)'::regprocedure
  ) ~ $$role in \('super_admin', 'editor'\)$$
  and pg_get_functiondef(
    'public.reserve_submission_deletion(text,uuid,uuid,uuid)'::regprocedure
  ) ~ $$contact-attachments$$
  and pg_get_functiondef(
    'public.reserve_submission_deletion(text,uuid,uuid,uuid)'::regprocedure
  ) ~ $$protect-evidence$$,
  'manual deletion validates admins and only private submission buckets'
);

select ok(
  pg_get_functiondef(
    'public.get_admin_protect_reports(text,text,text)'::regprocedure
  ) ~ $$order by report.created_at desc, report.id desc;$$
  and pg_get_functiondef(
    'public.get_admin_protect_reports(text,text,text)'::regprocedure
  ) !~ $$order by report.severity_rank desc$$,
  'protect reports are returned newest first'
);

select ok(
  pg_get_functiondef(
    'public.finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure
  ) ~ $$object_count$$
  and pg_get_functiondef(
    'public.finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure
  ) !~ $$message$$
  and pg_get_functiondef(
    'public.finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure
  ) !~ $$content$$,
  'manual finalization keeps audit metadata free of submitted content'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.set_submission_trash(text,uuid[],uuid,boolean)',
    'execute'
  )
  and not has_function_privilege(
    'authenticated',
    'public.set_submission_trash(text,uuid[],uuid,boolean)',
    'execute'
  ),
  'trashing a submission is server-only'
);

select ok(
  pg_get_functiondef(
    'public.get_admin_protect_reports(text,text,text)'::regprocedure
  ) ~ $$report.deleted_at is null$$
  and pg_get_functiondef(
    'public.get_retention_candidates(integer)'::regprocedure
  ) ~ $$deleted_at is not null$$,
  'trashed reports leave the inbox and appear in the retention queue'
);

select * from finish();
rollback;
