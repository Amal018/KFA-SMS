import { describe, expect, it } from 'vitest';
import { finalizeSession, resolvePunch, DEFAULT_SETTINGS } from '../src/index.ts';
import { at, ctx, dance, device, enrolment, punch, session, student } from './fixtures.ts';

describe('Devices, offline and sync (spec §11)', () => {
  it('D-01/D-02 a punch resolved offline gives the same result when the server re-runs it', () => {
    const p = { ...punch('asha', '16:05'), receivedAt: at('19:00') }; // uploaded 3 hours later
    const onPhone = resolvePunch({ ...p, receivedAt: p.punchedAt }, ctx());
    const onServer = resolvePunch(p, ctx());
    expect(onServer.upserts).toEqual(onPhone.upserts);
  });

  it('D-04 two phones: both must sync, and a second phone’s scan is a duplicate', () => {
    const devices = [device(), device({ id: 'phone-2', name: 'Office phone', lastSyncAt: at('16:30') })];
    const fctx = { settings: DEFAULT_SETTINGS, batches: [dance], students: [student('asha')], enrolments: [enrolment('asha')], leaves: [], records: [], devices };
    expect(finalizeSession(session(), fctx, at('17:30')).state).toBe('awaiting_sync');

    const first = resolvePunch(punch('asha', '16:00'), ctx());
    const second = resolvePunch(punch('asha', '16:01', { deviceId: 'phone-2' }), ctx({ records: first.upserts }));
    expect(second.outcome).toBe('duplicate');
  });

  it('D-06 queued punches replay in any order with the same final state', () => {
    const early = punch('asha', '16:00');
    const late = punch('asha', '16:20');
    const a = resolvePunch(early, ctx());
    expect(resolvePunch(late, ctx({ records: a.upserts })).outcome).toBe('duplicate');
    // Out of order: the later scan lands first, then the earlier one can't downgrade or replace it.
    const b = resolvePunch(late, ctx());
    expect(b.upserts[0]!.status).toBe('late');
    expect(resolvePunch(early, ctx({ records: b.upserts })).outcome).toBe('duplicate');
  });
});
