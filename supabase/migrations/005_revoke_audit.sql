begin;
-- Phase 4 stores fixed metadata only, never token hashes or medical values.
create table public.access_events (
 id bigint generated always as identity primary key,
 actor_id uuid not null,
 patient_id uuid not null,
 grant_id uuid not null references public.consent_grants(id),
 action text not null check(action in ('approve','read','revoke')),
 outcome text not null check(outcome in ('ALLOWED','REVOKED','EXPIRED','FORBIDDEN','INVALID_REQUEST','ALREADY_REVOKED')),
 sections public.record_section[] not null default '{}',
 occurred_at timestamptz not null default clock_timestamp()
);
create index access_events_patient_time on public.access_events(patient_id,occurred_at desc,id desc);
alter table public.access_events enable row level security;
revoke all on public.access_events from public,anon,authenticated,service_role;
revoke all on sequence public.access_events_id_seq from public,anon,authenticated,service_role;
-- Keep exact phase-3 authorization body as a non-callable implementation.
alter function public.approve_qr_request(uuid) rename to phase3_approve_impl;
alter function public.read_shared_records(uuid,uuid,public.record_section[]) rename to phase3_read_impl;
revoke all on function public.phase3_approve_impl(uuid),public.phase3_read_impl(uuid,uuid,public.record_section[]) from public,anon,authenticated,service_role;
create function public.approve_qr_request(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb; g public.consent_grants;
begin
 result:=public.phase3_approve_impl(p_request_id);
 if not(result ? 'error') then
  select * into g from public.consent_grants where id=(result->>'grant_id')::uuid;
  insert into public.access_events(actor_id,patient_id,grant_id,action,outcome,sections) values(auth.uid(),g.patient_id,g.id,'approve','ALLOWED',g.allowed_sections);
 end if;
 return result;
end;$$;
create function public.read_shared_records(p_patient_id uuid,p_grant_id uuid,p_sections public.record_section[]) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb; g public.consent_grants; code text;
begin
 result:=public.phase3_read_impl(p_patient_id,p_grant_id,p_sections);
 -- Attribute denial to the actual grant owner, never caller-supplied patient ID.
 select * into g from public.consent_grants where id=p_grant_id;
 if auth.uid() is not null and g.id is not null then
  code:=coalesce(result->>'error','ALLOWED');
  if code in ('ALLOWED','REVOKED','EXPIRED','FORBIDDEN','INVALID_REQUEST') then
   insert into public.access_events(actor_id,patient_id,grant_id,action,outcome,sections) values(auth.uid(),g.patient_id,g.id,'read',code,case when code='ALLOWED' then p_sections else '{}'::public.record_section[] end);
  end if;
 end if;
 return result;
end;$$;
create function public.revoke_consent_grant(p_grant_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); g public.consent_grants; repeated boolean;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='patient') then return jsonb_build_object('error','FORBIDDEN');end if;
 select * into g from public.consent_grants where id=p_grant_id for update;
 if not found or g.patient_id!=actor then return jsonb_build_object('error','FORBIDDEN');end if;
 repeated:=g.revoked_at is not null;
 if not repeated then update public.consent_grants set revoked_at=clock_timestamp() where id=g.id returning * into g;end if;
 insert into public.access_events(actor_id,patient_id,grant_id,action,outcome) values(actor,g.patient_id,g.id,'revoke',case when repeated then 'ALREADY_REVOKED' else 'REVOKED' end);
 return jsonb_build_object('grant_id',g.id,'status','revoked','revoked_at',g.revoked_at);
end;$$;
create function public.patient_consent_grants() returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='patient') then return jsonb_build_object('error','FORBIDDEN');end if;
 return jsonb_build_object('grants',(select coalesce(jsonb_agg(to_jsonb(x) order by x.issued_at desc),'[]'::jsonb) from (select g.id as grant_id,p.display_name as clinician_name,g.allowed_sections as sections,g.issued_at,g.expires_at,g.revoked_at,case when g.revoked_at is not null then 'revoked' when g.expires_at<=now() then 'expired' else 'active' end as status from public.consent_grants g join public.profiles p on p.id=g.clinician_id where g.patient_id=auth.uid() order by g.issued_at desc limit 50)x));
end;$$;
create function public.patient_access_events(p_before bigint default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='patient') then return jsonb_build_object('error','FORBIDDEN');end if;
 return jsonb_build_object('events',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id::text,'grant_id',x.grant_id,'actor_name',x.actor_name,'action',x.action,'outcome',x.outcome,'sections',x.sections,'occurred_at',x.occurred_at) order by x.id desc),'[]'::jsonb) from (select e.id,e.grant_id,p.display_name as actor_name,e.action,e.outcome,e.sections,e.occurred_at from public.access_events e left join public.profiles p on p.id=e.actor_id where e.patient_id=auth.uid() and (p_before is null or e.id<p_before) order by e.id desc limit 50)x));
end;$$;
revoke all on function public.approve_qr_request(uuid),public.read_shared_records(uuid,uuid,public.record_section[]),public.revoke_consent_grant(uuid),public.patient_consent_grants(),public.patient_access_events(bigint) from public,anon,service_role;
grant execute on function public.approve_qr_request(uuid),public.read_shared_records(uuid,uuid,public.record_section[]),public.revoke_consent_grant(uuid),public.patient_consent_grants(),public.patient_access_events(bigint) to authenticated;
commit;
