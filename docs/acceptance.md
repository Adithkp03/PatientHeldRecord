# Acceptance gates and threat matrix

## Phase 0

- [x] Fresh source scaffold; no prior project code reused.
- [x] Three-section enum, role checks and CRUD payload contract.
- [x] Local production build and test commands.
- [ ] Event originality/reuse rules checked against original brief.
- [ ] Dedicated free Supabase slot and card-free setup verified.
- [ ] Vercel personal/non-commercial Hobby eligibility and deploy setup verified.
- [ ] Preview opens on two phones; secrets absent from deployed client bundle.

## Phase 1 deployed gate (not yet passed)

1. Provision synthetic A, B and clinician with administrator-controlled role profiles.
2. A creates/edits an allergy. Refresh and confirm server-loaded value.
3. B changes URL/body/API identifiers to A. Must fail or return B's own record only.
4. Call Supabase directly with B's authenticated session: SELECT A returns no rows; INSERT/UPDATE A fails. Test clinician and anonymous direct access too.
5. Logout A, call API, use browser back/refresh. No readable cached clinical record should remain.
6. Test expired sessions and session renewal in browser.
7. Inspect network, log sinks, persistent browser storage and build output. No values in URLs/logs/local storage, no service-role key in client.

## Later security gates

| Threat | Required proof |
| --- | --- |
| Stolen/replayed QR | Authenticated single-use claim with expiry; records withheld |
| Two scanners | Atomic claim; exactly one clinician bound |
| Wrong clinician | Server grant check denies every read |
| Excluded section | Missing from both payload and UI |
| No approval | No data returned |
| Expired/revoked grant | Immediate denial with no clinical fields |
| Stale tab/offline | Hide old data when refresh denied; offline fails closed |
| Widened selection | New consent flow, never mutate live grant wider |
| Patient impersonation | Approve/revoke check authenticated owner |
| Audit leak | Append-only events, no token or clinical content |

## Two-phone demonstration after phases 2-4

Patient selects allergies and medicines, excludes recent history -> shows opaque QR -> signed-in clinician claims -> patient sees name and approves -> clinician reads only those sections -> patient revokes -> refresh and direct GET denied -> patient sees audit sequence.

No two-phone gate or clinical wording review is claimed until it is actually run and recorded.

## September 30 verification snapshot

Phase 1: live Postgres isolation/auth/role tests and deployed browser save, refresh, B-isolation and logout denial reported passed. Phase 2: real DB claim race/replay/rate-limit/role/direct-table/natural-expiry and deployed manual patient/clinician flow reported passed at 2faf76f. Physical camera/two-phone testing is deferred by the owner until the whole build (16:18 IST); this is a limitation, not a pass. Forced-expired-session browser behavior remains unproven. Bundle/source/runtime-log audit covered inspected routes/windows only, not every possible sink or future build.

PR 2 merged after green final CI and owner direction to merge/continue. Phase 3 remains draft and must pass its own live DB/browser checks before merging. No production-domain promotion is performed by this code change.
