import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {recordSchema,sections} from '../lib/contracts';
const f=JSON.parse(readFileSync('fixtures/synthetic-generic-demo.json','utf8'));
describe('independently written public demo fixture',()=>{
 it('is synthetic, nonclinical and attributed honestly',()=>{expect(f.synthetic).toBe(true);expect(f.clinical_use).toBe(false);expect(f.source).toContain('Independently authored');expect(f.notice).toContain('Fictional');});
 it('has only three validated record sections',()=>{expect(Object.keys(f.sections).sort()).toEqual([...sections].sort());for(const section of sections)expect(recordSchema.safeParse(f.sections[section]).success).toBe(true);});
 it('contains no source identifiers, terminology codes, credentials or demographics',()=>{const body=JSON.stringify(f);expect(body).not.toMatch(/\b(?:PATIENT|ENCOUNTER|SNOMED|RxNorm|SSN|passport|insurance|billing|dose_mg|api_key|password)\b/i);expect(body).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);});
});
