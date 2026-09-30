import { NextResponse } from 'next/server';
import { currentActor } from '@/lib/actor';
import { sectionSchema, recordSchema, authorizeOwner } from '@/lib/contracts';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status=200) => NextResponse.json(body, {status, headers:{'Cache-Control':'no-store','Pragma':'no-cache'}});
type Context = {params:Promise<{section:string}>};
async function handle(request: Request, context: Context, write: boolean) {
  try {
    const {db,actor} = await currentActor();
    if (!actor) return reply({error:'UNAUTHENTICATED'},401);
    const denied = authorizeOwner(actor, actor.id);
    if (denied) return reply({error:denied.code},denied.status);
    const section = sectionSchema.safeParse((await context.params).section);
    if (!section.success) return reply({error:'INVALID_SECTION'},400);
    if ([...new URL(request.url).searchParams].length) return reply({error:'INVALID_REQUEST'},400);
    if (write) {
      if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({error:'INVALID_REQUEST'},415);
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) return reply({error:'FORBIDDEN'},403);
      const length = Number(request.headers.get('content-length') || 0);
      if (length > 20000) return reply({error:'INVALID_RECORD'},413);
      const text = await request.text();
      if (text.length > 20000) return reply({error:'INVALID_RECORD'},413);
      let raw: unknown;
      try { raw = JSON.parse(text); } catch { return reply({error:'INVALID_RECORD'},400); }
      const value = recordSchema.safeParse(raw);
      if (!value.success) return reply({error:'INVALID_RECORD'},400);
      const {error} = await db.from('patient_records').upsert({owner_id:actor.id, section:section.data, value:value.data, updated_at:new Date().toISOString()}, {onConflict:'owner_id,section'});
      return error ? reply({error:'SAVE_FAILED'},500) : reply({saved:true});
    }
    const {data,error} = await db.from('patient_records').select('section,value,updated_at').eq('owner_id',actor.id).eq('section',section.data).maybeSingle();
    return error ? reply({error:'READ_FAILED'},500) : reply({record:data ?? {section:section.data,value:{entries:[]},updated_at:null}});
  } catch { return reply({error:'SERVICE_UNAVAILABLE'},503); }
}
export const GET = (r:Request,c:Context) => handle(r,c,false);
export const PUT = (r:Request,c:Context) => handle(r,c,true);
