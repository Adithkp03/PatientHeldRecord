-- Repair for projects that applied 001 before its explicit seed grants.
-- Idempotent. Does not change authenticated/anon grants or RLS policies.
grant usage on schema public to service_role;
grant select, insert on public.profiles, public.patient_records to service_role;
