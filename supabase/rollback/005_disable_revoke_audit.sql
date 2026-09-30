begin;
-- Retain append-only history and all revoked_at values. Never revive revoked grants.
-- Restore phase-3 public implementations, disabling phase-4 app endpoints.
drop function public.approve_qr_request(uuid);
drop function public.read_shared_records(uuid,uuid,public.record_section[]);
alter function public.phase3_approve_impl(uuid) rename to approve_qr_request;
alter function public.phase3_read_impl(uuid,uuid,public.record_section[]) rename to read_shared_records;
grant execute on function public.approve_qr_request(uuid),public.read_shared_records(uuid,uuid,public.record_section[]) to authenticated;
revoke all on function public.revoke_consent_grant(uuid),public.patient_consent_grants(),public.patient_access_events(bigint) from public,anon,authenticated,service_role;
commit;
