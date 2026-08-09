begin;

update storage.buckets
set allowed_mime_types = array['application/pdf']
where id = 'contact-attachments';

commit;
