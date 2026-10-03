// Row <-> packages/core mapping and data loaders shared by the edge functions.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_SETTINGS,
  type AttendanceRecord,
  type AttendanceSettings,
  type Batch,
  type Device,
  type Enrolment,
  type Holiday,
  type Leave,
  type Schedule,
  type Session,
  type Student,
} from '@kfa/core';

// deno-lint-ignore no-explicit-any
export type Row = Record<string, any>;

export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** A client acting as the caller, so RLS and auth apply. */
export function userClient(req: Request): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
}

type Result = { data: unknown; error: { message: string } | null };

/** Unwrap a list result, throwing on error. Rows are untyped (no generated DB types yet). */
export function rows(res: Result): Row[] {
  if (res.error) throw new Error(res.error.message);
  return (res.data as Row[] | null) ?? [];
}

/** Unwrap a single-row result (maybeSingle), throwing on error. */
export function one(res: Result): Row | null {
  if (res.error) throw new Error(res.error.message);
  return (res.data as Row | null) ?? null;
}

const hhmm = (t: string) => t.slice(0, 5);
const ms = (t: string | null) => (t ? Date.parse(t) : null);

export const toSettings = (row: Row | null): AttendanceSettings => ({ ...DEFAULT_SETTINGS, ...(row?.attendance ?? {}) });

export const toBatch = (r: Row): Batch => ({ id: r.id, name: r.name, teacherId: r.teacher_id, settings: r.settings ?? {} });

export const toSchedule = (r: Row): Schedule => ({
  id: r.id,
  batchId: r.batch_id,
  weekday: r.weekday,
  start: hhmm(r.start_time),
  end: hhmm(r.end_time),
  validFrom: r.valid_from,
  validTo: r.valid_to,
});

export const toHoliday = (r: Row): Holiday => ({ date: r.date, name: r.name, batchIds: r.batch_ids });

export const toSession = (r: Row): Session => ({
  id: r.id,
  batchId: r.batch_id,
  date: r.date,
  start: hhmm(r.start_time),
  end: hhmm(r.end_time),
  status: r.status,
  kind: r.kind,
  countsForPercent: r.counts_for_percent,
  absenceAlerts: r.absence_alerts,
  cancelReason: r.cancel_reason,
});

export const fromSession = (s: Session): Row => ({
  id: s.id,
  batch_id: s.batchId,
  date: s.date,
  start_time: s.start,
  end_time: s.end,
  status: s.status,
  kind: s.kind,
  counts_for_percent: s.countsForPercent,
  absence_alerts: s.absenceAlerts,
});

export const toStudent = (r: Row, pauses: Row[] = []): Student => ({
  id: r.id,
  name: r.full_name,
  dateOfBirth: r.date_of_birth,
  leftOn: r.left_on,
  pauses: pauses.filter((p) => p.student_id === r.id).map((p) => ({ from: p.from_date, to: p.to_date })),
  whatsappOptIn: r.whatsapp_opt_in && !!r.whatsapp_number,
  guardian:
    r.guardian_name || r.guardian_whatsapp_number
      ? { name: r.guardian_name ?? '', whatsappOptIn: r.guardian_whatsapp_opt_in && !!r.guardian_whatsapp_number }
      : null,
});

export const toEnrolment = (r: Row): Enrolment => ({
  id: r.id,
  studentId: r.student_id,
  batchId: r.batch_id,
  startDate: r.start_date,
  endDate: r.end_date,
  status: r.status,
  kind: r.kind,
});

export const toLeave = (r: Row): Leave => ({
  id: r.id,
  studentId: r.student_id,
  from: r.from_date,
  to: r.to_date,
  batchId: r.batch_id,
  status: r.status,
});

export const toRecord = (r: Row): AttendanceRecord => ({
  sessionId: r.session_id,
  studentId: r.student_id,
  status: r.status,
  source: r.source,
  locked: r.locked,
  punchId: r.client_punch_id,
  punchedAt: ms(r.punched_at),
  reason: r.reason,
});

export const fromRecord = (r: AttendanceRecord): Row => ({
  session_id: r.sessionId,
  student_id: r.studentId,
  status: r.status,
  source: r.source,
  locked: r.locked,
  client_punch_id: r.punchId ?? null,
  punched_at: r.punchedAt ? new Date(r.punchedAt).toISOString() : null,
  reason: r.reason ?? null,
  updated_at: new Date().toISOString(),
});

export const toDevice = (r: Row): Device => ({ id: r.id, name: r.name, lastSyncAt: ms(r.last_sync_at), revoked: r.revoked });

export async function loadSettings(db: SupabaseClient): Promise<AttendanceSettings> {
  return toSettings(one(await db.from('institute_settings').select('attendance').eq('id', 1).maybeSingle()));
}

export async function loadBatches(db: SupabaseClient): Promise<Batch[]> {
  return rows(await db.from('batches').select('*')).map(toBatch);
}

/** Students with their pauses. */
export async function loadStudents(db: SupabaseClient, ids?: string[]): Promise<Student[]> {
  let q = db.from('students').select('*');
  let p = db.from('student_pauses').select('*');
  if (ids) {
    q = q.in('id', ids);
    p = p.in('student_id', ids);
  }
  const pauses = rows(await p);
  return rows(await q).map((r: Row) => toStudent(r, pauses));
}

/** Insert an owner notice unless an unread one of the same kind already exists for the session. */
export async function notify(db: SupabaseClient, n: { kind: string; message: string; sessionId?: string; studentId?: string; deviceId?: string }) {
  if (n.sessionId) {
    const existing = rows(
      await db.from('owner_notices').select('id').eq('kind', n.kind).eq('session_id', n.sessionId).is('read_at', null).limit(1),
    );
    if (existing.length > 0) return;
  }
  rows(
    await db.from('owner_notices').insert({
      kind: n.kind,
      message: n.message,
      session_id: n.sessionId ?? null,
      student_id: n.studentId ?? null,
      device_id: n.deviceId ?? null,
    }),
  );
}

/** Cancel pending alerts; for any already sent, tell the owner (P-08, L-03). */
export async function cancelAlerts(db: SupabaseClient, keys: string[]) {
  if (keys.length === 0) return;
  rows(await db.from('outgoing_messages').update({ status: 'cancelled' }).in('key', keys).eq('status', 'pending'));
  const sent = rows(await db.from('outgoing_messages').select('key, student_id, session_id').in('key', keys).eq('status', 'sent'));
  for (const m of sent) {
    await notify(db, {
      kind: 'absence_alert_cancelled',
      message: 'An absence message was already sent, but the student was later marked present.',
      studentId: m.student_id,
      sessionId: m.session_id,
    });
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Scheduled calls from pg_cron carry the CRON_SECRET in an x-cron-secret header. */
export function isServiceCall(req: Request): boolean {
  const secret = Deno.env.get('CRON_SECRET');
  return !!secret && req.headers.get('x-cron-secret') === secret;
}
