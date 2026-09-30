import {currentActor} from '@/lib/actor';
import {redirect} from 'next/navigation';
import Editor from './editor';
import Share from './share';
import {signOut} from '../login/actions';
export const dynamic='force-dynamic';
export default async function Patient() {
  let session; try {session=await currentActor();} catch {return <section><h1>Setup is not complete</h1><p>Connect the prototype database before signing in. No records have been loaded.</p></section>;}
  if (!session.actor) redirect('/login');
  if (session.actor.role !== 'patient') return <section><h1>Patient access only</h1><p>This workspace is for patients. Use the clinician workspace to claim requests.</p><form action={signOut}><button>Sign out</button></form></section>;
  return <section><div className="workspace-heading"><div><p className="eyebrow">PATIENT WORKSPACE</p><h1>Your record</h1><p>All your details in one place. Save each section separately.</p></div><form action={signOut}><button className="secondary">Sign out</button></form></div><div className="workspace-banner"><span className="status-dot"/><span>Synthetic data only. Do not enter real patient information.</span></div><div className="workspace-grid"><aside className="sharing-column"><Share/><div className="sidebar-note"><strong>You stay in control of the request.</strong><p>Only your own record is editable here. The QR contains an opaque token, not medical information.</p></div></aside><div className="record-column"><div className="record-heading"><span className="eyebrow">RECORD SECTIONS</span><span>03 sections</span></div><Editor/></div></div></section>;
}
