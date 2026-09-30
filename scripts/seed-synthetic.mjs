import {createClient} from '@supabase/supabase-js';
const {NEXT_PUBLIC_SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key,SYNTHETIC_SEED_PASSWORD:password}=process.env;
if(!url||!key||!password||password.length<16) throw Error('Provide URL, server-only service key and a seed password of at least 16 characters.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const people=[['patient-a@example.invalid','Synthetic Patient A','patient'],['patient-b@example.invalid','Synthetic Patient B','patient'],['clinician@example.invalid','Synthetic Clinician','clinician']];
// Dedicated synthetic project only. Resume incomplete seed without replacing passwords.
const existing=[];
for(let page=1;;page++){
 const {data,error}=await db.auth.admin.listUsers({page,perPage:100});
 if(error)throw Error('Fixture account lookup failed.');
 existing.push(...data.users);
 if(data.users.length<100)break;
 if(page>=20)throw Error('Too many accounts for a dedicated synthetic fixture project.');
}
for(const [email,display_name,role] of people){
 let user=existing.find(u=>u.email===email);
 if(!user){const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true});if(error)throw Error('Fixture creation failed.');user=data.user;}
 const id=user.id;
 const {data:profile,error:readError}=await db.from('profiles').select('id,role,display_name').eq('id',id).maybeSingle();
 if(readError)throw Error('Fixture profile lookup failed. Apply migration 003 explicit seed privileges.');
 if(profile&&(profile.role!==role||profile.display_name!==display_name))throw Error('Existing fixture profile differs. Stop for manual review.');
 if(!profile){const {error}=await db.from('profiles').insert({id,display_name,role});if(error)throw Error('Fixture profile failed.');}
 if(role==='patient')for(const section of ['allergies','medicines','recent_history']){
  const {data:record,error:recordReadError}=await db.from('patient_records').select('section').eq('owner_id',id).eq('section',section).maybeSingle();
  if(recordReadError)throw Error('Fixture record lookup failed.');
  if(!record){const {error}=await db.from('patient_records').insert({owner_id:id,section,value:{entries:section==='allergies'?[{label:'Synthetic example allergy',detail:'Demo only, not a real patient.'}]:[]}});if(error)throw Error('Fixture record failed.');}
 }
 console.log('Synthetic fixture ready:',email);
}
