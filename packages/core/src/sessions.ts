import { settingsForBatch } from './settings';
import { addDays, inRange, MINUTE, toInstant, weekdayOf } from './time';
import type {
  AttendanceSettings,
  Batch,
  Enrolment,
  Holiday,
  Instant,
  Leave,
  LocalDate,
  LocalTime,
  Schedule,
  Session,
  SessionKind,
  Student,
} from './types';

export function sessionId(batchId: string, date: LocalDate, start: LocalTime): string {
  return `${batchId}:${date}:${start}`;
}

function holidayFor(holidays: Holiday[], batchId: string, date: LocalDate): Holiday | undefined {
  return holidays.find((h) => h.date === date && (h.batchIds === null || h.batchIds.includes(batchId)));
}

/**
 * Sessions for a batch's schedules between two dates (inclusive). Identity is
 * batch + date + start time, so re-running generation is idempotent (S-09).
 */
export function generateSessions(
  schedules: Schedule[],
  holidays: Holiday[],
  from: LocalDate,
  to: LocalDate,
): Session[] {
  const sessions = new Map<string, Session>();
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const weekday = weekdayOf(date);
    for (const s of schedules) {
      if (s.weekday !== weekday || !inRange(date, s.validFrom, s.validTo)) continue;
      const id = sessionId(s.batchId, date, s.start);
      if (sessions.has(id)) continue;
      const holiday = holidayFor(holidays, s.batchId, date);
      sessions.set(id, {
        id,
        batchId: s.batchId,
        date,
        start: s.start,
        end: s.end,
        status: holiday ? 'holiday' : 'scheduled',
        kind: 'regular',
        countsForPercent: true,
        absenceAlerts: null,
      });
    }
  }
  return [...sessions.values()].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

/** A one-off session added by staff (S-07, S-08, S-10). */
export function extraSession(
  batchId: string,
  date: LocalDate,
  start: LocalTime,
  end: LocalTime,
  kind: Exclude<SessionKind, 'regular'> = 'extra',
): Session {
  return {
    id: sessionId(batchId, date, start),
    batchId,
    date,
    start,
    end,
    status: 'scheduled',
    kind,
    countsForPercent: kind !== 'event',
    absenceAlerts: false,
  };
}

export function cancelSession(session: Session, reason: string): Session {
  return { ...session, status: 'cancelled', cancelReason: reason };
}

/** Whether the student is active (not left, not paused) on a date. */
export function isStudentActiveOn(student: Student, date: LocalDate): boolean {
  if (student.leftOn && date >= student.leftOn) return false;
  return !(student.pauses ?? []).some((p) => inRange(date, p.from, p.to));
}

/** The enrolment that makes a student expected at a session, if any (spec §4). */
export function expectedEnrolment(
  session: Session,
  student: Student,
  enrolments: Enrolment[],
): Enrolment | undefined {
  if (session.status !== 'scheduled') return undefined;
  if (!isStudentActiveOn(student, session.date)) return undefined;
  return enrolments.find(
    (e) =>
      e.studentId === student.id &&
      e.batchId === session.batchId &&
      e.status === 'active' &&
      inRange(session.date, e.startDate, e.endDate),
  );
}

export function expectedStudents(
  session: Session,
  students: Student[],
  enrolments: Enrolment[],
): { student: Student; enrolment: Enrolment }[] {
  const result: { student: Student; enrolment: Enrolment }[] = [];
  for (const student of students) {
    const enrolment = expectedEnrolment(session, student, enrolments);
    if (enrolment) result.push({ student, enrolment });
  }
  return result;
}

export function isOnLeave(leaves: Leave[], studentId: string, batchId: string, date: LocalDate): boolean {
  return leaves.some(
    (l) =>
      l.status === 'approved' &&
      l.studentId === studentId &&
      (l.batchId === null || l.batchId === batchId) &&
      inRange(date, l.from, l.to),
  );
}

export interface SessionTimes {
  start: Instant;
  end: Instant;
  opensAt: Instant;
  closesAt: Instant;
  lateAfter: Instant;
  tooLateAfter: Instant | null;
  finalizeAt: Instant;
}

export function sessionTimes(session: Session, settings: AttendanceSettings, batch: Batch | undefined): SessionTimes {
  const s = settingsForBatch(settings, batch);
  const start = toInstant(session.date, session.start);
  const end = toInstant(session.date, session.end);
  const closesAt = end + s.closeAfterEndMin * MINUTE;
  return {
    start,
    end,
    opensAt: start - s.openBeforeMin * MINUTE,
    closesAt,
    lateAfter: start + s.lateAfterMin * MINUTE,
    tooLateAfter: s.absentIfLaterThanMin === null ? null : start + s.absentIfLaterThanMin * MINUTE,
    finalizeAt: closesAt + settings.finalizeGraceMin * MINUTE,
  };
}
