begin;

-- protect_reports uses column-level grants, and the trash migration added
-- deleted_at without granting it. Any browser query filtering on deleted_at
-- (admin inbox counts, protect list) got 403 permission denied.
grant select (deleted_at) on public.protect_reports to authenticated;

commit;
