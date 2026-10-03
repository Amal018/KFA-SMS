import { describe, expect, it } from 'vitest';
import {
  applyLeave,
  DAY,
  DEFAULT_SETTINGS,
  finalizeSession,
  manualMark,
  resolvePunch,
  undoManual,
  type FinalizeContext,
} from '../src/index.ts';
import { at, ctx, dance, device, enrolment, leave, punch, record, session, student } from './fixtures.ts';

function fctx(over: Partial<FinalizeContext> = {}): FinalizeContext {
  return {
    settings: DEFAULT_SETTINGS,
    batches: [dance],
    students: [student('asha'), student('bala')],
    enrolments: [enrolment('asha'), enrolment('bala')],
    leaves: [],
    records: [],
    devices: [device()],
    ...over,
  };
}

const owner = { userId: 'u1', role: 'owner' as const };

describe('Finalisation (spec §7)', () => {
  it('F-01 not due before end + grace', () => {
    expect(finalizeSession(session(), fctx(), at('17:14')).state).toBe('not_due');
  });

  it('F-02 marks expected students without a record absent', () => {
    const r = finalizeSession(session(), fctx({ records: [record('asha', { status: 'present', source: 'punch' })] }), at('17:15'));
    expect(r.state).toBe('finalized');
    expect(r.alertsAllowed).toBe(true);
    expect(r.upserts).toEqual([expect.objectContaining({ studentId: 'bala', status: 'absent', source: 'auto' })]);
  });

  it('F-03 student on leave is excused', () => {
    const r = finalizeSession(session(), fctx({ leaves: [leave('bala')] }), at('17:15'));
    expect(r.upserts.find((u) => u.studentId === 'bala')).toMatchObject({ status: 'excused', reason: 'leave' });
    expect(r.upserts.find((u) => u.studentId === 'asha')!.status).toBe('absent');
  });

  it('F-04 phone not synced since check-in closed: wait', () => {
    const r = finalizeSession(session(), fctx({ devices: [device({ lastSyncAt: at('16:30') })] }), at('17:30'));
    expect(r.state).toBe('awaiting_sync');
    expect(r.upserts).toEqual([]);
    expect(r.notices[0]!.kind).toBe('phone_not_synced');
  });

  it('F-05 still not synced after the max wait: finalised with alerts suppressed', () => {
    const r = finalizeSession(session(), fctx({ devices: [device({ lastSyncAt: at('16:30') })] }), at('17:00') + DAY);
    expect(r.state).toBe('finalized');
    expect(r.alertsAllowed).toBe(false);
    expect(r.upserts).toHaveLength(2);
    expect(r.notices[0]!.kind).toBe('finalized_without_sync');
  });

  it('F-06 holiday or cancelled session: nothing to finalise', () => {
    expect(finalizeSession(session({ status: 'holiday' }), fctx(), at('18:00')).state).toBe('nothing_to_do');
    expect(finalizeSession(session({ status: 'cancelled' }), fctx(), at('18:00')).state).toBe('nothing_to_do');
  });

  it('F-07 running twice creates no duplicates', () => {
    const first = finalizeSession(session(), fctx(), at('17:15'));
    const second = finalizeSession(session(), fctx({ records: first.upserts }), at('17:20'));
    expect(second.upserts).toEqual([]);
  });

  it('F-08 existing records are untouched', () => {
    const records = [record('asha', { status: 'late', source: 'punch' }), record('bala', { status: 'present', source: 'manual', locked: true })];
    expect(finalizeSession(session(), fctx({ records }), at('17:15')).upserts).toEqual([]);
  });

  it('F-09 revoked or long-inactive phones do not block finalisation', () => {
    const devices = [device({ id: 'lost', lastSyncAt: at('16:00'), revoked: true }), device({ id: 'old', lastSyncAt: at('16:00') - 8 * DAY })];
    expect(finalizeSession(session(), fctx({ devices }), at('17:15')).state).toBe('finalized');
  });
});

describe('Leave and manual overrides (spec §8)', () => {
  it('L-01 leave for all batches excuses every session in range', () => {
    const l = leave('asha', { from: '2026-10-01', to: '2026-10-10' });
    const r = finalizeSession(session(), fctx({ students: [student('asha')], leaves: [l] }), at('17:15'));
    expect(r.upserts[0]!.status).toBe('excused');
  });

  it('L-02 leave for one batch only', () => {
    const r = finalizeSession(session(), fctx({ students: [student('asha')], leaves: [leave('asha', { batchId: 'music' })] }), at('17:15'));
    expect(r.upserts[0]!.status).toBe('absent');
  });

  it('L-03 leave entered after finalisation turns absent into excused and cancels the alert', () => {
    const r = applyLeave(record('asha'), owner, session());
    expect(r).toMatchObject({ ok: true, record: { status: 'excused', source: 'manual', reason: 'leave' } });
    expect(r.ok && r.cancelAlertKeys).toHaveLength(1);
  });

  it('L-04 cancelled leave has no effect', () => {
    const r = finalizeSession(session(), fctx({ students: [student('asha')], leaves: [leave('asha', { status: 'cancelled' })] }), at('17:15'));
    expect(r.upserts[0]!.status).toBe('absent');
  });

  it('L-05 manual present → absent is locked against later punches', () => {
    const m = manualMark(session(), 'asha', 'absent', 'Left after 10 minutes', owner);
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(resolvePunch(punch('asha', '16:30'), ctx({ records: [m.record] })).outcome).toBe('manual_locked');
  });

  it('L-06 undo a manual override: back to punches, or absent if finalised without any', () => {
    const manual = record('asha', { status: 'absent', source: 'manual', locked: true });
    const p = punch('asha', '16:15');
    expect(undoManual(manual, [p], session(), DEFAULT_SETTINGS, dance, true)).toMatchObject({ status: 'late', source: 'punch', locked: false });
    expect(undoManual(manual, [], session(), DEFAULT_SETTINGS, dance, true)).toMatchObject({ status: 'absent', source: 'auto' });
    expect(undoManual(manual, [], session(), DEFAULT_SETTINGS, dance, false)).toBeNull();
  });
});
