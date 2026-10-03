import { describe, expect, it } from 'vitest';
import { absenceAlertKey, DAY, MINUTE, resolvePunch } from '../src/index.ts';
import { at, ctx, dance, enrolment, punch, record, SAT, session, student } from './fixtures.ts';

const S = session().id;

describe('Punch resolution (spec §6)', () => {
  it('P-01 on time: present', () => {
    const r = resolvePunch(punch('asha', '16:00'), ctx());
    expect(r.outcome).toBe('marked');
    expect(r.upserts).toEqual([expect.objectContaining({ sessionId: S, studentId: 'asha', status: 'present', source: 'punch', locked: false })]);
  });

  it('P-02 early within the window: present', () => {
    expect(resolvePunch(punch('asha', '15:30'), ctx()).upserts[0]!.status).toBe('present');
  });

  it('P-03 before the window opens: outside window', () => {
    expect(resolvePunch(punch('asha', '15:29'), ctx())).toMatchObject({ outcome: 'outside_window', reason: 'not_in_window' });
  });

  it('P-04 after the late threshold: late', () => {
    expect(resolvePunch(punch('asha', '16:10'), ctx()).upserts[0]!.status).toBe('present');
    expect(resolvePunch(punch('asha', '16:11'), ctx()).upserts[0]!.status).toBe('late');
  });

  it('P-05 after absentIfLaterThan: arrival logged, stays absent', () => {
    const c = ctx({ batches: [{ ...dance, settings: { absentIfLaterThanMin: 30 } }] });
    expect(resolvePunch(punch('asha', '16:30'), c).upserts[0]!.status).toBe('late');
    const r = resolvePunch(punch('asha', '16:31'), c);
    expect(r.outcome).toBe('arrived_too_late');
    expect(r.upserts).toEqual([expect.objectContaining({ status: 'absent', source: 'punch', reason: 'arrived_too_late' })]);
  });

  it('P-06 after the window closes: outside window', () => {
    expect(resolvePunch(punch('asha', '17:00'), ctx()).outcome).toBe('marked');
    expect(resolvePunch(punch('asha', '17:01'), ctx()).outcome).toBe('outside_window');
  });

  it('P-07 second scan is a duplicate; present is never downgraded to late', () => {
    const r = resolvePunch(punch('asha', '16:20'), ctx({ records: [record('asha', { status: 'present', source: 'punch' })] }));
    expect(r.outcome).toBe('duplicate');
    expect(r.upserts).toEqual([]);
  });

  it('P-08 scan after auto-absent upgrades the record and cancels the alert', () => {
    const r = resolvePunch(punch('asha', '16:05'), ctx({ records: [record('asha')] }));
    expect(r.outcome).toBe('marked');
    expect(r.sessions[0]).toMatchObject({ status: 'present', upgradedFrom: 'absent' });
    expect(r.cancelAlertKeys).toEqual([absenceAlertKey(S, 'asha')]);
  });

  it('P-09 student on leave shows up: excused upgraded to present', () => {
    const r = resolvePunch(punch('asha', '16:00'), ctx({ records: [record('asha', { status: 'excused', reason: 'leave' })] }));
    expect(r.sessions[0]).toMatchObject({ result: 'marked', status: 'present', upgradedFrom: 'excused' });
  });

  it('P-10 manual override stands', () => {
    const r = resolvePunch(punch('asha', '16:00'), ctx({ records: [record('asha', { source: 'manual', locked: true })] }));
    expect(r.outcome).toBe('manual_locked');
    expect(r.upserts).toEqual([]);
  });

  it('P-11 no session today', () => {
    expect(resolvePunch(punch('asha', '16:00', { punchedAt: at('16:00', '2026-10-04'), receivedAt: at('16:01', '2026-10-04') }), ctx())).toMatchObject({
      outcome: 'outside_window',
      reason: 'no_session_today',
    });
  });

  it('P-12 session today but at a different time', () => {
    expect(resolvePunch(punch('asha', '10:00'), ctx())).toMatchObject({ outcome: 'outside_window', reason: 'not_in_window' });
  });

  const backToBack = () => {
    const second = session({ id: `music:${SAT}:17:00`, batchId: 'music', start: '17:00', end: '18:00' });
    return { sessions: [session(), second], enrolments: [enrolment('asha'), enrolment('asha', 'music')] };
  };

  it('P-13 back-to-back sessions, policy all: both marked', () => {
    const r = resolvePunch(punch('asha', '16:40'), ctx(backToBack()));
    expect(r.upserts.map((u) => [u.sessionId, u.status])).toEqual([
      [S, 'late'],
      [`music:${SAT}:17:00`, 'present'],
    ]);
  });

  it('P-14 back-to-back sessions, policy nearest: only the closest start', () => {
    const r = resolvePunch(punch('asha', '16:50'), ctx({ ...backToBack(), settings: { multiSessionPolicy: 'nearest' } }));
    expect(r.upserts.map((u) => u.sessionId)).toEqual([`music:${SAT}:17:00`]);
  });

  it('P-15 paused or left student is inactive', () => {
    expect(resolvePunch(punch('asha', '16:00'), ctx({ students: [student('asha', { leftOn: '2026-09-30' })] })).outcome).toBe('inactive_student');
    expect(resolvePunch(punch('asha', '16:00'), ctx({ students: [student('asha', { pauses: [{ from: SAT, to: SAT }] })] })).outcome).toBe(
      'inactive_student',
    );
  });

  it('P-16 timestamp in the future: clock skew', () => {
    const p = punch('asha', '16:00');
    const r = resolvePunch({ ...p, receivedAt: p.punchedAt - 11 * MINUTE }, ctx());
    expect(r.outcome).toBe('clock_skew');
    expect(r.notices[0]!.kind).toBe('clock_skew');
    expect(resolvePunch({ ...p, receivedAt: p.punchedAt - 9 * MINUTE }, ctx()).outcome).toBe('marked');
  });

  it('P-17 arrives more than a week late: needs review, applies once approved', () => {
    const p = punch('asha', '16:00');
    const late = { ...p, receivedAt: p.punchedAt + 8 * DAY };
    expect(resolvePunch(late, ctx()).outcome).toBe('needs_review');
    expect(resolvePunch(late, ctx(), { reviewApproved: true }).outcome).toBe('marked');
  });

  it('P-18 same punch uploaded twice is ignored', () => {
    const p = punch('asha', '16:00');
    expect(resolvePunch(p, ctx({ seenPunchIds: new Set([p.clientPunchId]) })).outcome).toBe('duplicate_upload');
  });

  it('P-19 holiday or cancelled session is never matched', () => {
    expect(resolvePunch(punch('asha', '16:00'), ctx({ sessions: [session({ status: 'holiday' })] })).outcome).toBe('outside_window');
    expect(resolvePunch(punch('asha', '16:00'), ctx({ sessions: [session({ status: 'cancelled' })] })).outcome).toBe('outside_window');
  });

  it('P-20 session of a batch the student is not enrolled in', () => {
    expect(resolvePunch(punch('asha', '16:00'), ctx({ enrolments: [enrolment('asha', 'music')] })).outcome).toBe('outside_window');
  });
});
