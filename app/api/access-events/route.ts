import {currentActor} from '@/lib/actor';
import {json,rpcStatus} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);if(actor.role!=='patient')return json({error:'FORBIDDEN'},403);
 const q=new URL(request.url).searchParams,before=q.get('before');
 if([...q.keys()].some(k=>k!=='before')||q.getAll('before').length>1||(before!==null&&(!/^[1-9]\d{0,18}$/.test(before)||BigInt(before)>BigInt('9223372036854775807'))))return json({error:'INVALID_REQUEST'},400);
 const {data,error}=await db.rpc('patient_access_events',{p_before:before});if(error||!data)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));return json(data);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
