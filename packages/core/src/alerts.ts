import { absenceAlertKey } from './resolve.ts';
import { absenceAlertsOn } from './settings.ts';
import { expectedEnrolment } from './sessions.ts';
import { ageOn, nextSendTime } from './time.ts';
import type {
  AttendanceRecord,
  AttendanceSettings,
  AttendanceStatus,
  Batch,
  Enrolment,
  Instant,
  LocalDate,
  LocalTime,
  OutgoingAlert,
  Session,
  SessionStatus,
  Student,
} from './types.ts';

/** Who receives WhatsApp messages: the guardian for under-18s, otherwise the student (N-01, N-03). */
export function alertRecipient(student: Student, on: LocalDate): 'student' | 'guardian' | null {
  const minor = student.dateOfBirth ? ageOn(student.dateOfBirth, on) < 18 : false;
  if (minor) return student.guardian?.whatsappOptIn ? 'guardian' : null;
  if (student.whatsappOptIn) return 'student';
  return student.guardian?.whatsappOptIn ? 'guardian' : null;
}

export interface AbsenceAlertContext {
  settings: AttendanceSettings;
  batches: Batch[];
  students: Student[];
  enrolments: Enrolment[];
}

/** "Absent today" messages for a finalised session (spec §9.1). */
export function absenceAlerts(
  session: Session,
  records: AttendanceRecord[],
  alertsAllowed: boolean,
  ctx: AbsenceAlertContext,
  now: Instant,
): { alerts: OutgoingAlert[]; cannotMessage: string[] } {
  const alerts: OutgoingAlert[] = [];
  const cannotMessage: string[] = [];
  const batch = ctx.batches.find((b) => b.id === session.batchId);
  if (!alertsAllowed || !absenceAlertsOn(session, ctx.settings, batch)) return { alerts, cannotMessage }; // N-05, N-06

  const scheduledAt = nextSendTime(now, ctx.settings.quietStart, ctx.settings.quietEnd); // N-02
  for (const record of records) {
    if (record.sessionId !== session.id || record.status !== 'absent' || record.source !== 'auto') continue; // N-07, N-09
    const student = ctx.students.find((s) => s.id === record.studentId);
    if (!student) continue;
    const enrolment = expectedEnrolment(session, student, ctx.enrolments);
    if (!enrolment || enrolment.kind === 'trial') continue; // N-04
    const recipient = alertRecipient(student, session.date);
    if (!recipient) {
      cannotMessage.push(student.id);
      continue;
    }
    alerts.push({
      key: absenceAlertKey(session.id, student.id), // N-08
      template: 'absent_today',
      studentId: student.id,
      recipient,
      scheduledAt,
      notifyOwner: false,
      sessionId: session.id,
    });
  }
  return { alerts, cannotMessage };
}

export interface StreakEntry {
  sessionId: string;
  date: LocalDate;
  start: LocalTime;
  sessionStatus: SessionStatus;
  countsForPercent: boolean;
  /** null = no record yet */
  status: AttendanceStatus | null;
}

/**
 * The current run of consecutive absences, newest first. Holidays, cancelled
 * classes, events, leave and unrecorded sessions are skipped (spec §9.2).
 */
export function currentStreak(entries: StreakEntry[]): { length: number; firstSessionId: string | null } {
  const ordered = [...entries].sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
  let length = 0;
  let firstSessionId: string | null = null;
  for (const e of ordered) {
    if (e.sessionStatus !== 'scheduled' || !e.countsForPercent || e.status === null || e.status === 'excused') continue;
    if (e.status !== 'absent') break;
    length++;
    firstSessionId = e.sessionId;
  }
  return { length, firstSessionId };
}

/** A streak alert once the run reaches the threshold; the key repeats for the same run (N-20, N-21, N-25). */
export function streakAlert(
  enrolment: Enrolment,
  student: Student,
  entries: StreakEntry[],
  settings: AttendanceSettings,
  now: Instant,
  today: LocalDate,
): OutgoingAlert | null {
  if (enrolment.kind === 'trial') return null;
  const { length, firstSessionId } = currentStreak(entries);
  if (length < settings.streakThreshold || !firstSessionId) return null;
  return {
    key: `streak:${enrolment.id}:${firstSessionId}`,
    template: 'absence_streak',
    studentId: student.id,
    recipient: alertRecipient(student, today),
    scheduledAt: nextSendTime(now, settings.quietStart, settings.quietEnd),
    notifyOwner: true,
  };
}
