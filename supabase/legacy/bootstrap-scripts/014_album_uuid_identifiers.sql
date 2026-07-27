-- Normalize every existing album to the same UUID-backed internal identifier.

update public.albums
set slug = id::text,
    updated_at = now()
where slug is distinct from id::text;
