# Phase 5 hardening candidate

This PR is client hardening and evidence tracking, not a DB migration. No feature beyond the existing consent flow, no analytics/offline cache, no clinical claims.

## Fixed

- A late allowed response could overwrite a newer deny/offline state. Each refresh now carries an epoch; offline, hidden tab, expiry and failed checks invalidate older work. Only the latest response can populate the view.
- Offline event clears values without waiting for the 5s timer. Reconnection requests the server again, not an old browser snapshot. A hung read aborts after 8s and clears. While a network request is in flight, existing values remain until denial/offline/timeout; this is not instantaneous remote erasure.
- Client validates returned grant ID/expiry/exact section contract and structured records before rendering. Duplicate/excluded sections or malformed records hide values. Server authorization remains the security boundary.
- No persistent browser record storage added. Summary remains synthetic; withheld differs from empty. Clinical review is NOT completed.

## Evidence boundaries

68 unit/source tests with mocked RPC; fresh test/typecheck/build results recorded in PR. Six new tests cover response validation and old-response invalidation. Local browser component fixture at 390px: value loaded, offline event clears, online re-fetch restores, mocked revoked response hides value. Actual pixels inspected without overflow. This is simulated event/response evidence, not an actual network disconnect or a deployed authenticated flow. Temporary fixture is not shipped.

Previous shared-live phases 3/4 proved role/owner/section/replay/expiry/revoke/API denial and open-tab logout/revoke clearing on their exact builds. Those historical results do not prove this modified client. Live lane must repeat full positive flow, server denial/expiry/logout/revoke, offline connection loss/reconnect, slow/out-of-order responses, camera-denied/manual path, narrow-screen focus and labels. Physical two-phone checks are deferred to owner; do not mark them passed. Dr Jyotsna Sharma review has not occurred and no outreach is authorized here.

## Still required before declaring phase complete

- Real deployed connectivity/offline and fresh invalid/expired-session UI evidence.
- Two physical phones/camera permission denial/actual mobile connections.
- Clinical wording review by intended reviewer, or clearly reported pending.
- Bounded hygiene inspection of deployed network/logs/storage/bundles; no universal audit claim.
- Repeat full negative matrix after integration with the redesigned UI, which is a separate PR.
