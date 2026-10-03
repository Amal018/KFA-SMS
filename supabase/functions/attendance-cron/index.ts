// Runs every 5 minutes (pg_cron): keeps sessions generated, finalises ended
// sessions (auto-absent) and queues absence and streak alerts (spec §7, §9).
import {
  absenceAlerts,
  addDays,
  finalizeSession,
  localDateOf,
  streakAlert,
  type OutgoingAlert,
  type StreakEntry,
} from '@kfa/core';
import {
  fromRecord,
  isServiceCall,
  json,
  loadBatches,
  loadSettings,
  loadStudents,
  rows,
  notify,
  serviceClient,
  toDevice,
  toEnrolment,
  toLeave,
  toRecord,
  toSession,
} from '../_shared/db.ts';
import { ensureSessions } from '../_shared/sessions.ts';

const STREAK_LOOKBACK = 20;

const toMessageRow = (a: OutgoingAlert) => ({
  key: a.key,
  template: a.template,
  student_id: a.studentId,
  recipient: a.recipient,
  notify_owner: a.notifyOwner,
  session_id: a.sessionId ?? null,
  scheduled_at: new Date(a.scheduledAt).toISOString(),
  status: a.recipient ? 'pending' : 'skipped',
});

Deno.serve(async (req) => {
  if (!isServiceCall(req)) return json({ error: 'Forbidden' }, 403);
  const db = serviceClient();
  const now = Date.now();
  const today = localDateOf(now);

  await ensureSessions(db, today, addDays(today, 7));

  const settings = await loadSettings(db);
  const batches = await loadBatches(db);
  const devices = rows(await db.from('devices').select('*')).map(toDevice);

  // Holidays and cancelled classes have nothing to finalise (F-06).
  rows(
    await db
      .from('sessions')
      .update({ finalized_at: new Date(now).toISOString(), alerts_allowed: false })
      .is('finalized_at', null)
      .neq('status', 'scheduled')
      .lte('date', today),
  );

  const pending = rows(
    await db
      .from('sessions')
      .select('*')
      .is('finalized_at', null)
      .eq('status', 'scheduled')
      .gte('date', addDays(today, -3))
      .lte('date', today),
  ).map(toSession);

  const summary = { finalized: 0, awaitingSync: 0, alerts: 0 };

  for (const session of pending) {
    const enrolments = rows(await db.from('enrolments').select('*').eq('batch_id', session.batchId)).map(toEnrolment);
    const studentIds = [...new Set(enrolments.map((e) => e.studentId))];
    if (studentIds.length === 0) {
      const result = finalizeSession(session, { settings, batches, students: [], enrolments, leaves: [], records: [], devices }, now);
      if (result.state === 'finalized') {
        rows(await db.from('sessions').update({ finalized_at: new Date(now).toISOString(), alerts_allowed: result.alertsAllowed }).eq('id', session.id));
      }
      continue;
    }
    const students = await loadStudents(db, studentIds);
    const leaves = rows(await db.from('leaves').select('*').in('student_id', studentIds).lte('from_date', session.date).gte('to_date', session.date)).map(toLeave);
    const records = rows(await db.from('attendance_records').select('*').eq('session_id', session.id)).map(toRecord);

    const result = finalizeSession(session, { settings, batches, students, enrolments, leaves, records, devices }, now);
    for (const n of result.notices) await notify(db, n);
    if (result.state === 'awaiting_sync') summary.awaitingSync++;
    if (result.state !== 'finalized') continue;

    if (result.upserts.length) {
      // ignoreDuplicates: a punch that landed meanwhile wins over auto-absent (F-07, F-08).
      rows(await db.from('attendance_records').upsert(result.upserts.map(fromRecord), { onConflict: 'session_id,student_id', ignoreDuplicates: true }));
    }
    rows(await db.from('sessions').update({ finalized_at: new Date(now).toISOString(), alerts_allowed: result.alertsAllowed }).eq('id', session.id));
    summary.finalized++;

    const finalRecords = rows(await db.from('attendance_records').select('*').eq('session_id', session.id)).map(toRecord);
    const { alerts, cannotMessage } = absenceAlerts(session, finalRecords, result.alertsAllowed, { settings, batches, students, enrolments }, now);

    // Streak alerts for everyone absent in this session.
    const absentees = finalRecords.filter((r) => r.status === 'absent').map((r) => r.studentId);
    if (absentees.length && result.alertsAllowed) {
      const recent = rows(
        await db
          .from('sessions')
          .select('*')
          .eq('batch_id', session.batchId)
          .lte('date', session.date)
          .order('date', { ascending: false })
          .order('start_time', { ascending: false })
          .limit(STREAK_LOOKBACK),
      ).map(toSession);
      const recentRecords = rows(
        await db.from('attendance_records').select('*').in('session_id', recent.map((s) => s.id)).in('student_id', absentees),
      ).map(toRecord);
      for (const studentId of absentees) {
        const student = students.find((s) => s.id === studentId);
        const enrolment = enrolments.find((e) => e.studentId === studentId && e.status === 'active');
        if (!student || !enrolment) continue;
        const entries: StreakEntry[] = recent.map((s) => ({
          sessionId: s.id,
          date: s.date,
          start: s.start,
          sessionStatus: s.status,
          countsForPercent: s.countsForPercent,
          status: recentRecords.find((r) => r.sessionId === s.id && r.studentId === studentId)?.status ?? null,
        }));
        const streak = streakAlert(enrolment, student, entries, settings, now, today);
        if (streak) alerts.push({ ...streak, sessionId: session.id });
      }
    }

    if (alerts.length) {
      rows(await db.from('outgoing_messages').upsert(alerts.map(toMessageRow), { onConflict: 'key', ignoreDuplicates: true }));
      summary.alerts += alerts.length;
    }
    if (cannotMessage.length) {
      await notify(db, {
        kind: 'cannot_message',
        message: `${cannotMessage.length} absent student(s) have no WhatsApp consent or number.`,
        sessionId: session.id,
      });
    }
  }

  return json({ ok: true, ...summary });
});
