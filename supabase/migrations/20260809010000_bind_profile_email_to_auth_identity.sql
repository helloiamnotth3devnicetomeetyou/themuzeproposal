begin;

drop policy if exists "users update own non-privileged fields" on public.profiles;
create policy "users update own non-privileged fields"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and email = coalesce(auth.jwt() ->> 'email', '')
  and role is not distinct from (
    select profiles_1.role from public.profiles as profiles_1
    where profiles_1.id = auth.uid()
  )
);

commit;
