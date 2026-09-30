-- Phase 3: no clinician table-level record access. Every read is authorized in DB.
create table public.consent_grants (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique references public.qr_requests(id),
 patient_id uuid not null references public.profiles(id),
 clinician_id uuid not null references public.profiles(id),
 allowed_sections public.record_section[] not null,
 issued_at timestamptz not null default now(),
 expires_at timestamptz not null default(now()+interval '10 minutes'),
 revoked_at timestamptz
);
alter table public.consent_grants enable row level security;
revoke all on public.consent_grants from anon,authenticated;
create function public.approve_qr_request(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); r public.qr_requests; g public.consent_grants;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='patient') then return jsonb_build_object('error','FORBIDDEN');end if;
 select * into r from public.qr_requests where id=p_request_id for update;
 if not found or r.patient_id!=actor then return jsonb_build_object('error','FORBIDDEN');end if;
 if r.status!='claimed' or r.clinician_id is null then return jsonb_build_object('error','NOT_APPROVED');end if;
 if exists(select 1 from public.consent_grants where request_id=r.id) then return jsonb_build_object('error','USED');end if;
 if r.expires_at<=now() then return jsonb_build_object('error','EXPIRED');end if;
 if not exists(select 1 from public.profiles where id=r.clinician_id and role='clinician') then return jsonb_build_object('error','FORBIDDEN');end if;
 insert into public.consent_grants(request_id,patient_id,clinician_id,allowed_sections) values(r.id,r.patient_id,r.clinician_id,r.selected_sections) returning * into g;
 return jsonb_build_object('grant_id',g.id,'patient_id',g.patient_id,'sections',g.allowed_sections,'expires_at',g.expires_at,'status','active');
end;$$;
create function public.read_shared_records(p_patient_id uuid,p_grant_id uuid,p_sections public.record_section[]) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); g public.consent_grants; records jsonb;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='clinician') then return jsonb_build_object('error','FORBIDDEN');end if;
 -- Shared row lock also defines the ordering boundary for future revoke updates.
 select * into g from public.consent_grants where id=p_grant_id for share;
 if not found then return jsonb_build_object('error','NOT_APPROVED');end if;
 if g.clinician_id!=actor or g.patient_id is distinct from p_patient_id then return jsonb_build_object('error','FORBIDDEN');end if;
 if g.revoked_at is not null then return jsonb_build_object('error','REVOKED');end if;
 if g.expires_at<=now() then return jsonb_build_object('error','EXPIRED');end if;
 if p_sections is null or cardinality(p_sections) not between 1 and 3 or array_position(p_sections,null) is not null or cardinality(p_sections)!=(select count(distinct x) from unnest(p_sections)x) then return jsonb_build_object('error','INVALID_REQUEST');end if;
 if not(p_sections <@ g.allowed_sections) then return jsonb_build_object('error','FORBIDDEN');end if;
 select coalesce(jsonb_agg(jsonb_build_object('section',section,'value',value,'updated_at',updated_at) order by section),'[]'::jsonb) into records from public.patient_records where owner_id=g.patient_id and section=any(p_sections);
 return jsonb_build_object('grant_id',g.id,'sections',p_sections,'expires_at',g.expires_at,'records',records);
end;$$;
create or replace function public.qr_request_status(p_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.qr_requests; actor uuid:=auth.uid(); name text; g public.consent_grants; payload jsonb;
begin
 select * into r from public.qr_requests where id=p_id;
 if actor is null or r.id is null or (actor!=r.patient_id and actor is distinct from r.clinician_id) then return jsonb_build_object('error','FORBIDDEN');end if;
 select display_name into name from public.profiles where id=r.clinician_id;
 select * into g from public.consent_grants where request_id=r.id;
 payload:=jsonb_build_object('id',r.id,'sections',r.selected_sections,'expires_at',r.expires_at,'status',case when g.id is not null then 'approved' when r.expires_at<=now() then 'expired' else r.status end,'clinician_name',name,'approval','NOT_APPROVED');
 if g.id is not null then payload:=payload||jsonb_build_object('approval','APPROVED','grant',jsonb_build_object('grant_id',g.id,'patient_id',g.patient_id,'sections',g.allowed_sections,'expires_at',g.expires_at,'status',case when g.revoked_at is not null then 'revoked' when g.expires_at<=now() then 'expired' else 'active' end));end if;
 return payload;
end;$$;
revoke all on function public.approve_qr_request(uuid),public.read_shared_records(uuid,uuid,public.record_section[]) from public,anon;
grant execute on function public.approve_qr_request(uuid),public.read_shared_records(uuid,uuid,public.record_section[]) to authenticated;
