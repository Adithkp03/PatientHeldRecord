import {createHash,randomBytes} from 'node:crypto';
import {z} from 'zod';
import {sections} from './contracts';
export const qrSelection=z.object({sections:z.array(z.enum(sections)).min(1).max(3).refine(x=>new Set(x).size===x.length)}).strict();
export const tokenSchema=z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const claimSchema=z.object({token:tokenSchema}).strict();
export function mintToken(){return randomBytes(32).toString('base64url');}
export function hashToken(token:string){return createHash('sha256').update(token).digest('hex');}
