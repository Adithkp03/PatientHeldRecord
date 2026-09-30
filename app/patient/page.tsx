import {currentActor} from '@/lib/actor';
import {redirect} from 'next/navigation';
import Editor from './editor';
import Share from './share';
import Access from './access';
import {signOut} from '../login/actions';
export const dynamic='force-dynamic';
export default async function Patient() {
  let session; try {session=await currentActor();} catch {return <section><h1>Setup is not complete</h1><p>Connect the prototype database before signing in. No records have been loaded.</p></section>;}
  if (!session.actor) redirect('/login');
  if (session.actor.role !== 'patient') return <section><h1>Patient access only</h1><p>Clinician sharing is not built yet.</p><form action={signOut}><button>Sign out</button></form></section>;
  return <section><div className="row"><h1>Your record</h1><form action={signOut}><button>Sign out</button></form></div><p>Only synthetic examples belong here. Save each section separately.</p><Share/><Access/><Editor/></section>;
}
