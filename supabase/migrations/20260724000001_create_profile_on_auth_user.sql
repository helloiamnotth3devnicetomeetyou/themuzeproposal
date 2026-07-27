-- The production baseline is limited to the public schema. Keep its required
-- auth.users trigger in the ordered migration history as well.
drop trigger if exists create_profile_on_auth_user on auth.users;

create trigger create_profile_on_auth_user
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();
