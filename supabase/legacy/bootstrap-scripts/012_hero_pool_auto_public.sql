-- Pool membership is the only publication state for homepage slides.
update public.home_hero_slides
set is_active = true
where is_active = false;

alter table public.home_hero_slides
  alter column is_active set default true;
