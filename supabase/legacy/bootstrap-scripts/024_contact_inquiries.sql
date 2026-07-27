-- General contact and business inquiry intake.
-- Run after 001_discography.sql (requires profiles, is_admin and set_updated_at).

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  inquiry_type text not null,
  company_name text,
  contact_name text not null,
  phone text,
  email text not null,
  message text not null,
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  privacy_consent boolean not null default false,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_inquiries_category_check
    check (category in ('general', 'business')),
  constraint contact_inquiries_type_check
    check (
      (category = 'general' and inquiry_type in (
        'account',
        'notice_event',
        'goods_md',
        'site_error',
        'other'
      ))
      or
      (category = 'business' and inquiry_type in (
        'brand_collaboration',
        'advertising_sponsorship',
        'md_licensing',
        'performance_event',
        'other_business'
      ))
    ),
  constraint contact_inquiries_status_check
    check (status in ('pending', 'reviewing', 'answered', 'closed')),
  constraint contact_inquiries_privacy_consent_check
    check (privacy_consent = true),
  constraint contact_inquiries_required_text_check
    check (
      length(btrim(contact_name)) between 1 and 80
      and length(btrim(email)) between 3 and 254
      and length(btrim(message)) between 1 and 5000
    ),
  constraint contact_inquiries_business_fields_check
    check (
      category <> 'business'
      or (
        length(btrim(coalesce(company_name, ''))) between 1 and 120
        and length(btrim(coalesce(phone, ''))) between 1 and 40
      )
    ),
  constraint contact_inquiries_attachment_check
    check (
      (
        attachment_path is null
        and attachment_name is null
        and attachment_size is null
      )
      or (
        category = 'business'
        and attachment_path is not null
        and attachment_name is not null
        and attachment_size between 1 and 20971520
      )
    )
);

create index if not exists contact_inquiries_category_created_at_idx
  on public.contact_inquiries (category, created_at desc);

create index if not exists contact_inquiries_status_created_at_idx
  on public.contact_inquiries (status, created_at desc);

create index if not exists contact_inquiries_user_id_idx
  on public.contact_inquiries (user_id, created_at desc)
  where user_id is not null;

drop trigger if exists contact_inquiries_set_updated_at on public.contact_inquiries;
create trigger contact_inquiries_set_updated_at
before update on public.contact_inquiries
for each row execute function public.set_updated_at();

alter table public.contact_inquiries enable row level security;

revoke all on public.contact_inquiries from anon, authenticated;
grant insert on public.contact_inquiries to anon, authenticated;
grant select, update, delete on public.contact_inquiries to authenticated;

drop policy if exists "visitors create contact inquiries" on public.contact_inquiries;
create policy "visitors create contact inquiries"
on public.contact_inquiries for insert
to anon, authenticated
with check (
  privacy_consent = true
  and (
    (auth.uid() is null and user_id is null)
    or
    (auth.uid() is not null and (user_id is null or user_id = auth.uid()))
  )
);

drop policy if exists "admins read contact inquiries" on public.contact_inquiries;
create policy "admins read contact inquiries"
on public.contact_inquiries for select
to authenticated
using (public.is_admin());

drop policy if exists "admins update contact inquiries" on public.contact_inquiries;
create policy "admins update contact inquiries"
on public.contact_inquiries for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins delete contact inquiries" on public.contact_inquiries;
create policy "admins delete contact inquiries"
on public.contact_inquiries for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-attachments',
  'contact-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "visitors upload contact attachments" on storage.objects;
create policy "visitors upload contact attachments"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'contact-attachments'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and lower(storage.extension(name)) in ('pdf', 'ppt', 'pptx')
);

drop policy if exists "admins read contact attachments" on storage.objects;
create policy "admins read contact attachments"
on storage.objects for select
to authenticated
using (
  bucket_id = 'contact-attachments'
  and public.is_admin()
);

drop policy if exists "admins delete contact attachments" on storage.objects;
create policy "admins delete contact attachments"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'contact-attachments'
  and public.is_admin()
);
