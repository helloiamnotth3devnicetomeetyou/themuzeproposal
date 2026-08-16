# Retention operations

The application retains contact inquiries and protect reports for 30 days
from `created_at`. A Vercel cron invokes `/api/admin/retention/cron` daily at
03:00 UTC, as configured in `vercel.json`.

Set a distinct, random 32-character-or-longer `CRON_SECRET` in both the Vercel
production and preview environments. Vercel sends it as `Authorization: Bearer <secret>`; the route
does not accept browser sessions or cross-origin requests. Production and
preview Vercel environment validation fails when this secret is missing.

The job processes at most 25 candidates per run. It reserves database rows,
deletes their private R2 objects, and finalizes the database deletion. An R2 or
database failure is recorded as retryable for a later run. The response only
contains safe counts and candidate IDs; request and response logs must never
contain inquiry bodies, report evidence, or the secret.
