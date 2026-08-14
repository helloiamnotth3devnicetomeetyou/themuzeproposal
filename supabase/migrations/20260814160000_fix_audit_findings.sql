begin;

-- Scan every asset URL in a value, not only the first one.
create or replace function public.assert_no_reserved_asset_urls(p_value text, p_buckets text[])
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_bucket text; v_path text;
begin
  for v_bucket in select unnest(p_buckets) loop
    for v_path in select match[1] from regexp_matches(p_value, '/' || v_bucket || '/([a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+)', 'g') as match loop
      perform pg_advisory_xact_lock(hashtextextended(v_bucket || chr(31) || v_path, 0));
      if exists (select 1 from public.asset_registry where bucket = v_bucket and path = v_path) then
        raise exception 'asset is reserved for deletion' using errcode = '55P03';
      end if;
    end loop;
  end loop;
end;
$$;

create or replace function public.reject_reserved_r2_asset_reference()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_column text; v_value text;
begin
  for v_column, v_value in select key, value from jsonb_each_text(to_jsonb(new)) loop
    if v_value is not null and not (tg_table_name = 'site_settings' and v_column = 'value') then
      perform public.assert_no_reserved_asset_urls(v_value, array['artist-assets', 'album-covers', 'track-assets', 'business-assets', 'hero-videos']);
    end if;
  end loop;
  if tg_table_name = 'site_settings' then
    for v_value in select value from jsonb_each_text(case when jsonb_typeof(to_jsonb(new)->'value') = 'object' then to_jsonb(new)->'value' else '{}'::jsonb end) loop
      perform public.assert_no_reserved_asset_urls(v_value, array['business-assets']);
    end loop;
  elsif tg_table_name = 'avatar_assets' then
    perform public.assert_no_reserved_asset_urls(to_jsonb(new)->>'image_path', array['artist-assets']);
  elsif tg_table_name = 'contact_inquiries' then
    perform public.assert_no_reserved_asset_urls(to_jsonb(new)->>'attachment_path', array['contact-attachments']);
  elsif tg_table_name = 'protect_report_attachments' then
    perform public.assert_no_reserved_asset_urls(to_jsonb(new)->>'file_path', array['protect-evidence']);
  elsif tg_table_name = 'audition_submissions' then
    for v_value in select value from jsonb_each_text(case when jsonb_typeof(to_jsonb(new)->'answers') = 'object' then to_jsonb(new)->'answers' else '{}'::jsonb end) loop
      perform public.assert_no_reserved_asset_urls(v_value, array['audition-attachments']);
    end loop;
  end if;
  return new;
end;
$$;

create or replace function public.save_site_settings_checked(p_updates jsonb, p_expected_updated_at jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_item jsonb; v_key text; v_updated_at timestamptz; v_result jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  for v_item in select value from jsonb_array_elements(p_updates) loop
    v_key := v_item->>'key';
    select updated_at into v_updated_at from public.site_settings where key = v_key for update;
    if not found or v_updated_at is distinct from (p_expected_updated_at->>v_key)::timestamptz then
      raise exception 'STALE_WRITE' using errcode = 'P0003';
    end if;
    update public.site_settings set value = v_item->'value' where key = v_key returning updated_at into v_updated_at;
    v_result := v_result || jsonb_build_object(v_key, v_updated_at);
  end loop;
  return v_result;
end;
$$;

revoke all on function public.assert_no_reserved_asset_urls(text, text[]) from public, anon, authenticated;
revoke all on function public.save_site_settings_checked(jsonb, jsonb) from public, anon;
grant execute on function public.save_site_settings_checked(jsonb, jsonb) to authenticated, service_role;
notify pgrst, 'reload schema';
commit;
