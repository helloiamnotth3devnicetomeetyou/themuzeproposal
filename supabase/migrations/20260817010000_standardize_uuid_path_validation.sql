begin;

-- Keep storage path allowlists aligned with the RFC 9562 UUID validator used by the API.
-- Versions 1 through 8 remain accepted for compatibility; the variant is RFC 4122.
drop policy if exists "public read business assets" on storage.objects;
create policy "public read business assets"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'business-assets'
  and (
    name in ('press-kit.zip', 'profile.pdf')
    or name ~* '^press-kit/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]zip$'
    or name ~* '^profile/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]pdf$'
  )
);

drop policy if exists "admins read contact attachments" on storage.objects;
create policy "admins read contact attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'contact-attachments'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]pdf$'
  and public.is_admin()
);

drop policy if exists "admins read protect evidence" on storage.objects;
create policy "admins read protect evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'protect-evidence'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp|gif|pdf)$'
  and public.is_admin()
);

notify pgrst, 'reload schema';
commit;
