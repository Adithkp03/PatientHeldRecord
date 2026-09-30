create table public.qr_requests (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 patient_id uuid not null references public.profiles(id) on delete cascade,
 selected_sections public.record_section[] not null,
 clinician_id uuid references public.profiles(id),
 expires_at timestamptz not null default (now()+interval '60 seconds'),
 used_at timestamptz,
 status text not null default 'unclaimed' check(status in ('unclaimed','claimed'))
);
create table public.qr_claim_attempts (actor_id uuid not null references public.profiles(id) on delete cascade, attempted_at timestamptz not null default now());
create index qr_claim_attempt_rate on public.qr_claim_attempts(actor_id,attempted_at);
alter table public.qr_requests enable row level security;
alter table public.qr_claim_attempts enable row level security;
revoke all on public.qr_requests,public.qr_claim_attempts from anon,authenticated;
-- No direct table reads or writes. Functions are the only app-facing boundary.
create function public.create_qr_request(p_token_hash text,p_sections public.record_section[]) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid := auth.uid(); r public.qr_requests;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='patient') then return jsonb_build_object('error','FORBIDDEN');end if;
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_sections is null or cardinality(p_sections) not between 1 and 3 or array_position(p_sections,null) is not null or cardinality(p_sections)!=(select count(distinct x) from unnest(p_sections) x) then return jsonb_build_object('error','INVALID_REQUEST');end if;
 perform pg_advisory_xact_lock(hashtext(actor::text));
 -- Keep active request count bounded; regenerating invalidates old requests by expiry.
 update public.qr_requests set expires_at=now() where patient_id=actor and status='unclaimed' and expires_at>now();
 insert into public.qr_requests(token_hash,patient_id,selected_sections) values(p_token_hash,actor,p_sections) returning * into r;
 return jsonb_build_object('id',r.id,'sections',r.selected_sections,'expires_at',r.expires_at,'status',r.status);
end;$$;
create function public.claim_qr_request(p_token_hash text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid := auth.uid(); r public.qr_requests;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='clinician') then return jsonb_build_object('error','FORBIDDEN');end if;
 perform pg_advisory_xact_lock(hashtext(actor::text));
 if (select count(*) from public.qr_claim_attempts where actor_id=actor and attempted_at>now()-interval '1 minute')>=10 then return jsonb_build_object('error','RATE_LIMITED');end if;
 insert into public.qr_claim_attempts(actor_id) values(actor);
 -- Row lock serializes claims from different clinicians; second claimant sees USED.
 select * into r from public.qr_requests where token_hash=p_token_hash for update;
 if not found then return jsonb_build_object('error','FORBIDDEN');end if;
 if r.status!='unclaimed' then return jsonb_build_object('error','USED');end if;
 if r.expires_at<=now() then return jsonb_build_object('error','EXPIRED');end if;
 update public.qr_requests set clinician_id=actor,status='claimed',used_at=now() where id=r.id returning * into r;
 return jsonb_build_object('id',r.id,'sections',r.selected_sections,'expires_at',r.expires_at,'status','claimed','approval','NOT_APPROVED');
end;$$;
create function public.qr_request_status(p_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.qr_requests; actor uuid := auth.uid(); name text;
begin
 select * into r from public.qr_requests where id=p_id;
 if actor is null or r.id is null or (actor!=r.patient_id and actor is distinct from r.clinician_id) then return jsonb_build_object('error','FORBIDDEN');end if;
 select display_name into name from public.profiles where id=r.clinician_id;
 return jsonb_build_object('id',r.id,'sections',r.selected_sections,'expires_at',r.expires_at,'status',case when r.expires_at<=now() then 'expired' else r.status end,'clinician_name',name,'approval','NOT_APPROVED');
end;$$;
revoke all on function public.create_qr_request(text,public.record_section[]),public.claim_qr_request(text),public.qr_request_status(uuid) from public,anon;
grant execute on function public.create_qr_request(text,public.record_section[]),public.claim_qr_request(text),public.qr_request_status(uuid) to authenticated;
