// Row <-> packages/core mapping and data loaders shared by the edge functions.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { toBatch, toSettings, toStudent, type AttendanceSettings, type Batch, type Row, type Student } from '@kfa/core';

export {
  fromRecord,
  fromSession,
  toDevice,
  toEnrolment,
  toHoliday,
  toLeave,
  toRecord,
  toSchedule,
  toSession,
  type Row,
} from '@kfa/core';

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
