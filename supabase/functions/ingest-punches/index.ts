// Phones upload queued check-ins here. The server re-runs the core rules as
// the source of truth (spec D-02) and returns each punch's outcome.
import { localDateOf, resolvePunch, type Punch, type PunchMethod, type FaceVerifyResult } from '@kfa/core';
import {
  cancelAlerts,
  fromRecord,
  json,
  loadBatches,
  loadSettings,
  loadStudents,
  one,
  rows,
  notify,
  serviceClient,
  toEnrolment,
  toRecord,
  toSession,
  userClient,
} from '../_shared/db.ts';
import { ensureSessions } from '../_shared/sessions.ts';

interface IncomingPunch {
  clientPunchId: string;
  studentId: string;
  method: PunchMethod;
  /** ISO timestamp from the phone clock */
  punchedAt: string;
  credentialId?: string | null;
  matchScore?: number | null;
  verifyPhotoPath?: string | null;
  faceVerify?: FaceVerifyResult | null;
}

interface Body {
  deviceId: string;
  appVersion?: string;
  /** Phone clock at upload time, for the clock-drift warning (D-03). */
  clientTime?: string;
  punches: IncomingPunch[];
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const caller = userClient(req);
  const { data: auth } = await caller.auth.getUser();
  if (!auth.user) return json({ error: 'Not signed in' }, 401);
  const { data: role } = await caller.rpc('my_role');
  if (!role) return json({ error: 'No staff profile' }, 403);

  const body = (await req.json()) as Body;
  const db = serviceClient();
  const device = one(await db.from('devices').select('*').eq('id', body.deviceId).maybeSingle());
  if (!device || device.revoked) return json({ error: 'Device not registered or revoked' }, 403);

  const receivedAt = Date.now();
  const settings = await loadSettings(db);
  const batches = await loadBatches(db);
  const results: { clientPunchId: string; outcome: string; reason?: string; sessions: unknown[] }[] = [];

  const punches = [...(body.punches ?? [])].sort((a, b) => Date.parse(a.punchedAt) - Date.parse(b.punchedAt));
  const dates = [...new Set(punches.map((p) => localDateOf(Date.parse(p.punchedAt))))];
  for (const date of dates) await ensureSessions(db, date, date);

  for (const p of punches) {
    const punch: Punch = {
      clientPunchId: p.clientPunchId,
      deviceId: body.deviceId,
      studentId: p.studentId,
      method: p.method,
      punchedAt: Date.parse(p.punchedAt),
      receivedAt,
      credentialId: p.credentialId ?? null,
      matchScore: p.matchScore ?? null,
      verifyPhoto: !!p.verifyPhotoPath,
      faceVerify: p.faceVerify ?? null,
    };
    const date = localDateOf(punch.punchedAt);

    const seen = rows(await db.from('punches').select('client_punch_id').eq('client_punch_id', p.clientPunchId));
    const sessionRows = rows(await db.from('sessions').select('*').eq('date', date));
    const sessionIds = sessionRows.map((s) => s.id as string);
    const records = sessionIds.length
      ? rows(await db.from('attendance_records').select('*').eq('student_id', p.studentId).in('session_id', sessionIds))
      : [];

    const resolution = resolvePunch(punch, {
      settings,
      batches,
      students: await loadStudents(db, [p.studentId]),
      enrolments: rows(await db.from('enrolments').select('*').eq('student_id', p.studentId)).map(toEnrolment),
      sessions: sessionRows.map(toSession),
      records: records.map(toRecord),
      seenPunchIds: new Set(seen.map((s) => s.client_punch_id as string)),
    });

    if (resolution.outcome !== 'duplicate_upload') {
      rows(
        await db.from('punches').insert({
          client_punch_id: p.clientPunchId,
          device_id: body.deviceId,
          student_id: p.studentId,
          method: p.method,
          punched_at: p.punchedAt,
          received_at: new Date(receivedAt).toISOString(),
          credential_id: p.credentialId ?? null,
          match_score: p.matchScore ?? null,
          verify_photo_path: p.verifyPhotoPath ?? null,
          face_verify: p.faceVerify ?? null,
          outcome: resolution.outcome,
          outcome_reason: resolution.reason ?? null,
          flags: resolution.flags,
          review_status:
            resolution.outcome === 'needs_review' || resolution.flags.length > 0 || resolution.outcome === 'face_verify_failed'
              ? 'pending'
              : null,
        }),
      );
      if (resolution.upserts.length) {
        rows(await db.from('attendance_records').upsert(resolution.upserts.map(fromRecord), { onConflict: 'session_id,student_id' }));
      }
      await cancelAlerts(db, resolution.cancelAlertKeys);
      for (const n of resolution.notices) await notify(db, n);
    }

    results.push({ clientPunchId: p.clientPunchId, outcome: resolution.outcome, reason: resolution.reason, sessions: resolution.sessions });
  }

  // Only now count the phone as synced: finalisation waits on this (F-04).
  rows(
    await db
      .from('devices')
      .update({ last_sync_at: new Date(receivedAt).toISOString(), app_version: body.appVersion ?? device.app_version })
      .eq('id', body.deviceId),
  );

  const clockDriftMs = body.clientTime ? Date.parse(body.clientTime) - receivedAt : null;
  if (clockDriftMs !== null && Math.abs(clockDriftMs) > 2 * 60_000) {
    await notify(db, { kind: 'clock_skew', message: `${device.name}'s clock is off by ${Math.round(clockDriftMs / 60_000)} minutes.`, deviceId: device.id });
  }

  return json({ serverTime: new Date(receivedAt).toISOString(), clockDriftMs, results });
});
