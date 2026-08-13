begin;

create or replace function public.capture_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_mode text := coalesce(tg_argv[1], 'standard');
  v_primary_key text := coalesce(tg_argv[0], 'id');
  v_row jsonb;
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
  v_before jsonb;
  v_after jsonb;
  v_changed_fields text[] := array[]::text[];
  v_safe_fields text[];
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_record_id text;
  v_record_label text;
begin
  if tg_op <> 'INSERT' then
    v_old := to_jsonb(old) - array['created_at', 'updated_at'];
  end if;
  if tg_op <> 'DELETE' then
    v_new := to_jsonb(new) - array['created_at', 'updated_at'];
  end if;
  v_row := case when tg_op = 'DELETE' then v_old else v_new end;
  v_record_id := coalesce(v_row ->> v_primary_key, '');
  if v_record_id = '' then
    raise exception 'Audit target on %.% has no primary key value', tg_table_schema, tg_table_name;
  end if;
  v_record_label := case tg_table_name
    when 'contact_inquiries' then '문의 #' || upper(left(v_record_id, 8))
    when 'protect_reports' then '신고 #' || upper(left(v_record_id, 8))
    when 'audition_submissions' then '오디션 #' || upper(left(v_record_id, 8))
    when 'profiles' then '관리자 권한 #' || upper(left(v_record_id, 8))
    else coalesce(nullif(v_row ->> 'name_ko', ''), nullif(v_row ->> 'name', ''), nullif(v_row ->> 'title_ko', ''), nullif(v_row ->> 'title', ''), nullif(v_row ->> 'key', ''), nullif(v_row ->> 'slug', ''), v_record_id)
  end;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields
    from jsonb_each(v_old) as entry
    where (v_new -> entry.key) is distinct from entry.value;
    if cardinality(v_changed_fields) = 0 then return new; end if;
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['status', 'admin_note', 'answered_at', 'answered_by']
        when 'protect_reports' then array['status', 'admin_note']
        when 'audition_submissions' then array['status', 'reviewer_notes']
        else array[]::text[]
      end;
    else
      v_safe_fields := v_changed_fields;
    end if;
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_before
    from jsonb_each(v_old) as entry
    where entry.key = any(v_changed_fields) and entry.key = any(v_safe_fields);
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_after
    from jsonb_each(v_new) as entry
    where entry.key = any(v_changed_fields) and entry.key = any(v_safe_fields);
  elsif tg_op = 'INSERT' then
    v_after := v_new;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields
    from jsonb_each(v_new) as entry;
  else
    if v_mode = 'sensitive' then
      v_safe_fields := case tg_table_name
        when 'contact_inquiries' then array['id', 'category', 'inquiry_type', 'status', 'admin_note', 'answered_at', 'answered_by']
        when 'protect_reports' then array['id', 'report_type', 'status', 'admin_note']
        when 'audition_submissions' then array['id', 'category', 'status', 'reviewer_notes']
        else array['id']
      end;
      select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) into v_before
      from jsonb_each(v_old) as entry where entry.key = any(v_safe_fields);
    else
      v_before := v_old;
    end if;
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[]) into v_changed_fields
    from jsonb_each(v_before) as entry;
  end if;

  begin
    v_actor_email := nullif(auth.jwt() ->> 'email', '');
  exception when others then
    v_actor_email := null;
  end;
  if v_actor_email is null and v_actor_id is not null then
    select profile.email into v_actor_email from public.profiles as profile where profile.id = v_actor_id;
  end if;
  insert into public.admin_audit_logs (
    actor_id, actor_email, operation, table_name, record_id, record_label,
    changed_fields, before_values, after_values, transaction_id
  ) values (
    v_actor_id, v_actor_email, tg_op, tg_table_name, v_record_id, v_record_label,
    v_changed_fields, v_before, v_after, txid_current()
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.capture_admin_audit() from public, anon, authenticated, service_role;

commit;
