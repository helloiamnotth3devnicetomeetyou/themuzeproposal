begin;

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read published site settings"
  on public.site_settings for select to anon, authenticated
  using (key in ('company', 'history', 'footer', 'social', 'business_assets'));

commit;
