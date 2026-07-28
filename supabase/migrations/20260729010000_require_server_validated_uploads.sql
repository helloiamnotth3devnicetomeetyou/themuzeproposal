-- Route untrusted uploads through application endpoints that validate file bytes.
-- Storage MIME allowlists remain as defense in depth, not as the primary validator.

drop policy if exists "admin upload artist assets" on storage.objects;
drop policy if exists "admin update artist assets" on storage.objects;
drop policy if exists "admin upload music assets" on storage.objects;
drop policy if exists "admin update music assets" on storage.objects;
drop policy if exists "users upload own protect evidence" on storage.objects;
drop policy if exists "visitors upload contact attachments" on storage.objects;

-- Contact submissions now run through /api/contact-inquiries. This prevents a
-- caller from bypassing server-side file validation or supplying its own size.
drop policy if exists "visitors create contact inquiries" on public.contact_inquiries;
revoke insert on public.contact_inquiries from anon, authenticated;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]
where id = 'contact-attachments';

create or replace function public.set_contact_attachment_size_from_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_size bigint;
begin
  if new.attachment_path is null then
    new.attachment_name := null;
    new.attachment_size := null;
    return new;
  end if;

  if new.category <> 'business'
    or new.attachment_name is null
    or split_part(new.attachment_path, '/', 1) <> new.id::text then
    raise exception 'invalid contact attachment' using errcode = '23514';
  end if;

  select
    case
      when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint
      else null
    end
  into v_size
  from storage.objects
  where bucket_id = 'contact-attachments'
    and name = new.attachment_path;

  if v_size is null or v_size < 1 or v_size > 20971520 then
    raise exception 'contact attachment is missing or has an invalid size'
      using errcode = '23514';
  end if;

  new.attachment_size := v_size;
  return new;
end;
$$;

revoke all on function public.set_contact_attachment_size_from_storage() from public;
revoke all on function public.set_contact_attachment_size_from_storage() from anon, authenticated;

drop trigger if exists contact_inquiries_set_attachment_size on public.contact_inquiries;
create trigger contact_inquiries_set_attachment_size
before insert on public.contact_inquiries
for each row execute function public.set_contact_attachment_size_from_storage();

notify pgrst, 'reload schema';
