import {createClient} from '@supabase/supabase-js';
const {NEXT_PUBLIC_SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key,SYNTHETIC_SEED_PASSWORD:password}=process.env;
if(!url||!key||!password||password.length<16) throw Error('Provide URL, server-only service key and a seed password of at least 16 characters.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const people=[['patient-a@example.invalid','Synthetic Patient A','patient'],['patient-b@example.invalid','Synthetic Patient B','patient'],['clinician@example.invalid','Synthetic Clinician','clinician']];
for(const [email,display_name,role] of people){
 const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true});
 if(error) throw Error('Fixture creation failed. Stop and check existing accounts.');
 const id=data.user.id;
 const {error:profileError}=await db.from('profiles').insert({id,display_name,role});
 if(profileError) throw Error('Fixture profile failed.');
 if(role==='patient'){
  const {error:recordError}=await db.from('patient_records').insert(['allergies','medicines','recent_history'].map(section=>({owner_id:id,section,value:{entries:section==='allergies'?[{label:'Synthetic example allergy',detail:'Demo only, not a real patient.'}]:[]}})));
  if(recordError) throw Error('Fixture record failed.');
 }
 console.log('Created synthetic fixture:',email);
}
