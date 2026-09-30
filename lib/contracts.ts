import { z } from 'zod';
export const sections = ['allergies', 'medicines', 'recent_history'] as const;
export type Section = typeof sections[number];
export const sectionSchema = z.enum(sections);
export const labels: Record<Section, string> = { allergies: 'Allergies', medicines: 'Medicines', recent_history: 'Recent history' };
export const recordSchema = z.object({ entries: z.array(z.object({ label: z.string().trim().min(1).max(120), detail: z.string().trim().max(500) }).strict()).max(30) }).strict();
export type RecordValue = z.infer<typeof recordSchema>;
export type Actor = { id: string; role: 'patient' | 'clinician' };
export function authorizeOwner(actor: Actor | null, ownerId: string) {
  if (!actor) return { status: 401, code: 'UNAUTHENTICATED' } as const;
  if (actor.role !== 'patient' || actor.id !== ownerId) return { status: 403, code: 'FORBIDDEN' } as const;
  return null;
}
