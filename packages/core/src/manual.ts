import { absenceAlertKey } from './resolve';
import { sessionTimes } from './sessions';
import type { AttendanceRecord, AttendanceSettings, AttendanceStatus, Batch, Punch, Session } from './types';

export type Role = 'owner' | 'staff' | 'teacher';

export interface Actor {
  userId: string;
  role: Role;
  /** Batches a teacher teaches. */
  batchIds?: string[];
}

export type ManualResult =
  | { ok: true; record: AttendanceRecord; cancelAlertKeys: string[] }
  | { ok: false; error: 'reason_required' | 'forbidden' };

export function canEditAttendance(actor: Actor, batchId: string): boolean {
  return actor.role !== 'teacher' || (actor.batchIds ?? []).includes(batchId);
}

/**
 * Staff set a student's status for a session (M-40 to M-42, L-05). Manual
 * records are locked so later punches don't change them. A manual absence
 * never triggers the automatic "absent today" message.
 */
export function manualMark(
  session: Session,
  studentId: string,
  status: AttendanceStatus,
  reason: string,
  actor: Actor,
): ManualResult {
  if (!canEditAttendance(actor, session.batchId)) return { ok: false, error: 'forbidden' };
  if (!reason.trim()) return { ok: false, error: 'reason_required' };
  return {
    ok: true,
    record: { sessionId: session.id, studentId, status, source: 'manual', locked: true, reason: reason.trim() },
    cancelAlertKeys: [absenceAlertKey(session.id, studentId)],
  };
}

/** Record leave entered after a session was finalised absent (L-03). */
export function applyLeave(record: AttendanceRecord, actor: Actor, session: Session): ManualResult {
  if (record.status !== 'absent') {
    return { ok: true, record, cancelAlertKeys: [] };
  }
  return manualMark(session, record.studentId, 'excused', 'leave', actor);
}

/**
 * Remove a manual override (L-06): the record goes back to what the punches
 * say, or absent if the session is finalised and there were none. Returns
 * null when the record should be deleted (session not finalised yet).
 */
export function undoManual(
  record: AttendanceRecord,
  punches: Punch[],
  session: Session,
  settings: AttendanceSettings,
  batch: Batch | undefined,
  finalized: boolean,
): AttendanceRecord | null {
  const times = sessionTimes(session, settings, batch);
  const first = punches
    .filter((p) => p.studentId === record.studentId && p.punchedAt >= times.opensAt && p.punchedAt <= times.closesAt)
    .sort((a, b) => a.punchedAt - b.punchedAt)[0];
  const base = { sessionId: record.sessionId, studentId: record.studentId, locked: false };
  if (first && (times.tooLateAfter === null || first.punchedAt <= times.tooLateAfter)) {
    return {
      ...base,
      status: first.punchedAt > times.lateAfter ? 'late' : 'present',
      source: 'punch',
      punchId: first.clientPunchId,
      punchedAt: first.punchedAt,
      reason: null,
    };
  }
  if (first) return { ...base, status: 'absent', source: 'punch', punchId: first.clientPunchId, punchedAt: first.punchedAt, reason: 'arrived_too_late' };
  return finalized ? { ...base, status: 'absent', source: 'auto', reason: null } : null;
}
