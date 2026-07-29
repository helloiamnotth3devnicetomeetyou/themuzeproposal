-- Inactive artists must not be publicly discoverable, including via their members.

drop policy if exists "public read artists" on public.artists;
create policy "public read artists"
on public.artists for select
using (is_active = true);

-- Keep full artist access for administrators without granting inactive reads publicly.
drop policy if exists "admin manage artists" on public.artists;
create policy "admin read all artists"
on public.artists for select
to authenticated
using (public.is_admin());

create policy "admin insert artists"
on public.artists for insert
to authenticated
with check (public.is_admin());

create policy "admin update artists"
on public.artists for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin delete artists"
on public.artists for delete
to authenticated
using (public.is_admin());

-- artist_members has no independent active state; its visibility follows its parent.
drop policy if exists "public read artist members" on public.artist_members;
create policy "public read active artist members"
on public.artist_members for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_members.artist_id
      and artists.is_active = true
  )
);
