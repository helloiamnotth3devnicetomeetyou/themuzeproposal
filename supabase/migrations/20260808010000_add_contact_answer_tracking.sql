alter table public.contact_inquiries
  add column if not exists answered_at timestamptz,
  add column if not exists answered_by uuid references auth.users(id) on delete set null;

do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.capture_admin_audit()'::regprocedure) into definition;
  definition := replace(definition,
    'array[''status'', ''admin_note'']',
    'array[''status'', ''admin_note'', ''answered_at'', ''answered_by'']');
  definition := replace(definition,
    'array[''id'', ''category'', ''inquiry_type'', ''status'', ''admin_note'']',
    'array[''id'', ''category'', ''inquiry_type'', ''status'', ''admin_note'', ''answered_at'', ''answered_by'']');
  execute definition;
end;
$$;

