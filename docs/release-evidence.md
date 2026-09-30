# Release evidence inventory

This is a sourced project handoff, not a claim that all plan gates are complete.

## Known releases reported through live QA lanes

- Phase 3: tested head 991e92cf, main merge 4e4d1b3c829897ec149da77159b6c98811b39707. Scoped consent, no-preapproval values, wrong role/clinician/patient/section denial, natural expiry, logout clearing. Live QA included a direct HTTP approval race and invalid-JWT API denial, not forced-invalid-JWT UI/offline UI.
- Phase 4: tested head b6ebb37d4271b0bf80c1b38a12541c060cb891cd, main merge bfb2ea5a4d75d0244fa02368742961e348cf4ee7. Canonical revoke clears foreground view, 403 REVOKED/no-store, content-free history. Live lane applied exact 005 with catalog snapshot, 21 SQL assertions, pagination and fail-closed audit test. Lock-order test used already-revoked grant, not an active read/revoke race.
- Canonical domain observed in live closeouts: https://patient-held-record.vercel.app/login . Current version must be rechecked at delivery; this document's record is historical, not a live status API.

## Candidate work, not in the above release

Generic original synthetic fixture PR #4; redesigned UI PR #5; phase-5 shared-view hardening PR #7. Merge and promotion status must be read live before claiming them included. Generic fixture is not a Kaggle import. Kaggle-derived clinical rows were withheld from public repo due unresolved terminology rights.

## Not completed

Two fresh-session physical two-phone rehearsals over actual mobile connections, repeat camera-denied/device accessibility matrix, physician wording review, phase-5 modified-client deployed regression/offline proof, final integrated hygiene inspection and recording. User reported a prior camera scan pass, but that is not a full two-phone rehearsal. No actual recording is included in this PR.

## Reproducible checks

`npm ci && npm test && npm run typecheck && npm run build`

Local SQL fixture is `tests/sql/phase4-local.sql`, for an isolated compatible database after migrations; transaction rolls back fixture data. Never point it at a real-patient DB. Shared QA always needs current preflight and approved scope. Snapshot/catalog reports are held by the live lane; do not put secrets in evidence artifacts.

Before final delivery: fill demo-rehearsal.md twice, record exact deployed commit, confirm all intended PRs included, test fresh sessions, review captured pixels and scrub secrets/QR tokens. State unfinished checks beside the link, not buried as a claim of completion.
