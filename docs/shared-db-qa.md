# Phase 3 on a shared database: approval and rollback

## Compatibility review

The original 004 replaced `qr_request_status` and returned a new approved status plus grant metadata. That would confuse phase-2 production UI, which knows only unclaimed/claimed/expired. The revised migration uses `qr_request_consent_status` instead. Phase-2 create/claim/status functions, tables, policies, patient CRUD and auth remain unchanged. The phase-3 preview uses the new function. Apply 004 in one transaction; incomplete migration fails atomically.

This is additive compatibility, not zero risk. Applying 004 to the shared production DB enables new authenticated approval and clinical-record-read functions, even while production's UI does not expose them. The dedicated project is synthetic-only, but the effect is still a new access boundary on the live database. It requires owner approval for shared-DB QA. Free-project limits do not authorize using the production DB.

## Preconditions

- Verify live 002/003 match reviewed source, migration 004 is not partly installed, and only synthetic data/users are in the dedicated project.
- Confirm production remains phase 2 on main db277dbe and phase-3 QA has the revised commit.
- Save the schema/function/policy definitions before applying; do not export secrets or real records into chat.
- Keep promotion/manual domain hold. Use isolated synthetic QA accounts for tests, not real health data.
- Apply 004 transactionally; immediately re-run live phase-2 CRUD/claim/status and direct-table denial before proceeding.
- No phase-3 merge until actual approval/read negative matrix and browser clearing checks pass.

## Rollback procedure

1. Stop phase-3 QA use and return deployed application to tested phase 2. Do not alter auth users or global session settings.
2. Apply `supabase/rollback/004_disable_consent.sql`: atomically revoke execution of all three new RPCs from app roles and mark all phase-3 grants revoked. Do not touch patient values, QR hashes/status, fixture passwords or phase-2 functions.
3. Confirm phase-3 approval/read/status now deny without clinical payload. Verify previously open phase-3 view hides records on next denial. Already viewed/copied values cannot be recalled.
4. Repeat production phase-2 patient CRUD, claim race/status/replay/expiry, role and table-denial smoke tests. `qr_request_status` remains original 002 throughout.
5. Retain grants table/functions for diagnosis with no app execution. Avoid DROP/CASCADE and do not run migrations out of sequence. Re-enabling later requires a reviewed grant change and fresh QA grants; revoked grants stay revoked.

## What breaks on rollback

Phase-3 preview approval, approval polling and shared record reads fail with generic service-unavailable/denial and clear values. Phase-2 production continues through its original functions. No existing phase-2 state is erased. Phase-3 audit does not yet exist; record the operator action separately, with no clinical values. If 004 was applied from the old revision that replaced qr_request_status, this rollback is NOT sufficient: restore that function from exact 002 first in the same reviewed transaction. Never apply the old revision now.

## Proposed owner approval

"Yes, use the existing synthetic PatientHeldRecord database for phase-3 QA. Apply the revised additive migration that leaves phase-2 functions unchanged, allow approval/scoped-read tests with synthetic accounts, and disable/revoke phase-3 QA grants if a check fails. Keep production on phase 2 and don't promote phase 3 until its live checks pass."

This records the shared-DB effect and fallback. It is not approval for real health data, global auth changes, deleting records, another audience or production promotion.
