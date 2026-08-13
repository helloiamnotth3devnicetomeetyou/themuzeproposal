# Supabase database workflow

The production project (`knbingxnnkutnukjyucw`, since 2026-08-12) is the source of truth for the
current production schema. It was cloned from the prior project (`kjsqwfhqjvekahacvfnc`, kept only
as a cold backup after it hit the free plan's cached egress limit) via `supabase db push` replaying
every file in `migrations/`, plus a full data copy. Runtime file objects now live in Cloudflare R2; the historical Supabase Storage copy is retained only with the old project backup.

`db:status` / `db:push` / `db:dump` run through `scripts/db.mjs`, which passes `--db-url
$SUPABASE_DB_URL` instead of `--linked`, because the project isn't reachable via `supabase link`
under the CLI account used for the original project. Set `SUPABASE_DB_URL` in `.env.local` (see
`.env.example`) to the Session pooler connection string from the dashboard.

- `schema.remote.sql` is a generated, read-only public-schema snapshot. Refresh it with `npm run db:dump`; do not edit it by hand.
- `migrations/20260724000000_baseline_production_schema.sql` is the production public-schema baseline captured on 2026-07-27. `20260724000001_create_profile_on_auth_user.sql` adds the required `auth.users` trigger, which is outside the public-schema dump.
- `seed.sql` is the idempotent development seed. It runs only on a local `supabase db reset`.
- Add every future production change as a new timestamped file in `migrations/` with `npx supabase migration new <name>`.
- Review pending work with `npm run db:status`, then apply it with `npm run db:push`.
- Supabase Storage buckets are no longer used by the runtime. Configure object limits and CORS in R2; in particular, the public bucket must allow `PUT` and `Content-Type` from the site origin for direct hero-video uploads.

## Establishing the baseline on an existing production database

The baseline and auth-trigger migrations describe objects that already exist in production. Record them as applied once, without replaying their DDL:

```sh
npx supabase migration repair --status applied 20260724000000 20260724000001 --linked
```

After that, `db:status` should show only genuinely pending migrations.

## Canonical conventions

- `public.tracks.is_title` is the only title-track flag.
- `public.tracks.is_title_track` is retired by migration `20260725145833_normalize_tracks_title_flag.sql`.
