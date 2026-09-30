# Phase 4: revoke and content-free audit

Separate phase-4 PR, not deployed or merged by local development. Apply 005 only after snapshot and explicit approval for the shared synthetic DB. Production and previews currently share the same DB. This migration renames two existing phase-3 RPC implementations and replaces their public names with auditing wrappers. It is not purely additive. 001-004 and their source files are unchanged.

## Protocol

- Patient GET `/api/grants` lists their 50 newest grants, including active/revoked/expired state. Ownership derives from auth.uid(), never caller IDs.
- Patient POST `/api/grants/:id/revoke` with `{}` locks the grant FOR UPDATE, checks owner and patient role, sets revoked_at once. Repeats return the same timestamp and append ALREADY_REVOKED metadata. Expired grants can be marked revoked by direct RPC; UI shows the control on active grants only.
- Existing read RPC's FOR SHARE lock defines the order. A read already holding the lock can finish before a waiting revoke; after revoke commits, later reads deny. This cannot recall data already returned or copied.
- Read checks stay in exact phase-3 implementation. Its authenticated/public/anon/service-role execution is revoked; only wrappers can call it as function owner.
- Audit insertion is in the same transaction as approve/read/revoke. An audit-write failure fails the operation closed. Allowed read logs actual requested sections; denied read logs no section input. Denied read uses the actual grant's patient, not attacker-supplied patient ID.
- Missing-grant/unauthenticated/route-rejected attempts are not attributed to a patient, so no patient history row is created. Successful approval and owner revoke plus allowed/denied reads on existing grants are recorded. Denied approvals/revokes are not recorded in this version.
- Metadata: actor ID, patient ID, grant ID, fixed action/outcome, allowed section enums and server timestamp. No tokens, clinical values, arbitrary error text, user agents or network addresses. App roles cannot SELECT/INSERT/UPDATE/DELETE audit rows. History RPC returns only the authenticated patient's events, with actor display name (not verified identity/licensure), newest-first numeric cursor, 50 per page.
- Existing clinician view clears on permission denial or changed grant status at its next 3s consent/5s read check, not instant erase. Hidden tabs and failed network reads clear existing data. UI makes no offline verification claim.

## Local evidence and remaining gate

62 route/source tests pass with mocked persistence; TypeScript and both default/webpack production builds pass. Default build initially stalled with local dev processes sharing generated output; after stopping dev and cleaning .next it passed. Fresh isolated PG14 applied 001-005, passed 21 SQL assertions, rolled back fixtures; disable rollback applied successfully and retained the audit table/phase-3 reads while disabling phase-4 RPCs. This is not Supabase/live/browser proof. First SQL harness attempt used an invalid fake hash and aborted before the positive run; no product failure is implied.

Required shared-live QA, after approved migration:
1. Snapshot existing function bodies, ACLs, RLS/policies/indexes/types; validate preflight matches exact 004. Apply exact reviewed 005 transactionally. Check old implementations match 004 and are inaccessible to anon/authenticated/service role, wrapper search_path pinned, audit ACLs denied.
2. Patient A approves, clinician A reads the selected sections. Owner history shows approve then read ALLOWED, no values/tokens.
3. Patient B/clinician cannot list A's grants/history or revoke A. Direct audit writes/reads and hidden implementation RPC calls fail.
4. With clinician summary open, patient revokes. At next check data clears; direct GET returns REVOKED/no-store with no clinical payload. History records revoke then denied read, newest first. Repeat revoke preserves timestamp. Original QR replay cannot create access.
5. Read/revoke race: allow a pre-lock read only if ordered before revoke; post-commit reads must all deny. Check fail-closed logout, expiry and wrong clinician, with denied outcomes attributed only to actual grant owner.
6. Inspect mobile pixels, tokens/values absent from history/storage/logs, pagination beyond 50, and state recovery after refresh/new login. Active list means 50 newest grants, not an unbounded inventory.

Rollback: `supabase/rollback/005_disable_revoke_audit.sql`, once only, transactionally. Restores phase-3 public implementation names, removes wrappers, disables new RPC access, retains history and revoked_at. Never null revoked_at or drop history. It is a disable rollback, not reinstall-ready (new objects remain). For re-enable after rollback, use a separately reviewed recovery migration. No rollback was run on shared DB.
