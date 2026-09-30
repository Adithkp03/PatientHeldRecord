-- Execute only after stopping phase-3 QA and restoring phase-2 app deployment.
-- Do not drop tables or records. Retain grants for diagnosis but disable all new use.
-- Begin/commit makes disable + invalidation atomic; all live phase-2 RPCs remain.
begin;
revoke all on function public.approve_qr_request(uuid),public.read_shared_records(uuid,uuid,public.record_section[]),public.qr_request_consent_status(uuid) from authenticated,anon,public;
update public.consent_grants set revoked_at=coalesce(revoked_at,now());
commit;
-- Existing phase-3 browser refreshes fail and must clear their displayed records.
-- Data already viewed/copied cannot be recalled. No test says otherwise.
-- Re-enabling requires explicit approval, grants stay revoked, and fresh QR/approval.
