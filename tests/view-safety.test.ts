import {describe,it,expect} from 'vitest';
import {verifiedSummary,responseEpoch} from '../lib/view-safety';
const grant={grant_id:'29498956-7153-4b0a-99e7-7dff236ef847',sections:['allergies','medicines'] as ('allergies'|'medicines')[],expires_at:'2026-09-30T18:00:00+05:30'};
const payload=()=>({...grant,records:[{section:'allergies',value:{entries:[{label:'Fictional',detail:'Demo only'}]}}]});
describe('client safe summary and late response invalidation',()=>{
 it('accepts only matching valid summary',()=>expect(verifiedSummary(payload(),grant)?.length).toBe(1));
 it('denies malformed clinical payload',()=>{expect(verifiedSummary({...payload(),records:[{section:'allergies',value:{entries:[{label:'',detail:'x'}]}}]},grant)).toBeNull();expect(verifiedSummary({records:[]},grant)).toBeNull();});
 it('denies withheld/duplicate record sections',()=>{expect(verifiedSummary({...payload(),records:[{section:'recent_history',value:{entries:[]}}]},grant)).toBeNull();expect(verifiedSummary({...payload(),records:[...payload().records,...payload().records]},grant)).toBeNull();});
 it('denies changed grant, expiry or subset contract',()=>{expect(verifiedSummary({...payload(),grant_id:'8ba13da6-4998-4c8b-808a-b967b9d0251b'},grant)).toBeNull();expect(verifiedSummary({...payload(),expires_at:'2026-09-30T19:00:00+05:30'},grant)).toBeNull();expect(verifiedSummary({...payload(),sections:['allergies']},grant)).toBeNull();expect(verifiedSummary({...payload(),sections:['allergies','allergies']},grant)).toBeNull();});
 it('offline/logout invalidate an in-flight successful response',()=>{const e=responseEpoch(),before=e.next();e.invalidate();expect(e.current(before)).toBe(false);expect(e.current(e.next())).toBe(true);});
 it('newer denied read wins over older allowed response',()=>{const e=responseEpoch(),old=e.next(),newer=e.next();expect(e.current(old)).toBe(false);expect(e.current(newer)).toBe(true);e.invalidate();expect(e.current(newer)).toBe(false);});
});
