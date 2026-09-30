-- Phase 1 only. No clinician record access is permitted.
create type public.record_section as enum ('allergies','medicines','recent_history');
create type public.app_role as enum ('patient','clinician');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role public.app_role not null,
 display_name text not null check (char_length(display_name) between 1 and 120)
);
create table public.patient_records (
 owner_id uuid not null references public.profiles(id) on delete cascade,
 section public.record_section not null,
 value jsonb not null default '{"entries":[]}'::jsonb,
 updated_at timestamptz not null default now(),
 primary key (owner_id, section),
 constraint valid_record_value check (jsonb_typeof(value)='object' and jsonb_typeof(value->'entries')='array' and jsonb_array_length(value->'entries')<=30 and octet_length(value::text)<=20000)
);
alter table public.profiles enable row level security;
alter table public.patient_records enable row level security;
revoke all on public.profiles, public.patient_records from anon;
grant select on public.profiles to authenticated;
grant select, insert, update on public.patient_records to authenticated;
create policy profile_self_read on public.profiles for select to authenticated using (id=auth.uid());
create policy patient_read on public.patient_records for select to authenticated using (
 owner_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='patient')
);
create policy patient_insert on public.patient_records for insert to authenticated with check (
 owner_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='patient')
);
create policy patient_update on public.patient_records for update to authenticated using (
 owner_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='patient')
) with check (
 owner_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='patient')
);
-- App users cannot assign or change their own role. Provision profiles server-side only.
-- Secure Supabase projects may disable automatic public-table exposure.
-- Provisioning runs only from a server-side seed process, never a browser.
grant usage on schema public to service_role;
grant select, insert on public.profiles, public.patient_records to service_role;
