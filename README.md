# Patient Held Record

A new, synthetic-data-only QR consent prototype for VJH 2k26 Healthcare PS3. Written from scratch; no CareTrail source imported.

## Current state

Phase 0 scaffold, phase 1 patient CRUD and phase 2 expiring QR request/claim are implemented. Phase 3 approval and scoped reads are implemented on a local development branch only, not deployed or accepted. Revoke and audit are **not implemented yet**. Local tests are not evidence of a completed deployed phase gate.

## Stack

Next.js App Router, TypeScript, Supabase Auth/Postgres with row-level security, Vercel candidate deployment.

## Setup

1. `npm ci`
2. Copy `.env.example` to `.env.local`. Use a dedicated Supabase project, never CareTrail's database or keys. Provide the project URL and publishable key.
3. Apply migrations in filename order. Fresh 001 explicitly grants service_role SELECT/INSERT for server-only fixture provisioning. If 001 was already applied before that fix, apply `003_explicit_seed_privileges.sql` to repair privileges; it does not change patient RLS.
4. Seed the two patients and one clinician using `npm run seed:synthetic` with the server-only service key and a fresh random `SYNTHETIC_SEED_PASSWORD` in your shell. This script is intentionally not an app endpoint. Do not commit the password or key. `.invalid` fixture emails are not deliverable addresses; demo sign-in uses passwords.
5. `npm run dev`. Patient A/B use their pre-enrolled fixture accounts.
6. `npm test && npm run typecheck && npm run build`.

No service-role credential is used by record routes. Patients cannot assign roles. Medical-data responses use `Cache-Control: no-store`. No record values are written to local storage, URLs or application logs. Routes derive owner ID exclusively from the verified session and reject owner overrides.

## Phase 1 API

- `GET /api/records/{section}`: own patient record only.
- `PUT /api/records/{section}`: replace own section with `{ "entries": [{ "label": "Synthetic item", "detail": "Demo only" }] }`.
- Allowed sections: `allergies`, `medicines`, `recent_history`.
- Delete an item by removing it and saving; clear a section with `entries: []`.
- Clinicians are denied record CRUD in this phase.

## Test status

47 local tests passed across record and QR routes. Record coverage: unauthenticated GET/PUT, patient ownership helper, cross-patient helper, clinician denial, invalid sections, owner-body/query overrides, malformed records/JSON, local save/read isolation, logged-out route access cross-origin/non-JSON write denial and no-store.

Persistence is mocked in the route tests. Live Supabase RLS, session renewal, browser logout/back behavior, migration apply, seed, deployment, two physical phones and real network conditions are **not yet tested**. See `docs/acceptance.md`. The security assertions do not constitute a clinical or regulatory certification.

## Planned phases

0. Scope/contracts/threat matrix/scaffold and deployment gate.
1. Patient identity and own-record CRUD.
2. Expiring single-use opaque QR request; atomic clinician claim; no records before approval.
3. Explicit patient approval; short-lived clinician-bound grants; section filtering on every read.
4. Live revoke, denied refresh and append-only content-free audit.
5. Negative-case hardening, accessibility/device QA and clinical wording review.
6. Fresh-session deployment evidence and rehearsal.

## Limits

QR-only, synthetic records, online-only. No ABHA integration, diagnosis, OCR, blockchain, licensure verification or production claims. Revocation will stop future server reads, not screenshots, memory or copies already taken. Do not enter real health data. The core grant/scan/approve/read/revoke flow is planned, not functioning in phase 1.

## Phase 2 API

Apply `supabase/migrations/002_single_use_qr.sql` after 001. POST `/api/qr-requests` accepts selected sections as an authenticated patient and returns a short-lived opaque token once. POST `/api/qr-requests/claim` accepts that token from a signed-in clinician. GET `/api/qr-requests/{id}` permits only request owner or bound claimant and returns no records or token. Database functions own expiry, single-use row locking and rate limits (10 claim attempts per clinician per minute). Browser QR contains raw opaque token only, not a URL, patient ID or record. Manual fallback uses the full token to avoid a guessable short code. Creation expires previous unclaimed requests.

Camera scanning uses BarcodeDetector when available and manual fallback otherwise. A claimant display name is not verified licensure. No patient approval or record disclosure exists yet. RPC tests are mocked; actual concurrent claim, rate limit and RLS require deployed DB verification.

### Resuming an interrupted synthetic seed

The seed script reuses exact fixture email accounts and fills only missing profiles/sections. It does not reset passwords, change existing roles or overwrite edited records. A differing fixture profile stops for review. After applying migration 003, rerun with the original seed password environment; accounts already created retain their original password. Never run this script against CareTrail or a real-patient project. Migration source tests check explicit grants but are not live Postgres proof.

## Phase 3 local branch only

Migration `004_explicit_consent.sql` adds RLS-protected grant state and restricted approval/read functions. POST `/api/grants/approve` accepts only request_id; its bound clinician and immutable selected sections come from the stored claimed request. The patient must approve before the 60-second request expiry. Grants last 10 minutes. GET `/api/shared-records/{patientId}?grant_id=...&sections=...` checks the clinician session, patient/grant binding, active/expiry/revoke state and section subset in the database every time. Clinicians have no direct table record grants. The route is distinct from patient-owned `/api/records/{section}`.

Shared view clears values on denied/offline/expired refresh and hides them on tab background. Explicit expiry timer clears at grant expiry. No patient values or tokens in persistent browser storage. Live phase-3 transaction/UI tests are pending; local mocked RPC and migration-source tests are not DB proof. Revocation is not available until phase 4, and this limitation is shown before approval. Never use this prototype with real patient data.
