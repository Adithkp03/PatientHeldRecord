import 'server-only';
import { supabase } from './supabase';
export async function currentActor() {
  const db = await supabase();
  const {data: {user}, error} = await db.auth.getUser();
  if (error || !user) return { db, actor: null };
  const { data } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!data || !['patient','clinician'].includes(data.role)) return { db, actor: null };
  return { db, actor: { id:user.id, role:data.role as 'patient'|'clinician' } };
}
