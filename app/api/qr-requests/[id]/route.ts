import {currentActor} from '@/lib/actor';
import {json,rpcStatus} from '@/lib/http';
import {z} from 'zod';
export const dynamic='force-dynamic';
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);
 const id=z.uuid().safeParse((await params).id);if(!id.success)return json({error:'INVALID_REQUEST'},400);
 const {data,error}=await db.rpc('qr_request_status',{p_id:id.data});if(error)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));return json(data);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
