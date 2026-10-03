import { describe, expect, it } from 'vitest';
import { cancelSession, expectedEnrolment, expectedStudents, extraSession, generateSessions } from '../src/index.ts';
import { danceSat, enrolment, SAT, session, student } from './fixtures.ts';

describe('Sessions and calendar (spec §3)', () => {
  it('S-01 weekly schedule generates one session per scheduled weekday', () => {
    const sessions = generateSessions([danceSat], [], '2026-10-01', '2026-10-31');
    expect(sessions.map((s) => s.date)).toEqual(['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24', '2026-10-31']);
    expect(sessions[0]).toMatchObject({ start: '16:00', end: '17:00', status: 'scheduled', kind: 'regular' });
  });

  it('S-02 batch on several weekdays', () => {
    const tue = { ...danceSat, id: 'tue', weekday: 2 };
    const thu = { ...danceSat, id: 'thu', weekday: 4 };
    const sessions = generateSessions([tue, thu], [], '2026-10-05', '2026-10-11');
    expect(sessions.map((s) => s.date)).toEqual(['2026-10-06', '2026-10-08']);
  });

  it('S-03 schedule change from a date follows whichever schedule is valid', () => {
    const oldSat = { ...danceSat, validTo: '2026-10-31' };
    const newSun = { ...danceSat, id: 'sun', weekday: 0, validFrom: '2026-11-01' };
    const sessions = generateSessions([oldSat, newSun], [], '2026-10-25', '2026-11-08');
    expect(sessions.map((s) => s.date)).toEqual(['2026-10-31', '2026-11-01', '2026-11-08']);
  });

  it('S-04 institute-wide holiday marks the session as a holiday', () => {
    const [s] = generateSessions([danceSat], [{ date: SAT, name: 'Ayudha Puja', batchIds: null }], SAT, SAT);
    expect(s!.status).toBe('holiday');
    expect(expectedEnrolment(s!, student('asha'), [enrolment('asha')])).toBeUndefined();
  });

  it('S-05 holiday for some batches only', () => {
    const musicSat = { ...danceSat, id: 'music-sat', batchId: 'music' };
    const sessions = generateSessions([danceSat, musicSat], [{ date: SAT, name: 'Recital', batchIds: ['music'] }], SAT, SAT);
    expect(sessions.find((s) => s.batchId === 'dance')!.status).toBe('scheduled');
    expect(sessions.find((s) => s.batchId === 'music')!.status).toBe('holiday');
  });

  it('S-06 cancelled class expects nobody', () => {
    const cancelled = cancelSession(session(), 'Teacher unwell');
    expect(cancelled).toMatchObject({ status: 'cancelled', cancelReason: 'Teacher unwell' });
    expect(expectedStudents(cancelled, [student('asha')], [enrolment('asha')])).toEqual([]);
  });

  it('S-07 extra class expects enrolled students, absence alerts off by default', () => {
    const extra = extraSession('dance', '2026-10-05', '18:00', '19:00');
    expect(extra).toMatchObject({ kind: 'extra', countsForPercent: true, absenceAlerts: false });
    expect(expectedStudents(extra, [student('asha')], [enrolment('asha')])).toHaveLength(1);
  });

  it('S-08 event day does not count towards attendance %', () => {
    expect(extraSession('dance', SAT, '10:00', '12:00', 'event')).toMatchObject({ kind: 'event', countsForPercent: false });
  });

  it('S-09 re-running generation creates no duplicates', () => {
    const a = generateSessions([danceSat], [], '2026-10-01', '2026-10-31');
    const b = generateSessions([danceSat, danceSat], [], '2026-10-01', '2026-10-31');
    expect(b.map((s) => s.id)).toEqual(a.map((s) => s.id));
  });

  it('S-10 rescheduled class: original cancelled, extra session at the new time', () => {
    const moved = extraSession('dance', SAT, '18:00', '19:00');
    expect(moved.id).not.toBe(session().id);
    expect(cancelSession(session(), 'Moved to 6pm').status).toBe('cancelled');
  });

  it('S-11 overlapping schedules on one day both generate sessions', () => {
    const second = { ...danceSat, id: 'dance-sat-2', start: '17:00', end: '18:00' };
    expect(generateSessions([danceSat, second], [], SAT, SAT)).toHaveLength(2);
  });
});

describe('Who is expected (spec §4)', () => {
  const s = session();

  it('E-01 active student with active enrolment is expected', () => {
    expect(expectedEnrolment(s, student('asha'), [enrolment('asha')])).toBeDefined();
  });

  it('E-02 not expected before the enrolment starts', () => {
    expect(expectedEnrolment(s, student('asha'), [enrolment('asha', 'dance', { startDate: '2026-10-15' })])).toBeUndefined();
  });

  it('E-03 batch move: expected in the old batch up to the end date only', () => {
    const old = enrolment('asha', 'dance', { endDate: '2026-10-10' });
    expect(expectedEnrolment(s, student('asha'), [old])).toBeDefined();
    expect(expectedEnrolment(session({ date: '2026-10-17' }), student('asha'), [old])).toBeUndefined();
  });

  it('E-04 paused student is not expected', () => {
    const paused = student('asha', { pauses: [{ from: '2026-10-01', to: '2026-10-31' }] });
    expect(expectedEnrolment(s, paused, [enrolment('asha')])).toBeUndefined();
  });

  it('E-05 student who left is not expected from the leaving date', () => {
    const left = student('asha', { leftOn: SAT });
    expect(expectedEnrolment(s, left, [enrolment('asha')])).toBeUndefined();
    expect(expectedEnrolment(session({ date: '2026-09-26' }), left, [enrolment('asha')])).toBeDefined();
  });

  it('E-06 trial student is expected', () => {
    expect(expectedEnrolment(s, student('asha'), [enrolment('asha', 'dance', { kind: 'trial' })])?.kind).toBe('trial');
  });

  it('E-07 student in two batches the same day is expected at both', () => {
    const musicSession = session({ id: `music:${SAT}:18:00`, batchId: 'music', start: '18:00', end: '19:00' });
    const enrolments = [enrolment('asha'), enrolment('asha', 'music')];
    expect(expectedEnrolment(s, student('asha'), enrolments)).toBeDefined();
    expect(expectedEnrolment(musicSession, student('asha'), enrolments)).toBeDefined();
  });
});
