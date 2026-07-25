# Supabase database workflow

The linked project is the source of truth for the current production schema.

- `schema.remote.sql` is a generated, read-only public-schema snapshot. Refresh it with `npm run db:dump`; do not edit it by hand.
- Add every production change as a new timestamped file in `migrations/` with `npx supabase migration new <name>`.
- Review pending work with `npm run db:status`, then apply it with `npm run db:push`.
- The numbered files in `../scripts/` are the legacy bootstrap history. Keep `002_seed_discography.sql` idempotent and aligned with the canonical schema; new database changes belong in `supabase/migrations/`.

## Canonical conventions

- `public.tracks.is_title` is the only title-track flag.
- `public.tracks.is_title_track` is retired by migration `20260725145833_normalize_tracks_title_flag.sql`.