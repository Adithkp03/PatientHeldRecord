# Two-phone rehearsal and evidence record

Status: prepared script, NOT a recorded rehearsal or clinical signoff.

## Before opening the demo

Use fictional records and pre-enrolled accounts only. Verify the deployment commit in Vercel and record it below. Never show passwords, browser developer auth/session panels, vault entries or raw tokens in a recording. QR contains an expiring token and can still be sensitive; blur it in a public recording after demonstrating scan. Do not film unrelated tabs or notifications.

Record: build commit ______ ; deployed URL ______ ; date/time/timezone ______ ; patient device/browser ______ ; clinician device/browser ______ ; connection ______ ; tester ______ .

## Run A: full flow

1. Patient signs in in a fresh session; clinician signs in separately. Record synthetic allergy/medicine/history values used, without credentials.
2. Patient selects Allergies and Medicines. Leave Recent history unselected. Generate QR; clinician scans (or use explicitly labelled manual fallback).
3. Claim must show no medical values. Patient sees bound clinician display name, exact sections and Allow control. Name is not licensure verification.
4. Patient Allows. Clinician sees only selected sections. Recent history says Not shared. Direct excluded-section fetch denies with no values if conducting API QA outside the recording.
5. Patient opens Access & history and revokes. Clinician remains foreground. Within the next server check values clear. Refresh still denies. Copies already taken cannot be recalled.
6. Patient history shows approve, read ALLOWED, revoke, read REVOKED, newest first. No values/tokens in history. Actual metadata does not cover every possible denied request; see phase4-qa.md.
7. Reuse QR: denied. Switch clinician: bound grant denied. Do not claim tests performed unless observed.

Record each step: PASS / FAIL / NOT RUN, timestamp, actual screen/response and screenshot filename. Avoid screenshots containing credentials or QR token. Capture the denied view and history as final proof.

## Run B: independent fresh-session repeat

Sign out both accounts. Close sessions. Use fresh browser sessions and new request/grant. Repeat Run A on real mobile connections. Fill separate result record, not a copied Run A result. If connectivity fails, stop without inventing success; a prior recording is a fallback recording, not current live proof.

## Device and wording checks

- Camera allowed/denied; unsupported detector/manual fallback; touch controls at least 44px; focus visible; labels read by screen reader; 320/390px layouts.
- Offline/poor-network case hides existing summary; reconnect does a fresh server check. Changed client must be tested on its deployed build.
- Clinical labels/example ordering review by Dr Jyotsna Sharma: NOT REQUESTED / NOT COMPLETED. Do not use reviewed/certified wording unless feedback actually arrives through an approved scope.

## Known limits to say aloud

Synthetic, QR-only, online-only prototype. No ABHA, verified clinician licensure, regulatory certification or clinical deployment. Revocation stops future server reads, not copies. Audit begins at 005; 50 newest grants, 50 history events/page; un-attributable and denied approval/revoke attempts omitted. Real physical two-phone rehearsal remains pending until this script is actually run.
