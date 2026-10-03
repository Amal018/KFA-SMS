import { expectedStudents, isOnLeave, sessionTimes } from './sessions.ts';
import { DAY, MINUTE } from './time.ts';
import type {
  AttendanceRecord,
  AttendanceSettings,
  Batch,
  Device,
  Enrolment,
  Instant,
  Leave,
  OwnerNotice,
  Session,
  Student,
} from './types.ts';

export interface FinalizeContext {
  settings: AttendanceSettings;
  batches: Batch[];
  students: Student[];
  enrolments: Enrolment[];
  leaves: Leave[];
  /** Existing records for this session. */
  records: AttendanceRecord[];
  devices: Device[];
}

export interface FinalizeResult {
  state: 'not_due' | 'nothing_to_do' | 'awaiting_sync' | 'finalized';
  upserts: AttendanceRecord[];
  /** False when finalised without every phone synced (F-05). */
  alertsAllowed: boolean;
  notices: OwnerNotice[];
}

/** Devices that haven't synced since check-in closed, ignoring revoked or long-inactive ones (F-04, F-09). */
export function unsyncedDevices(devices: Device[], closesAt: Instant, now: Instant, settings: AttendanceSettings): Device[] {
  return devices.filter(
    (d) =>
      !d.revoked &&
      d.lastSyncAt !== null &&
      now - d.lastSyncAt <= settings.deviceInactiveDays * DAY &&
      d.lastSyncAt < closesAt,
  );
}

/** Mark expected students without a record absent (or excused on leave) once a session is over (spec §7). */
export function finalizeSession(session: Session, ctx: FinalizeContext, now: Instant): FinalizeResult {
  const none = (state: FinalizeResult['state'], notices: OwnerNotice[] = []): FinalizeResult => ({
    state,
    upserts: [],
    alertsAllowed: false,
    notices,
  });

  if (session.status !== 'scheduled') return none('nothing_to_do'); // F-06
  const batch = ctx.batches.find((b) => b.id === session.batchId);
  const times = sessionTimes(session, ctx.settings, batch);
  if (now < times.finalizeAt) return none('not_due'); // F-01

  const unsynced = unsyncedDevices(ctx.devices, times.closesAt, now, ctx.settings);
  let alertsAllowed = true;
  const notices: OwnerNotice[] = [];
  if (unsynced.length > 0) {
    const names = unsynced.map((d) => d.name).join(', ');
    if (now < times.closesAt + ctx.settings.maxSyncWaitMin * MINUTE) {
      return none('awaiting_sync', [
        { kind: 'phone_not_synced', message: `${names} not synced; absences and absence messages are on hold.`, sessionId: session.id },
      ]); // F-04
    }
    alertsAllowed = false; // F-05
    notices.push({
      kind: 'finalized_without_sync',
      message: `${names} never synced; absences were marked but no absence messages were sent.`,
      sessionId: session.id,
    });
  }

  const upserts: AttendanceRecord[] = [];
  for (const { student } of expectedStudents(session, ctx.students, ctx.enrolments)) {
    if (ctx.records.some((r) => r.sessionId === session.id && r.studentId === student.id)) continue; // F-07, F-08
    const onLeave = isOnLeave(ctx.leaves, student.id, session.batchId, session.date);
    upserts.push({
      sessionId: session.id,
      studentId: student.id,
      status: onLeave ? 'excused' : 'absent',
      source: 'auto',
      locked: false,
      reason: onLeave ? 'leave' : null,
    }); // F-02, F-03
  }

  return { state: 'finalized', upserts, alertsAllowed, notices };
}
