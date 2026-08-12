begin;

-- The admin notice manager lists all notices (published and draft) for a
-- scope, sorted by `date`, but the only existing indexes
-- (notices_artist_index / notices_global_index) key on `is_published` and
-- `published_at`, neither of which matches this query shape, forcing a sort
-- on every load. Add an index matching the admin list's actual filter/order.
create index if not exists notices_admin_list_idx
  on public.notices (artist_id, date desc);

commit;
