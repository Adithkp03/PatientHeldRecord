import {z} from 'zod';
import {sections} from './contracts';
export const approvalSchema=z.object({request_id:z.uuid()}).strict();
export const sharedReadSchema=z.object({patientId:z.uuid(),grant_id:z.uuid(),sections:z.array(z.enum(sections)).min(1).max(3).refine(s=>new Set(s).size===s.length)}).strict();
