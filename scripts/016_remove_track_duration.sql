-- Remove the deprecated manually entered track duration.
-- Playback duration is read from the uploaded audio metadata.

alter table public.tracks
  drop column if exists duration;
