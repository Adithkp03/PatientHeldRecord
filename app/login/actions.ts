'use server';
import {supabase} from '@/lib/supabase';
import {redirect} from 'next/navigation';
export async function signIn(form:FormData) {
  const email=String(form.get('email')||'').trim(), password=String(form.get('password')||'');
  if (!email || !password) redirect('/login?error=1');
  try { const db=await supabase(); const {error}=await db.auth.signInWithPassword({email,password}); if(error) redirect('/login?error=1'); } catch(e) { if (e && typeof e==='object' && 'digest' in e) throw e; redirect('/login?error=1'); }
  redirect('/patient');
}
export async function signOut() { const db=await supabase(); await db.auth.signOut(); redirect('/login'); }
