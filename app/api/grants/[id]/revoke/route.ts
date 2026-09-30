import {z} from 'zod';
import {currentActor} from '@/lib/actor';
import {json,parseWrite,rpcStatus} from '@/lib/http';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);if(actor.role!=='patient')return json({error:'FORBIDDEN'},403);
 const parsed=await parseWrite(request);if('error'in parsed)return json({error:parsed.error},parsed.status);
 const id=z.uuid().safeParse((await params).id);if(!id.success||!z.object({}).strict().safeParse(parsed.value).success)return json({error:'INVALID_REQUEST'},400);
 const {data,error}=await db.rpc('revoke_consent_grant',{p_grant_id:id.data});if(error||!data)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));return json(data);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
