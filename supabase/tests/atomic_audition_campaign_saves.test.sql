begin;

select plan(5);

insert into auth.users (
  id, email, encrypted_password, aud, role, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '50000000-0000-0000-0000-000000000001', 'atomic-audition-admin@example.com', '',
  'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()
);
update public.profiles set role = 'super_admin' where id = '50000000-0000-0000-0000-000000000001';

insert into public.audition_campaigns (id, title)
values
  ('50000000-0000-0000-0000-000000000002', 'Before'),
  ('50000000-0000-0000-0000-000000000003', 'Other');
insert into public.audition_form_fields (id, campaign_id, field_key, label_i18n, field_type, is_primary_label)
values
  ('50000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'email', '{"ko":"이메일"}', 'short_text', true),
  ('50000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'name', '{"ko":"이름"}', 'short_text', false),
  ('50000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000003', 'other', '{"ko":"다른"}', 'short_text', true);

select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select public.save_audition_campaign(
  jsonb_build_object('id', '50000000-0000-0000-0000-000000000002', 'title', 'After'),
  jsonb_build_array(
    jsonb_build_object('id', '50000000-0000-0000-0000-000000000004', 'campaign_id', '50000000-0000-0000-0000-000000000002', 'field_key', 'email', 'label_i18n', '{"ko":"이메일"}'::jsonb, 'field_type', 'short_text', 'is_primary_label', true),
    jsonb_build_object('id', '50000000-0000-0000-0000-000000000007', 'campaign_id', '50000000-0000-0000-0000-000000000002', 'field_key', 'name_new', 'label_i18n', '{"ko":"이름"}'::jsonb, 'field_type', 'short_text')
  ),
  array['50000000-0000-0000-0000-000000000005']::uuid[]
);
select is((select title from public.audition_campaigns where id = '50000000-0000-0000-0000-000000000002'), 'After', 'campaign update commits');
select ok(not exists (select 1 from public.audition_form_fields where id = '50000000-0000-0000-0000-000000000005' and is_active), 'removed field is deactivated');
select ok(exists (select 1 from public.audition_form_fields where id = '50000000-0000-0000-0000-000000000007'), 'new field is inserted');

do $$
begin
  begin
    perform public.save_audition_campaign(
      jsonb_build_object('id', '50000000-0000-0000-0000-000000000002', 'title', 'Must roll back'),
      jsonb_build_array(
        jsonb_build_object('id', '50000000-0000-0000-0000-000000000006', 'campaign_id', '50000000-0000-0000-0000-000000000002', 'field_key', 'email', 'label_i18n', '{"ko":"이메일"}'::jsonb, 'field_type', 'short_text', 'is_primary_label', true)
      ),
      array['50000000-0000-0000-0000-000000000007']::uuid[]
    );
    raise exception 'foreign field unexpectedly accepted';
  exception when sqlstate '22023' then null;
  end;
end;
$$;
select is((select title from public.audition_campaigns where id = '50000000-0000-0000-0000-000000000002'), 'After', 'failed save rolls back campaign update');
select ok(exists (select 1 from public.audition_form_fields where id = '50000000-0000-0000-0000-000000000007' and is_active), 'failed save rolls back field deactivation');

rollback;
