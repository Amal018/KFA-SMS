import { describe, expect, it } from 'vitest';
import {
  absenceAlerts,
  chronicAbsentees,
  currentStreak,
  DEFAULT_SETTINGS,
  localTimeOf,
  streakAlert,
  summarize,
  type AbsenceAlertContext,
  type StreakEntry,
} from '../src/index.ts';
import { at, dance, enrolment, record, SAT, session, student } from './fixtures.ts';

function actx(over: Partial<AbsenceAlertContext> = {}): AbsenceAlertContext {
  return { settings: DEFAULT_SETTINGS, batches: [dance], students: [student('asha')], enrolments: [enrolment('asha')], ...over };
}

describe('Absent today alerts (spec §9.1)', () => {
  it('N-01 adult gets the alert; under-18s go to the guardian', () => {
    const { alerts } = absenceAlerts(session(), [record('asha')], true, actx(), at('17:15'));
    expect(alerts).toEqual([expect.objectContaining({ key: `absent:${session().id}:asha`, recipient: 'student', template: 'absent_today' })]);

    const minor = student('asha', { dateOfBirth: '2014-01-01', guardian: { name: 'Mom', whatsappOptIn: true } });
    expect(absenceAlerts(session(), [record('asha')], true, actx({ students: [minor] }), at('17:15')).alerts[0]!.recipient).toBe('guardian');
  });

  it('N-02 finalised inside quiet hours: scheduled for 09:00 next morning', () => {
    const { alerts } = absenceAlerts(session(), [record('asha')], true, actx(), at('21:00'));
    expect(alerts[0]!.scheduledAt).toBe(at('09:00', '2026-10-04'));
    expect(localTimeOf(absenceAlerts(session(), [record('asha')], true, actx(), at('17:15')).alerts[0]!.scheduledAt)).toBe('17:15');
  });

  it('N-03 no WhatsApp opt-in: listed as cannot message', () => {
    const noOptIn = student('asha', { whatsappOptIn: false });
    expect(absenceAlerts(session(), [record('asha')], true, actx({ students: [noOptIn] }), at('17:15'))).toEqual({ alerts: [], cannotMessage: ['asha'] });
    const minorNoGuardian = student('asha', { dateOfBirth: '2014-01-01', whatsappOptIn: true });
    expect(absenceAlerts(session(), [record('asha')], true, actx({ students: [minorNoGuardian] }), at('17:15')).cannotMessage).toEqual(['asha']);
  });

  it('N-04 trial enrolment: not sent', () => {
    expect(absenceAlerts(session(), [record('asha')], true, actx({ enrolments: [enrolment('asha', 'dance', { kind: 'trial' })] }), at('17:15')).alerts).toEqual([]);
  });

  it('N-05 alerts off for the batch or session', () => {
    expect(absenceAlerts(session(), [record('asha')], true, actx({ batches: [{ ...dance, settings: { absenceAlerts: false } }] }), at('17:15')).alerts).toEqual([]);
    expect(absenceAlerts(session({ absenceAlerts: false }), [record('asha')], true, actx(), at('17:15')).alerts).toEqual([]);
  });

  it('N-06 suppressed after late finalisation', () => {
    expect(absenceAlerts(session(), [record('asha')], false, actx(), at('17:15')).alerts).toEqual([]);
  });

  it('N-07 record upgraded before sending: no alert', () => {
    expect(absenceAlerts(session(), [record('asha', { status: 'late', source: 'punch' })], true, actx(), at('17:15')).alerts).toEqual([]);
  });

  it('N-08 same idempotency key on every run', () => {
    const a = absenceAlerts(session(), [record('asha')], true, actx(), at('17:15')).alerts[0]!;
    const b = absenceAlerts(session(), [record('asha')], true, actx(), at('17:20')).alerts[0]!;
    expect(a.key).toBe(b.key);
  });

  it('N-09 excused and manual absences: no automatic alert', () => {
    expect(absenceAlerts(session(), [record('asha', { status: 'excused' })], true, actx(), at('17:15')).alerts).toEqual([]);
    expect(absenceAlerts(session(), [record('asha', { source: 'manual', locked: true })], true, actx(), at('17:15')).alerts).toEqual([]);
  });
});

function entries(statuses: (StreakEntry['status'] | 'holiday')[]): StreakEntry[] {
  return statuses.map((s, i) => ({
    sessionId: `s${i + 1}`,
    date: `2026-10-${String(i + 1).padStart(2, '0')}`,
    start: '16:00',
    sessionStatus: s === 'holiday' ? 'holiday' : 'scheduled',
    countsForPercent: true,
    status: s === 'holiday' ? null : s,
  }));
}

describe('Absence streak alerts (spec §9.2)', () => {
  const alertFor = (e: StreakEntry[]) => streakAlert(enrolment('asha'), student('asha'), e, DEFAULT_SETTINGS, at('17:15'), SAT);

  it('N-20 third absence in a row triggers one alert to recipient and owner', () => {
    expect(alertFor(entries(['present', 'absent', 'absent']))).toBeNull();
    expect(alertFor(entries(['present', 'absent', 'absent', 'absent']))).toMatchObject({
      key: 'streak:asha-dance:s2',
      template: 'absence_streak',
      notifyOwner: true,
      recipient: 'student',
    });
  });

  it('N-21 fourth and fifth absences keep the same key (no new alert)', () => {
    const k3 = alertFor(entries(['absent', 'absent', 'absent']))!.key;
    expect(alertFor(entries(['absent', 'absent', 'absent', 'absent']))!.key).toBe(k3);
    expect(alertFor(entries(['absent', 'absent', 'absent', 'absent', 'absent']))!.key).toBe(k3);
  });

  it('N-22 holidays are skipped', () => {
    expect(currentStreak(entries(['absent', 'absent', 'holiday', 'absent'])).length).toBe(3);
  });

  it('N-23 excused sessions are skipped', () => {
    expect(currentStreak(entries(['absent', 'absent', 'excused', 'absent'])).length).toBe(3);
  });

  it('N-24 attending resets the streak', () => {
    expect(currentStreak(entries(['absent', 'absent', 'present', 'absent'])).length).toBe(1);
    expect(currentStreak(entries(['absent', 'absent', 'late', 'absent'])).length).toBe(1);
  });

  it('N-25 a new streak gets a new key', () => {
    const first = alertFor(entries(['absent', 'absent', 'absent']))!.key;
    const second = alertFor(entries(['absent', 'absent', 'absent', 'present', 'absent', 'absent', 'absent']))!.key;
    expect(second).not.toBe(first);
  });

  it('streak alerts skip trial enrolments and still notify the owner when no one can be messaged', () => {
    expect(streakAlert(enrolment('asha', 'dance', { kind: 'trial' }), student('asha'), entries(['absent', 'absent', 'absent']), DEFAULT_SETTINGS, at('17:15'), SAT)).toBeNull();
    const noOptIn = streakAlert(enrolment('asha'), student('asha', { whatsappOptIn: false }), entries(['absent', 'absent', 'absent']), DEFAULT_SETTINGS, at('17:15'), SAT);
    expect(noOptIn).toMatchObject({ recipient: null, notifyOwner: true });
  });
});

describe('Reports (spec §10)', () => {
  const s1 = session({ id: 's1' });
  const s2 = session({ id: 's2' });
  const s3 = session({ id: 's3' });
  const s4 = session({ id: 's4' });
  const event = session({ id: 'ev', kind: 'event', countsForPercent: false });

  it('R-01 attendance % counts present + late over present + late + absent', () => {
    const records = [
      record('asha', { sessionId: 's1', status: 'present' }),
      record('asha', { sessionId: 's2', status: 'late' }),
      record('asha', { sessionId: 's3', status: 'absent' }),
      record('asha', { sessionId: 's4', status: 'excused' }),
      record('asha', { sessionId: 'ev', status: 'absent' }),
    ];
    expect(summarize(records, [s1, s2, s3, s4, event])).toEqual({ present: 1, late: 1, absent: 1, excused: 1, percent: 66.7 });
  });

  it('R-02 no countable sessions: percent is null', () => {
    expect(summarize([record('asha', { sessionId: 's1', status: 'excused' })], [s1]).percent).toBeNull();
  });

  it('R-05 chronic absentees below the threshold, worst first', () => {
    const byStudent = new Map([
      ['asha', [record('asha', { sessionId: 's1', status: 'present' }), record('asha', { sessionId: 's2', status: 'absent' })]],
      ['bala', [record('bala', { sessionId: 's1', status: 'absent' }), record('bala', { sessionId: 's2', status: 'absent' })]],
      ['chitra', [record('chitra', { sessionId: 's1', status: 'present' })]],
    ]);
    expect(chronicAbsentees(byStudent, [s1, s2], 75).map((c) => c.studentId)).toEqual(['bala', 'asha']);
  });
});
