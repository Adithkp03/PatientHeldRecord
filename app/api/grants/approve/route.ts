import {currentActor} from '@/lib/actor';
import {approvalSchema} from '@/lib/consent';
import {json,parseWrite,rpcStatus} from '@/lib/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);if(actor.role!=='patient')return json({error:'FORBIDDEN'},403);
 const parsed=await parseWrite(request);if('error'in parsed)return json({error:parsed.error},parsed.status);
 const approved=approvalSchema.safeParse(parsed.value);if(!approved.success)return json({error:'INVALID_REQUEST'},400);
 const {data,error}=await db.rpc('approve_qr_request',{p_request_id:approved.data.request_id});
 if(error)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));return json(data,201);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
