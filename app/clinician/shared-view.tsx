'use client';
import {useEffect,useState} from 'react';
import {labels,sections,type Section,type RecordValue} from '@/lib/contracts';
export type Grant={grant_id:string;patient_id:string;sections:Section[];expires_at:string;status:string};
export default function SharedView({grant}:{grant:Grant}){
 const [records,setRecords]=useState<{section:Section;value:RecordValue}[]>([]),[status,setStatus]=useState('Loading approved sections...');
 useEffect(()=>{let disposed=false;const controller=new AbortController();async function refresh(){try{
   if(document.hidden){setRecords([]);return;}
   if(Date.parse(grant.expires_at)<=Date.now()||grant.status!=='active'){setRecords([]);setStatus('Access ended. No records shown.');return;}
   const path=`/api/shared-records/${grant.patient_id}?grant_id=${encodeURIComponent(grant.grant_id)}&sections=${grant.sections.join(',')}`;
   const response=await fetch(path,{cache:'no-store',signal:controller.signal});const data=await response.json();if(disposed)return;
   if(document.hidden||Date.parse(grant.expires_at)<=Date.now()){setRecords([]);return;}
   if(!response.ok){setRecords([]);setStatus('Access denied. Records hidden. Sign in again or ask for a new grant.');return;}
   setRecords(data.records);setStatus('Approved sections loaded from the server.');
  }catch{if(!disposed){setRecords([]);setStatus('Cannot verify access. Records hidden. Check your connection.');}}}
  refresh();const expiry=setTimeout(()=>{setRecords([]);setStatus('Grant expired. Records hidden.');},Math.min(2147483647,Math.max(0,Date.parse(grant.expires_at)-Date.now())));const interval=setInterval(refresh,5000);const visibility=()=>{if(document.hidden){setRecords([]);setStatus('Records hidden while this tab is not active.');}else refresh();};document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;controller.abort();clearInterval(interval);clearTimeout(expiry);document.removeEventListener('visibilitychange',visibility);};},[grant.grant_id,grant.expires_at,grant.status]);
 return <article className="panel"><h2>Approved summary</h2><p>Access expires at {new Date(grant.expires_at).toLocaleTimeString()}. Every refresh checks permission on the server.</p><p role="status">{status}</p>{sections.map(section=><div key={section}><h3>{labels[section]}</h3>{!grant.sections.includes(section)?<p>Not shared.</p>:records.find(r=>r.section===section)?.value.entries.map((entry,i)=><p key={i}><strong>{entry.label}</strong><br/>{entry.detail}</p>)}</div>)}<p>Absent entries do not mean a clinical condition is ruled out. Synthetic data only.</p></article>;
}
