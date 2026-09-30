import {currentActor} from '@/lib/actor';
import {claimSchema,hashToken} from '@/lib/qr';
import {json,parseWrite,rpcStatus} from '@/lib/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);if(actor.role!=='clinician')return json({error:'FORBIDDEN'},403);
 const parsed=await parseWrite(request);if('error'in parsed)return json({error:parsed.error},parsed.status);
 const claim=claimSchema.safeParse(parsed.value);if(!claim.success)return json({error:'INVALID_REQUEST'},400);
 const {data,error}=await db.rpc('claim_qr_request',{p_token_hash:hashToken(claim.data.token)});
 if(error)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));return json(data);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
