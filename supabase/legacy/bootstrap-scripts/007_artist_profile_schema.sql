-- Compatibility patch for artist tables created before 001_discography.sql.
-- Safe to run more than once.

alter table public.artists
  add column if not exists eng_name text,
  add column if not exists type text not null default 'group',
  add column if not exists debut_date date,
  add column if not exists image_url text,
  add column if not exists color text not null default '#FC6FCF',
  add column if not exists description_ko text,
  add column if not exists description_en text,
  add column if not exists description_ja text,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists logo_url text,
  add column if not exists social_links jsonb not null default '[]'::jsonb;

alter table public.artist_members
  add column if not exists eng_name text,
  add column if not exists role_ko text,
  add column if not exists role_en text,
  add column if not exists role_ja text,
  add column if not exists birth text,
  add column if not exists mbti text,
  add column if not exists image_url text,
  add column if not exists color text not null default '#FC6FCF',
  add column if not exists bio_ko text,
  add column if not exists bio_en text,
  add column if not exists bio_ja text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists social_links jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
