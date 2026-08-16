begin;

-- The admin route allows both configured admin roles. Keep the service-only
-- RPC boundary, but do not make the actor role stricter than the server
-- authorization check that calls it.
do $$
declare
  v_signature text;
  v_definition text;
begin
  foreach v_signature in array array[
    'reserve_retention_deletion(text,uuid,uuid,uuid)',
    'retry_retention_deletion(text,uuid,uuid,uuid,boolean)',
    'finalize_retention_deletion(text,uuid,uuid,uuid,boolean)'
  ] loop
    select pg_get_functiondef(v_signature::regprocedure)
      into v_definition;
    if v_definition is null then
      raise exception 'retention RPC not found: %', v_signature;
    end if;
    v_definition := replace(
      v_definition,
      'role = ''super_admin''',
      'role in (''super_admin'', ''editor'')'
    );
    v_definition := replace(
      v_definition,
      'super administrator access required',
      'administrator access required'
    );
    execute v_definition;
    if pg_get_functiondef(v_signature::regprocedure) ~ 'role = ''super_admin''' then
      raise exception 'retention RPC still restricts the actor role: %', v_signature;
    end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
commit;
