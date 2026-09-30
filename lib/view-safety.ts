import {z} from 'zod';
import {recordSchema,sections,type Section} from './contracts';
const sharedPayload=z.object({grant_id:z.uuid(),sections:z.array(z.enum(sections)).min(1).max(3),expires_at:z.iso.datetime({offset:true}),records:z.array(z.object({section:z.enum(sections),value:recordSchema}).passthrough()).max(3)}).passthrough();
export function verifiedSummary(data:unknown,grant:{grant_id:string;sections:Section[];expires_at:string}){
 const p=sharedPayload.safeParse(data);if(!p.success)return null;
 if(p.data.grant_id!==grant.grant_id||Date.parse(p.data.expires_at)!==Date.parse(grant.expires_at))return null;
 if(p.data.sections.length!==grant.sections.length||new Set(p.data.sections).size!==p.data.sections.length||!p.data.sections.every(s=>grant.sections.includes(s)))return null;
 if(new Set(p.data.records.map(r=>r.section)).size!==p.data.records.length||!p.data.records.every(r=>grant.sections.includes(r.section)))return null;
 return p.data.records;
}
// A late response must never restore values after logout, offline, denial or a newer check.
export function responseEpoch(){let epoch=0;return {next:()=>++epoch,current:(candidate:number)=>candidate===epoch,invalidate:()=>{epoch++;}};}
