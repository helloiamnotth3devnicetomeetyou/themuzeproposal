begin;

create or replace function public.save_audition_campaign(
  p_campaign jsonb,
  p_fields jsonb,
  p_removed_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_campaign_id uuid;
  v_field jsonb;
  v_field_id uuid;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_campaign is null or jsonb_typeof(p_campaign) <> 'object'
    or p_fields is null or jsonb_typeof(p_fields) <> 'array' then
    raise exception 'campaign and fields must be valid JSON object/array' using errcode = '22023';
  end if;

  v_campaign_id := nullif(p_campaign->>'id', '')::uuid;
  if v_campaign_id is null then
    raise exception 'campaign id is required' using errcode = '22023';
  end if;
  perform 1 from public.audition_campaigns where id = v_campaign_id for update;
  if not found then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.audition_form_fields
    where id = any(p_removed_ids) and campaign_id <> v_campaign_id
  ) then
    raise exception 'removed field does not belong to campaign' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_array_elements(p_fields)) <>
     (select count(distinct value->>'id') from jsonb_array_elements(p_fields)) then
    raise exception 'field ids must be unique' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_array_elements(p_fields) value where coalesce((value->>'is_primary_label')::boolean, false)) <> 1
    or not exists (
      select 1 from jsonb_array_elements(p_fields) value
      where value->>'field_key' in ('email', 'applicant_email') and value->>'field_type' = 'short_text'
    )
    or exists (
      select 1 from jsonb_array_elements(p_fields) value
      where value->>'field_type' in ('select', 'radio', 'checkbox')
        and jsonb_array_length(coalesce(value->'options', '[]'::jsonb)) = 0
    ) then
    raise exception 'campaign fields are invalid' using errcode = '22023';
  end if;

  for v_field in select value from jsonb_array_elements(p_fields) loop
    if jsonb_typeof(v_field) <> 'object' then
      raise exception 'field must be a JSON object' using errcode = '22023';
    end if;
    v_field_id := nullif(v_field->>'id', '')::uuid;
    if v_field_id is null then
      raise exception 'field id is required' using errcode = '22023';
    end if;
    if coalesce(v_field->>'campaign_id', v_campaign_id::text) <> v_campaign_id::text
      or v_field_id = any(p_removed_ids)
      or exists (
        select 1 from public.audition_form_fields
        where id = v_field_id and campaign_id <> v_campaign_id
      ) then
      raise exception 'field does not belong to campaign' using errcode = '22023';
    end if;
  end loop;

  update public.audition_campaigns
  set title = trim(p_campaign->>'title'),
      description = coalesce(p_campaign->>'description', ''),
      description_i18n = coalesce(p_campaign->'description_i18n', '{}'::jsonb),
      is_active = coalesce((p_campaign->>'is_active')::boolean, false),
      starts_at = nullif(p_campaign->>'starts_at', '')::timestamptz,
      ends_at = nullif(p_campaign->>'ends_at', '')::timestamptz
  where id = v_campaign_id;

  update public.audition_form_fields
  set is_primary_label = false
  where campaign_id = v_campaign_id and is_primary_label;
  update public.audition_form_fields
  set is_active = false
  where campaign_id = v_campaign_id and id = any(p_removed_ids);

  for v_field in select value from jsonb_array_elements(p_fields) loop
    insert into public.audition_form_fields (
      id, campaign_id, field_key, label_i18n, help_text, field_type, options,
      required, max_length, max_file_size_mb, accepted_file_types, sort_order,
      is_active, is_primary_label
    ) values (
      (v_field->>'id')::uuid, v_campaign_id, v_field->>'field_key',
      coalesce(v_field->'label_i18n', '{}'::jsonb), v_field->>'help_text',
      v_field->>'field_type', coalesce(v_field->'options', '[]'::jsonb),
      coalesce((v_field->>'required')::boolean, false),
      nullif(v_field->>'max_length', '')::integer,
      nullif(v_field->>'max_file_size_mb', '')::integer,
      coalesce(array(select jsonb_array_elements_text(coalesce(v_field->'accepted_file_types', '[]'::jsonb))), '{}'::text[]),
      coalesce((v_field->>'sort_order')::integer, 0),
      true, coalesce((v_field->>'is_primary_label')::boolean, false)
    ) on conflict (id) do update set
      field_key = excluded.field_key, label_i18n = excluded.label_i18n,
      help_text = excluded.help_text, field_type = excluded.field_type,
      options = excluded.options, required = excluded.required,
      max_length = excluded.max_length, max_file_size_mb = excluded.max_file_size_mb,
      accepted_file_types = excluded.accepted_file_types, sort_order = excluded.sort_order,
      is_active = true, is_primary_label = excluded.is_primary_label;
  end loop;
end;
$$;

revoke all on function public.save_audition_campaign(jsonb, jsonb, uuid[]) from public, anon;
grant execute on function public.save_audition_campaign(jsonb, jsonb, uuid[]) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
