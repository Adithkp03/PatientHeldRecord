# Architecture and trust boundaries

```text
Patient phone                         Clinician phone
  own record edit                      signed-in claim + summary
  QR request / Allow / Revoke           no records before Allow
           \                           /
            HTTPS, verified sessions
                     |
              Next.js server routes
              role + payload checks
              no-store responses
                     |
           Supabase Auth + Postgres
           authenticated RPC boundaries
           RLS denies cross-owner CRUD

QR request: hash stored; ~60s; one clinician claim; no record payload
Grant: patient + clinician + immutable sections; ~10m
Read: role, binding, section subset, expiry, revoke checked every time
Revoke: owner + row lock; future reads deny after commit
Audit: same-transaction fixed metadata; app users cannot mutate rows
```

Server-derived auth identity, not a caller patient field, controls ownership. Public/publishable key is client configuration; service-role key must never enter client code. Audit failure fails wrapped operations closed. Security-definer functions pin search_path. The phase-4 read implementation holds FOR SHARE; revoke takes FOR UPDATE, defining read-before-revoke ordering. A read already returned is not erased.

No analytics, bulk import, offline record storage, ABHA, diagnosis, OCR or blockchain on the critical path. Browser checks/polling are not authority; DB is the every-read boundary. Deployment preview and production share the synthetic DB, so DB RPC changes need a separate approved shared-live gate even before UI promotion.
