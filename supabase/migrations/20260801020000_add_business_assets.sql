begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-assets', 'business-assets', true, 104857600,
  array['application/pdf', 'application/zip']::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = array['application/pdf', 'application/zip']::text[];

drop policy if exists "public read business assets" on storage.objects;
create policy "public read business assets" on storage.objects for select
using (bucket_id = 'business-assets' and name in ('press-kit.zip', 'profile.pdf'));

drop policy if exists "admins manage business assets" on storage.objects;
create policy "admins manage business assets" on storage.objects for all to authenticated
using (bucket_id = 'business-assets' and name in ('press-kit.zip', 'profile.pdf') and public.is_admin())
with check (bucket_id = 'business-assets' and name in ('press-kit.zip', 'profile.pdf') and public.is_admin());

commit;
