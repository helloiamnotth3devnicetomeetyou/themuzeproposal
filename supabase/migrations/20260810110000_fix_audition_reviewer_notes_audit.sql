begin;

do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.capture_admin_audit()'::regprocedure)
    into definition;

  if position('when ''audition_submissions'' then array[''status'', ''notes'']' in definition) > 0 then
    definition := replace(
      definition,
      'when ''audition_submissions'' then array[''status'', ''notes'']',
      'when ''audition_submissions'' then array[''status'', ''reviewer_notes'']'
    );
  end if;
  if position('when ''audition_submissions'' then array[''id'', ''category'', ''status'', ''notes'']' in definition) > 0 then
    definition := replace(
      definition,
      'when ''audition_submissions'' then array[''id'', ''category'', ''status'', ''notes'']',
      'when ''audition_submissions'' then array[''id'', ''category'', ''status'', ''reviewer_notes'']'
    );
  end if;

  execute definition;
end;
$$;

notify pgrst, 'reload schema';
commit;
