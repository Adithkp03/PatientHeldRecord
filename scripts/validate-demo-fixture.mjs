import {readFile} from 'node:fs/promises';
const file=process.argv[2]||'fixtures/synthetic-generic-demo.json';
const f=JSON.parse(await readFile(file,'utf8'));
const keys=['schema_version','demo_id','display_name','synthetic','clinical_use','source','notice','sections'];
if(Object.keys(f).some(k=>!keys.includes(k))||f.synthetic!==true||f.clinical_use!==false)throw Error('Invalid fixture boundary');
if(Object.keys(f.sections).sort().join(',')!=='allergies,medicines,recent_history')throw Error('Invalid section set');
for(const section of Object.values(f.sections)){
 if(Object.keys(section).join(',')!=='entries'||section.entries.length>30)throw Error('Invalid section');
 for(const entry of section.entries){if(Object.keys(entry).sort().join(',')!=='detail,label'||!entry.label||entry.label.length>120||entry.detail.length>500)throw Error('Invalid entry');}
}
console.log('Generic synthetic fixture is valid. No database writes performed.');
