// Demo mode: sample data on this device only, no server. Lets the owner try
// the app (and the local web preview) before Supabase is set up.
import { localDateOf, localTimeOf, MINUTE, sessionId, type Row } from '@kfa/core';
import { CARD_SECRET_KEY } from './keys';
import { emitChange } from './events';
import { getKv, put, recordId, setKv } from './local';
import { setSecret } from '@/lib/secrets';

export const DEMO_SECRET = 'demo-card-secret';

export const isDemo = () => getKv('demo') === '1';

const hhmm = (ms: number) => localTimeOf(ms);

export async function startDemo(): Promise<void> {
  const now = Date.now();
  const today = localDateOf(now);
  // Round down to the quarter hour so class times look natural.
  const base = now - (now % (15 * MINUTE));

  const batches: Row[] = [
    { id: 'b-dance', name: 'Bharatanatyam Beginners', settings: {} },
    { id: 'b-music', name: 'Carnatic Vocal', settings: {} },
    { id: 'b-art', name: 'Drawing Juniors', settings: { cardCheckLevel: 'card_only' } },
  ];
  // One class finished earlier, one on now (check-in open), one later today.
  const slots: [string, number, number][] = [
    ['b-art', base - 180 * MINUTE, base - 90 * MINUTE],
    ['b-dance', base - 15 * MINUTE, base + 45 * MINUTE],
    ['b-music', base + 120 * MINUTE, base + 180 * MINUTE],
  ];
  const sessions: Row[] = slots.map(([batch_id, s, e]) => ({
    id: sessionId(batch_id, today, hhmm(s)),
    batch_id,
    date: today,
    start_time: hhmm(s),
    end_time: hhmm(e),
    status: 'scheduled',
    kind: 'regular',
    counts_for_percent: true,
    absence_alerts: null,
  }));

  const students: Row[] = [
    ['s1', 'KFA-001', 'Asha Kumar', '2012-04-10', 'b-dance'],
    ['s2', 'KFA-002', 'Bala Murugan', '1998-09-21', 'b-dance'],
    ['s3', 'KFA-003', 'Chitra Devi', '2015-01-30', 'b-art'],
    ['s4', 'KFA-004', 'Deepa Raman', '2010-07-12', 'b-dance'],
    ['s5', 'KFA-005', 'Esakki Pandian', '2001-03-03', 'b-music'],
    ['s6', 'KFA-006', 'Farhana Begum', '2014-11-25', 'b-art'],
  ].map(([id, admission_no, full_name, date_of_birth]) => ({
    id,
    admission_no,
    full_name,
    date_of_birth,
    whatsapp_number: '919800000000',
    whatsapp_opt_in: true,
    guardian_name: 'Parent',
    guardian_whatsapp_number: '919800000001',
    guardian_whatsapp_opt_in: true,
    face_consent: id !== 's3',
  }));

  setKv('demo', '1');
  setKv('role', 'owner');
  setKv('device_id', 'demo-phone');
  setKv('settings', JSON.stringify({ attendance: {} }));
  setKv('last_sync', String(now));
  await setSecret(CARD_SECRET_KEY, DEMO_SECRET);

  for (const b of batches) put('batch', b.id, b);
  for (const s of sessions) put('session', s.id, s);
  for (const s of students) put('student', s.id, s);
  const batchOf: Record<string, string> = { s1: 'b-dance', s2: 'b-dance', s3: 'b-art', s4: 'b-dance', s5: 'b-music', s6: 'b-art' };
  for (const [sid, bid] of Object.entries(batchOf)) {
    put('enrolment', `e-${sid}`, { id: `e-${sid}`, student_id: sid, batch_id: bid, start_date: '2026-01-01', end_date: null, status: 'active', kind: sid === 's6' ? 'trial' : 'regular' });
    put('credential', `c-${sid}`, { id: `c-${sid}`, student_id: sid, type: 'qr', value: '1', status: 'active' });
  }

  // The finished art class: Chitra came, Farhana (trial) was absent.
  const art = sessions[0]!;
  const records: Row[] = [
    { session_id: art.id, student_id: 's3', status: 'present', source: 'punch', locked: false, punched_at: new Date(slots[0]![1]).toISOString() },
    { session_id: art.id, student_id: 's6', status: 'absent', source: 'auto', locked: false },
  ];
  for (const r of records) put('record', recordId(r), r);

  emitChange('changed');
}
