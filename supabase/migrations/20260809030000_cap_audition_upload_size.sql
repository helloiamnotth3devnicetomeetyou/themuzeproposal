update public.audition_form_fields
set max_file_size_mb = 30
where max_file_size_mb > 30;

alter table public.audition_form_fields
  drop constraint if exists audition_form_fields_max_file_size_mb_check;

alter table public.audition_form_fields
  add constraint audition_form_fields_max_file_size_mb_check
  check (max_file_size_mb between 1 and 30);
