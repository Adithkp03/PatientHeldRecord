import {currentActor} from '@/lib/actor';
import {sharedReadSchema} from '@/lib/consent';
import {json,rpcStatus} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{patientId:string}>}){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);if(actor.role!=='clinician')return json({error:'FORBIDDEN'},403);
 const query=new URL(request.url).searchParams;
 if([...query.keys()].some(k=>!['grant_id','sections'].includes(k))||query.getAll('grant_id').length!==1||query.getAll('sections').length!==1)return json({error:'INVALID_REQUEST'},400);
 const parsed=sharedReadSchema.safeParse({patientId:(await params).patientId,grant_id:query.get('grant_id'),sections:query.get('sections')?.split(',')});if(!parsed.success)return json({error:'INVALID_REQUEST'},400);
 const {data,error}=await db.rpc('read_shared_records',{p_patient_id:parsed.data.patientId,p_grant_id:parsed.data.grant_id,p_sections:parsed.data.sections});
 if(error)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));return json(data);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
