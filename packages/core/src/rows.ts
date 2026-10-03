// Database row <-> core type mapping, shared by the edge functions and the
// phone app's offline cache. Rows follow supabase/migrations.
import { DEFAULT_SETTINGS } from './settings.ts';
import type {
  AttendanceRecord,
  AttendanceSettings,
  Batch,
  Device,
  Enrolment,
  Holiday,
  Leave,
  Schedule,
  Session,
  Student,
} from './types.ts';
import type { Credential } from './credentials.ts';

// deno-lint-ignore no-explicit-any
export type Row = Record<string, any>;

const hhmm = (t: string) => t.slice(0, 5);
const ms = (t: string | null | undefined) => (t ? Date.parse(t) : null);

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

/** `pauses` rows may cover many students; only this student's are used. */
export const toStudent = (r: Row, pauses: Row[] = []): Student => ({
  id: r.id,
  name: r.full_name,
  dateOfBirth: r.date_of_birth,
  leftOn: r.left_on,
  pauses: pauses.filter((p) => p.student_id === r.id).map((p) => ({ from: p.from_date, to: p.to_date })),
  whatsappOptIn: !!r.whatsapp_opt_in && !!r.whatsapp_number,
  guardian:
    r.guardian_name || r.guardian_whatsapp_number
      ? { name: r.guardian_name ?? '', whatsappOptIn: !!r.guardian_whatsapp_opt_in && !!r.guardian_whatsapp_number }
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

export const toCredential = (r: Row): Credential => ({
  id: r.id,
  studentId: r.student_id,
  type: r.type,
  value: r.value,
  status: r.status,
});
