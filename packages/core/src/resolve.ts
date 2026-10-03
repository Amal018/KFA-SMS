import { settingsForBatch } from './settings';
import { expectedEnrolment, isStudentActiveOn, sessionTimes } from './sessions';
import { DAY, localDateOf, MINUTE } from './time';
import type {
  AttendanceRecord,
  AttendanceSettings,
  AttendanceStatus,
  Batch,
  CardCheckLevel,
  Enrolment,
  OutcomeCode,
  OwnerNotice,
  Punch,
  ReviewFlag,
  Session,
  Student,
} from './types';

export interface ResolveContext {
  settings: AttendanceSettings;
  batches: Batch[];
  students: Student[];
  enrolments: Enrolment[];
  /** Sessions on (at least) the punch's date. */
  sessions: Session[];
  /** Existing records for those sessions. */
  records: AttendanceRecord[];
  /** clientPunchIds already processed. */
  seenPunchIds: ReadonlySet<string>;
}

export interface SessionResult {
  sessionId: string;
  result: 'marked' | 'duplicate' | 'manual_locked' | 'arrived_too_late';
  status?: AttendanceStatus;
  /** The record was upgraded from absent/excused. */
  upgradedFrom?: AttendanceStatus;
}

export interface Resolution {
  outcome: OutcomeCode;
  reason?: 'no_session_today' | 'not_in_window';
  sessions: SessionResult[];
  flags: ReviewFlag[];
  /** Records to insert or replace. */
  upserts: AttendanceRecord[];
  /** Pending absence alerts to cancel; if already sent, the server tells the owner. */
  cancelAlertKeys: string[];
  notices: OwnerNotice[];
}

export function absenceAlertKey(sessionId: string, studentId: string): string {
  return `absent:${sessionId}:${studentId}`;
}

const CARD_LEVEL_RANK: Record<CardCheckLevel, number> = { card_only: 0, card_photo: 1, card_face: 2 };

function result(outcome: OutcomeCode, extra: Partial<Resolution> = {}): Resolution {
  return { outcome, sessions: [], flags: [], upserts: [], cancelAlertKeys: [], notices: [], ...extra };
}

/** The status a punch earns for a session, or null if it's too late to count (spec §5.1). */
function statusForTime(t: number, times: ReturnType<typeof sessionTimes>): AttendanceStatus | null {
  if (times.tooLateAfter !== null && t > times.tooLateAfter) return null;
  return t > times.lateAfter ? 'late' : 'present';
}

/**
 * Apply one identified punch to the student's sessions (spec §6). Pure: the
 * caller persists `upserts`, cancels alerts and records the punch outcome.
 */
export function resolvePunch(punch: Punch, ctx: ResolveContext, opts: { reviewApproved?: boolean } = {}): Resolution {
  const { settings } = ctx;

  if (ctx.seenPunchIds.has(punch.clientPunchId)) return result('duplicate_upload'); // P-18

  if (punch.punchedAt > punch.receivedAt + settings.futureSkewMin * MINUTE) {
    return result('clock_skew', {
      notices: [{ kind: 'clock_skew', message: 'A phone sent a check-in timestamped in the future. Check its clock.', deviceId: punch.deviceId }],
    }); // P-16
  }

  if (!opts.reviewApproved && punch.receivedAt - punch.punchedAt > settings.stalePunchDays * DAY) {
    return result('needs_review', {
      notices: [{ kind: 'review_needed', message: 'A check-in arrived more than a week late and needs approval.', studentId: punch.studentId }],
    }); // P-17
  }

  const student = ctx.students.find((s) => s.id === punch.studentId);
  if (!student) return result('unknown_student');

  const date = localDateOf(punch.punchedAt);
  if (!isStudentActiveOn(student, date)) return result('inactive_student'); // P-15, E-04, E-05

  const batchOf = (id: string) => ctx.batches.find((b) => b.id === id);
  const todays = ctx.sessions.filter((s) => s.date === date && expectedEnrolment(s, student, ctx.enrolments));
  if (todays.length === 0) return result('outside_window', { reason: 'no_session_today' }); // P-11, P-19, P-20

  let matched = todays.filter((s) => {
    const times = sessionTimes(s, settings, batchOf(s.batchId));
    return punch.punchedAt >= times.opensAt && punch.punchedAt <= times.closesAt;
  });
  if (matched.length === 0) return result('outside_window', { reason: 'not_in_window' }); // P-03, P-06, P-12

  if (matched.length > 1 && settings.multiSessionPolicy === 'nearest') {
    const distance = (s: Session) => Math.abs(punch.punchedAt - sessionTimes(s, settings, batchOf(s.batchId)).start);
    matched = [[...matched].sort((a, b) => distance(a) - distance(b))[0]!]; // P-14
  }

  const flags: ReviewFlag[] = [];
  const notices: OwnerNotice[] = [];
  if (punch.method === 'qr' || punch.method === 'nfc') {
    const level = matched
      .map((s) => settingsForBatch(settings, batchOf(s.batchId)).cardCheckLevel)
      .reduce((a, b) => (CARD_LEVEL_RANK[b] > CARD_LEVEL_RANK[a] ? b : a));
    if (level === 'card_face') {
      if (punch.faceVerify === 'mismatch') {
        return result('face_verify_failed', {
          notices: [{ kind: 'review_needed', message: "A card was scanned but the face didn't match its owner.", studentId: student.id }],
        }); // M-33
      }
      if (punch.faceVerify !== 'match') flags.push('no_face_profile'); // M-34
    } else if (level === 'card_photo' && !punch.verifyPhoto) {
      flags.push('missing_photo'); // M-31
    }
  }

  const sessions: SessionResult[] = [];
  const upserts: AttendanceRecord[] = [];
  const cancelAlertKeys: string[] = [];

  for (const session of matched) {
    const times = sessionTimes(session, settings, batchOf(session.batchId));
    const existing = ctx.records.find((r) => r.sessionId === session.id && r.studentId === student.id);
    const status = statusForTime(punch.punchedAt, times);
    const base = { sessionId: session.id, studentId: student.id, punchId: punch.clientPunchId, punchedAt: punch.punchedAt, locked: false };

    if (existing?.locked) {
      sessions.push({ sessionId: session.id, result: 'manual_locked' }); // P-10
      continue;
    }
    if (existing && (existing.status === 'present' || existing.status === 'late')) {
      sessions.push({ sessionId: session.id, result: 'duplicate', status: existing.status }); // P-07
      continue;
    }

    if (status === null) {
      // P-05: arrival logged, the student stays absent. Keep an approved leave as it is.
      if (existing?.status !== 'excused' && existing?.source !== 'punch') {
        upserts.push({ ...base, status: 'absent', source: 'punch', reason: 'arrived_too_late' });
        if (existing) cancelAlertKeys.push(absenceAlertKey(session.id, student.id));
      }
      sessions.push({ sessionId: session.id, result: 'arrived_too_late' });
      continue;
    }

    upserts.push({ ...base, status, source: 'punch', reason: null });
    if (existing) cancelAlertKeys.push(absenceAlertKey(session.id, student.id)); // P-08, P-09
    sessions.push({
      sessionId: session.id,
      result: 'marked',
      status,
      ...(existing ? { upgradedFrom: existing.status } : {}),
    });
  }

  const has = (r: SessionResult['result']) => sessions.some((s) => s.result === r);
  const outcome: OutcomeCode = has('marked')
    ? 'marked'
    : has('arrived_too_late')
      ? 'arrived_too_late'
      : has('duplicate')
        ? 'duplicate'
        : 'manual_locked';

  if (flags.length > 0 && outcome === 'marked') {
    notices.push({ kind: 'review_needed', message: `Check-in flagged for review: ${flags.join(', ')}.`, studentId: student.id });
  }

  return { outcome, sessions, flags: outcome === 'marked' ? flags : [], upserts, cancelAlertKeys, notices };
}
