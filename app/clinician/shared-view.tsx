'use client';
import {useEffect,useState} from 'react';
import {labels,sections,type Section,type RecordValue} from '@/lib/contracts';
import {verifiedSummary,responseEpoch} from '@/lib/view-safety';
export type Grant={grant_id:string;patient_id:string;sections:Section[];expires_at:string;status:string};
export default function SharedView({grant}:{grant:Grant}){
 const [records,setRecords]=useState<{section:Section;value:RecordValue}[]>([]),[status,setStatus]=useState('Loading approved sections...');
 useEffect(()=>{let disposed=false;const controller=new AbortController(),epoch=responseEpoch();function clear(message:string){epoch.invalidate();setRecords([]);setStatus(message);}async function refresh(){const check=epoch.next();const requestController=new AbortController();const timeout=setTimeout(()=>requestController.abort(),8000);try{
   if(document.hidden||!navigator.onLine){clear('Offline or inactive. Records hidden until a fresh server check.');return;}
   if(Date.parse(grant.expires_at)<=Date.now()||grant.status!=='active'){setRecords([]);setStatus('Access ended. No records shown.');return;}
   const path=`/api/shared-records/${grant.patient_id}?grant_id=${encodeURIComponent(grant.grant_id)}&sections=${grant.sections.join(',')}`;
   const response=await fetch(path,{cache:'no-store',signal:AbortSignal.any([controller.signal,requestController.signal])});const data=await response.json();if(disposed||!epoch.current(check))return;
   if(document.hidden||!navigator.onLine||Date.parse(grant.expires_at)<=Date.now()){clear('Access cannot be verified. Records hidden.');return;}
   if(!response.ok){clear('Access denied. Records hidden. Sign in again or ask for a new grant.');return;}
   const safe=verifiedSummary(data,grant);if(!safe){clear('Invalid server response. Records hidden.');return;}setRecords(safe);setStatus('Approved sections loaded from the server.');
  }catch{if(!disposed&&epoch.current(check)){clear('Cannot verify access. Records hidden. Check your connection.');}}finally{clearTimeout(timeout);}}
  refresh();const expiry=setTimeout(()=>{clear('Grant expired. Records hidden.');},Math.min(2147483647,Math.max(0,Date.parse(grant.expires_at)-Date.now())));const interval=setInterval(refresh,5000);const visibility=()=>{if(document.hidden){clear('Records hidden while this tab is not active.');}else refresh();};document.addEventListener('visibilitychange',visibility);const offline=()=>clear('Offline. Records hidden until a fresh server check.');window.addEventListener('offline',offline);window.addEventListener('online',refresh);
  return()=>{disposed=true;epoch.invalidate();controller.abort();clearInterval(interval);clearTimeout(expiry);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('offline',offline);window.removeEventListener('online',refresh);};},[grant.grant_id,grant.expires_at,grant.status]);
 return <article className="panel"><h2>Approved summary</h2><p>Access expires at {new Date(grant.expires_at).toLocaleTimeString()}. Every refresh checks permission on the server.</p><p role="status">{status}</p>{sections.map(section=><div key={section}><h3>{labels[section]}</h3>{!grant.sections.includes(section)?<p>Not shared.</p>:records.find(r=>r.section===section)?.value.entries.map((entry,i)=><p key={i}><strong>{entry.label}</strong><br/>{entry.detail}</p>)}</div>)}<p>Absent entries do not mean a clinical condition is ruled out. Synthetic data only.</p></article>;
}
