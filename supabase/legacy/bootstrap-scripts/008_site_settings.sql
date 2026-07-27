-- Global site settings workbench.
-- Safe to run more than once. Existing company names are never overwritten.

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists value jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

insert into public.site_settings (key, value)
values
  ('company', '{"address_ko":"","address_en":"","address_ja":"","email":""}'::jsonb),
  ('footer', '{"copyright":""}'::jsonb),
  ('social', '[]'::jsonb)
on conflict (key) do nothing;

-- Convert the legacy fixed object ({ youtube, instagram, twitter, tiktok })
-- into the flexible channel array used by the redesigned editor.
update public.site_settings as settings
set value = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', 'site-' || replace(lower(channel.platform), '_', '-'),
        'platform', case when channel.platform = 'twitter' then 'x' else channel.platform end,
        'label', '',
        'url', channel.url
      )
      order by channel.platform
    )
    from jsonb_each_text(settings.value) as channel(platform, url)
    where nullif(trim(channel.url), '') is not null
  ),
  '[]'::jsonb
)
where settings.key = 'social'
  and jsonb_typeof(settings.value) = 'object';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_settings_social_is_array'
  ) then
    alter table public.site_settings
      add constraint site_settings_social_is_array
      check (key <> 'social' or jsonb_typeof(value) = 'array');
  end if;
end $$;

alter table public.site_settings enable row level security;

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings"
on public.site_settings for select
using (true);

drop policy if exists "admin manage site settings" on public.site_settings;
create policy "admin manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

notify pgrst, 'reload schema';
