import {
  DEFAULT_SETTINGS,
  generateSessions,
  toInstant,
  type AttendanceRecord,
  type AttendanceSettings,
  type Batch,
  type Device,
  type Enrolment,
  type Leave,
  type LocalDate,
  type LocalTime,
  type Punch,
  type ResolveContext,
  type Schedule,
  type Session,
  type Student,
} from '../src/index.ts';

/** Saturday 3 Oct 2026, the default test day. */
export const SAT = '2026-10-03';

export const dance: Batch = { id: 'dance', name: 'Bharatanatyam Beginners' };
export const music: Batch = { id: 'music', name: 'Carnatic Vocal' };

export const danceSat: Schedule = {
  id: 'dance-sat',
  batchId: 'dance',
  weekday: 6,
  start: '16:00',
  end: '17:00',
  validFrom: '2026-01-01',
  validTo: null,
};

export function session(over: Partial<Session> = {}): Session {
  return {
    id: `dance:${SAT}:16:00`,
    batchId: 'dance',
    date: SAT,
    start: '16:00',
    end: '17:00',
    status: 'scheduled',
    kind: 'regular',
    countsForPercent: true,
    absenceAlerts: null,
    ...over,
  };
}

export function student(id: string, over: Partial<Student> = {}): Student {
  return { id, name: id, dateOfBirth: '1995-05-05', whatsappOptIn: true, guardian: null, ...over };
}

export function enrolment(studentId: string, batchId = 'dance', over: Partial<Enrolment> = {}): Enrolment {
  return {
    id: `${studentId}-${batchId}`,
    studentId,
    batchId,
    startDate: '2026-01-01',
    endDate: null,
    status: 'active',
    kind: 'regular',
    ...over,
  };
}

export function at(time: LocalTime, date: LocalDate = SAT): number {
  return toInstant(date, time);
}

let punchSeq = 0;
export function punch(studentId: string, time: LocalTime, over: Partial<Punch> = {}): Punch {
  const punchedAt = at(time);
  return {
    clientPunchId: `p${++punchSeq}`,
    deviceId: 'phone-1',
    studentId,
    method: 'face',
    punchedAt,
    receivedAt: punchedAt + 1000,
    ...over,
  };
}

export function record(studentId: string, over: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return { sessionId: session().id, studentId, status: 'absent', source: 'auto', locked: false, ...over };
}

export function device(over: Partial<Device> = {}): Device {
  return { id: 'phone-1', name: "Owner's phone", lastSyncAt: at('17:20'), revoked: false, ...over };
}

export function leave(studentId: string, over: Partial<Leave> = {}): Leave {
  return { id: `leave-${studentId}`, studentId, from: SAT, to: SAT, batchId: null, status: 'approved', ...over };
}

export function ctx(over: Partial<Omit<ResolveContext, 'settings'>> & { settings?: Partial<AttendanceSettings> } = {}): ResolveContext {
  const { settings, ...rest } = over;
  return {
    settings: { ...DEFAULT_SETTINGS, ...settings },
    batches: [dance, music],
    students: [student('asha')],
    enrolments: [enrolment('asha')],
    sessions: [session()],
    records: [],
    seenPunchIds: new Set(),
    ...rest,
  };
}

export { generateSessions };
