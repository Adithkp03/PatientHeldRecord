import {currentActor} from '@/lib/actor';
import {qrSelection,mintToken,hashToken} from '@/lib/qr';
import {json,parseWrite,rpcStatus} from '@/lib/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const {db,actor}=await currentActor();if(!actor)return json({error:'UNAUTHENTICATED'},401);if(actor.role!=='patient')return json({error:'FORBIDDEN'},403);
 const parsed=await parseWrite(request);if('error'in parsed)return json({error:parsed.error},parsed.status);
 const selected=qrSelection.safeParse(parsed.value);if(!selected.success)return json({error:'INVALID_REQUEST'},400);
 const token=mintToken();const {data,error}=await db.rpc('create_qr_request',{p_token_hash:hashToken(token),p_sections:selected.data.sections});
 if(error)return json({error:'SERVICE_UNAVAILABLE'},503);if(data.error)return json({error:data.error},rpcStatus(data.error));
 return json({...data,token},201);
 }catch{return json({error:'SERVICE_UNAVAILABLE'},503);}}
