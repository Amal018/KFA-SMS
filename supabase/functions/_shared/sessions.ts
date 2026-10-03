import type { SupabaseClient } from '@supabase/supabase-js';
import { generateSessions, type LocalDate } from '@kfa/core';
import { fromSession, rows, toHoliday, toSchedule, type Row } from './db.ts';

/**
 * Create sessions from schedules for a date range and keep holiday status in
 * step with the holiday calendar. Cancelled, extra and finalised sessions are
 * never touched (S-03, S-04, S-09).
 */
export async function ensureSessions(db: SupabaseClient, from: LocalDate, to: LocalDate): Promise<void> {
  const schedules = rows(await db.from('schedules').select('*, batches!inner(active)').eq('batches.active', true)).map(toSchedule);
  const holidays = rows(await db.from('holidays').select('*').gte('date', from).lte('date', to)).map(toHoliday);
  const generated = generateSessions(schedules, holidays, from, to);
  if (generated.length === 0) return;

  const existing = new Map<string, Row>(
    rows(await db.from('sessions').select('id, status, kind, finalized_at').gte('date', from).lte('date', to)).map((r) => [r.id, r]),
  );

  const fresh = generated.filter((s) => !existing.has(s.id)).map(fromSession);
  if (fresh.length > 0) rows(await db.from('sessions').upsert(fresh, { onConflict: 'id', ignoreDuplicates: true }));

  for (const s of generated) {
    const row = existing.get(s.id);
    if (!row || row.finalized_at || row.kind !== 'regular' || row.status === 'cancelled' || row.status === s.status) continue;
    rows(await db.from('sessions').update({ status: s.status }).eq('id', s.id));
  }
}
