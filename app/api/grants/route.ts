import {currentActor} from '@/lib/actor';
import {json,rpcStatus} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);if(actor.role!=='patient')return json({error:'FORBIDDEN'},403);
 if(new URL(request.url).search)return json({error:'INVALID_REQUEST'},400);
 const {data,error}=await db.rpc('patient_consent_grants');if(error||!data)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));return json(data);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
