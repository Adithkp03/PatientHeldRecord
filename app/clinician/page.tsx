import {currentActor} from '@/lib/actor';
import {redirect} from 'next/navigation';
import {signOut} from '../login/actions';
import Scanner from './scanner';
export const dynamic='force-dynamic';
export default async function Clinician(){let session;try{session=await currentActor();}catch{return <h1>Database setup required</h1>;}if(!session.actor)redirect('/login');if(session.actor.role!=='clinician')return <section><h1>Clinician access only</h1><a href="/patient">Your record</a></section>;return <section><div className="row"><h1>Clinician claim</h1><form action={signOut}><button>Sign out</button></form></div><p>Use a pre-enrolled synthetic clinician account. Scanning does not authorize record access.</p><Scanner/></section>;}
