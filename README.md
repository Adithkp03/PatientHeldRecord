# Patient Held Record

A new, synthetic-data-only QR consent prototype for VJH 2k26 Healthcare PS3. Written from scratch; no CareTrail source imported.

## Current state

Phase 0 scaffold and phase 1 patient CRUD have been implemented locally. QR sharing, clinician reads, grant approval/revoke and audit are **not implemented yet**. Local tests are not evidence of a completed deployed phase gate.

## Stack

Next.js App Router, TypeScript, Supabase Auth/Postgres with row-level security, Vercel candidate deployment.

## Setup

1. `npm ci`
2. Copy `.env.example` to `.env.local`. Use a dedicated Supabase project, never CareTrail's database or keys. Provide the project URL and publishable key.
3. Apply `supabase/migrations/001_patient_records.sql` to that project.
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

17 local tests passed: unauthenticated GET/PUT, patient ownership helper, cross-patient helper, clinician denial, invalid sections, owner-body/query overrides, malformed records/JSON, local save/read isolation, logged-out route access cross-origin/non-JSON write denial and no-store.

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
