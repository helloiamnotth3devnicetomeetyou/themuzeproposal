begin;

alter table public.audition_campaigns
  add column if not exists description_i18n jsonb not null default '{}'::jsonb;

update public.audition_campaigns
set description_i18n = jsonb_build_object('ko', description)
where description <> '' and description_i18n = '{}'::jsonb;

alter table public.audition_campaigns
  drop constraint if exists audition_campaigns_description_i18n_check;
alter table public.audition_campaigns
  add constraint audition_campaigns_description_i18n_check
  check (jsonb_typeof(description_i18n) = 'object');

notify pgrst, 'reload schema';
commit;
