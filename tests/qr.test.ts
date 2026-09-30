import {beforeEach,describe,it,expect,vi} from 'vitest';
import {mintToken,hashToken,tokenSchema,qrSelection} from '../lib/qr';
const state=vi.hoisted(()=>({actor:null as null|{id:string;role:'patient'|'clinician'},rpc:vi.fn()}));
vi.mock('@/lib/actor',()=>({currentActor:async()=>({actor:state.actor,db:{rpc:state.rpc}})}));
import {POST as create} from '../app/api/qr-requests/route';
import {POST as claim} from '../app/api/qr-requests/claim/route';
import {GET as status} from '../app/api/qr-requests/[id]/route';
const req=(body:unknown)=>new Request('https://demo.invalid/api/qr-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{state.actor=null;state.rpc.mockReset();});
describe('opaque QR contract',()=>{
 it('mints 256-bit random opaque tokens with no identifiers',()=>{const a=mintToken(),b=mintToken();expect(a).not.toBe(b);expect(a).toHaveLength(43);expect(tokenSchema.safeParse(a).success).toBe(true);});
 it('stores a one-way SHA-256 hash not the raw token',()=>{const token=mintToken();expect(hashToken(token)).toHaveLength(64);expect(hashToken(token)).not.toContain(token);expect(hashToken(token)).toBe(hashToken(token));});
 it('rejects empty, duplicate, invalid and oversized selections',()=>{for(const sections of [[],['allergies','allergies'],['bad'],['allergies','medicines','recent_history','allergies']])expect(qrSelection.safeParse({sections}).success).toBe(false);});
 it('accepts only exact section contract, no patient overrides',()=>expect(qrSelection.safeParse({sections:['allergies'],patient_id:'a'}).success).toBe(false));
});
describe('QR routes with mocked RPC boundary, not live transactions',()=>{
 it('requires authenticated patient create and clinician claim',async()=>{expect((await create(req({sections:['allergies']}))).status).toBe(401);expect((await claim(req({token:mintToken()}))).status).toBe(401);state.actor={id:'c',role:'clinician'};expect((await create(req({sections:['allergies']}))).status).toBe(403);state.actor={id:'a',role:'patient'};expect((await claim(req({token:mintToken()}))).status).toBe(403);expect(state.rpc).not.toHaveBeenCalled();});
 it('create passes only token hash and selected sections to RPC',async()=>{state.actor={id:'a',role:'patient'};state.rpc.mockResolvedValue({data:{id:'request',expires_at:'2026-09-30T10:00:00Z',status:'unclaimed',sections:['allergies']},error:null});const r=await create(req({sections:['allergies']}));const d=await r.json();expect(r.status).toBe(201);expect(r.headers.get('cache-control')).toBe('no-store');expect(state.rpc.mock.calls[0][1]).toEqual({p_token_hash:hashToken(d.token),p_sections:['allergies']});expect(d).not.toHaveProperty('patient_id');});
 it('claim hashes raw input, returns no record content',async()=>{state.actor={id:'c',role:'clinician'};state.rpc.mockResolvedValue({data:{id:'request',sections:['medicines'],approval:'NOT_APPROVED',status:'claimed'},error:null});const token=mintToken();const r=await claim(req({token}));expect(state.rpc).toHaveBeenCalledWith('claim_qr_request',{p_token_hash:hashToken(token)});expect(await r.json()).toEqual({id:'request',sections:['medicines'],approval:'NOT_APPROVED',status:'claimed'});});
 it('expired and replay claims and rate limits fail',async()=>{state.actor={id:'c',role:'clinician'};for(const [error,code] of [['EXPIRED',410],['USED',409],['RATE_LIMITED',429],['FORBIDDEN',403]] as const){state.rpc.mockResolvedValue({data:{error},error:null});expect((await claim(req({token:mintToken()}))).status).toBe(code);}});
 it('invalid token avoids DB and malformed JSON fails',async()=>{state.actor={id:'c',role:'clinician'};expect((await claim(req({token:'abc'}))).status).toBe(400);expect(state.rpc).not.toHaveBeenCalled();expect((await claim(new Request(req({}).url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{' }))).status).toBe(400);});
 it('cross-origin writes fail before RPC',async()=>{state.actor={id:'c',role:'clinician'};expect((await claim(new Request(req({}).url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://attacker.invalid'},body:JSON.stringify({token:mintToken()})}))).status).toBe(403);expect(state.rpc).not.toHaveBeenCalled();});
 it('status denies others and returns no token/hash or clinical fields',async()=>{state.actor={id:'b',role:'patient'};state.rpc.mockResolvedValue({data:{error:'FORBIDDEN'},error:null});const context={params:Promise.resolve({id:'8ba13da6-4998-4c8b-808a-b967b9d0251b'})};expect((await status(new Request('https://demo.invalid/api/qr-requests/id'),context)).status).toBe(403);});
 it('service RPC failures fail closed',async()=>{state.actor={id:'c',role:'clinician'};state.rpc.mockResolvedValue({data:null,error:{message:'db down'}});const r=await claim(req({token:mintToken()}));expect(r.status).toBe(503);expect(await r.text()).not.toContain('db down');});
});
