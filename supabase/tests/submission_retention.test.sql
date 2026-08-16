begin;

select plan(9);

select ok(
  to_regclass('public.retention_deletion_jobs') is not null,
  'retention deletion state table exists'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.retention_deletion_jobs'::regclass),
  'retention deletion state is protected by RLS'
);

select ok(
  has_table_privilege('service_role', 'public.retention_deletion_jobs', 'select')
    and not has_table_privilege('authenticated', 'public.retention_deletion_jobs', 'select'),
  'only the server role can read retention state'
);

select ok(
  has_function_privilege('service_role', 'public.reserve_retention_deletion(text,uuid,uuid,uuid)', 'execute')
    and not has_function_privilege('authenticated', 'public.reserve_retention_deletion(text,uuid,uuid,uuid)', 'execute'),
  'reservation RPC is service-role only'
);

select ok(
  pg_get_functiondef('public.get_retention_candidates(integer)'::regprocedure)
    ~ $$created_at <= now\(\) - interval '30 days'$$,
  'candidates use the creation timestamp and a 30-day cutoff'
);

select ok(
  pg_get_functiondef('public.reserve_retention_deletion(text,uuid,uuid,uuid)'::regprocedure)
    ~ $$contact-attachments$$
    and pg_get_functiondef('public.reserve_retention_deletion(text,uuid,uuid,uuid)'::regprocedure)
      ~ $$protect-evidence$$,
  'reservation RPC only exposes the two private submission buckets'
);

select ok(
  pg_get_functiondef('public.finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure)
    ~ $$object_count$$
    and pg_get_functiondef('public.finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure)
      !~ $$message$$
    and pg_get_functiondef('public.finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure)
      !~ $$content$$,
  'retention audit writes metadata without submitted body fields'
);

select ok(
  pg_get_functiondef('public.reserve_retention_deletion(text,uuid,uuid,uuid)'::regprocedure)
    ~ $$role in \('super_admin', 'editor'\)$$
    and pg_get_functiondef('public.retry_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure)
      ~ $$role in \('super_admin', 'editor'\)$$
    and pg_get_functiondef('public.finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'::regprocedure)
      ~ $$role in \('super_admin', 'editor'\)$$,
  'both configured admin roles may finalize retention deletions'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname in ('contact_inquiries_admin_audit', 'protect_reports_admin_audit')
      and pg_get_triggerdef(oid) ~ $$current_setting\('app\.retention_purge'$$
  ),
  'retention finalization suppresses normal payload snapshots'
);

select * from finish();
rollback;
