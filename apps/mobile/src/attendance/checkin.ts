// One check-in, start to finish, on the phone: identify the student, run the
// core rules against the offline cache for an instant result, queue the punch
// for upload (spec §5, §6, D-01).
import * as Crypto from 'expo-crypto';
import {
  fromRecord,
  identifyCredential,
  localTimeOf,
  resolvePunch,
  type CredentialScan,
  type OutcomeCode,
  type Punch,
  type PunchMethod,
} from '@kfa/core';
import { emitChange } from '@/data/events';
import { enqueuePunch, getKv, seenPunchIds } from '@/data/local';
import * as q from '@/data/queries';
import { CARD_SECRET_KEY, putRecord } from '@/data/sync';
import { getSecret } from '@/lib/secrets';

export type Tone = 'ok' | 'info' | 'warn' | 'error';

export interface CheckinResult {
  tone: Tone;
  title: string;
  detail?: string;
  studentId?: string;
}

/** What the student sees for each outcome (spec §13). */
const OUTCOME_TEXT: Record<OutcomeCode, { tone: Tone; text: string }> = {
  marked: { tone: 'ok', text: 'Present' },
  duplicate: { tone: 'info', text: 'Already marked' },
  duplicate_upload: { tone: 'info', text: 'Already marked' },
  arrived_too_late: { tone: 'warn', text: 'Too late for this class' },
  outside_window: { tone: 'warn', text: 'No class right now' },
  inactive_student: { tone: 'error', text: 'Please see the office' },
  unknown_student: { tone: 'error', text: 'Student not found. Sync and try again' },
  manual_locked: { tone: 'info', text: 'Please see the office' },
  face_verify_failed: { tone: 'error', text: 'Please see the office' },
  clock_skew: { tone: 'error', text: "Phone time is wrong. Fix the phone's clock" },
  needs_review: { tone: 'warn', text: 'Saved for review' },
};

export function checkInStudent(
  studentId: string,
  method: PunchMethod,
  extra: { credentialId?: string; photoUri?: string | null; matchScore?: number } = {},
): CheckinResult {
  const now = Date.now();
  const punch: Punch = {
    clientPunchId: Crypto.randomUUID(),
    deviceId: getKv('device_id') ?? 'unregistered',
    studentId,
    method,
    punchedAt: now,
    receivedAt: now,
    credentialId: extra.credentialId ?? null,
    matchScore: extra.matchScore ?? null,
    verifyPhoto: !!extra.photoUri,
  };

  const resolution = resolvePunch(punch, {
    settings: q.settings(),
    batches: q.batches(),
    students: q.students(),
    enrolments: q.enrolments(),
    sessions: q.sessionsOn(),
    records: q.records(),
    seenPunchIds: seenPunchIds(),
  });

  // Queue first, then update the screen: nothing is lost if the app dies here (D-06).
  enqueuePunch(
    punch.clientPunchId,
    {
      clientPunchId: punch.clientPunchId,
      studentId,
      method,
      punchedAt: new Date(now).toISOString(),
      credentialId: punch.credentialId,
      matchScore: punch.matchScore,
    },
    extra.photoUri ?? null,
  );
  for (const r of resolution.upserts) putRecord(fromRecord(r));
  emitChange('changed');

  const name = q.studentName(studentId);
  const shown = OUTCOME_TEXT[resolution.outcome];
  const late = resolution.sessions.some((s) => s.status === 'late');
  const batchNames = resolution.sessions.map((s) => q.batchName(q.sessionsOn().find((x) => x.id === s.sessionId)?.batchId ?? '')).filter(Boolean);
  return {
    tone: late && shown.tone === 'ok' ? 'warn' : shown.tone,
    title: `${name}: ${late && resolution.outcome === 'marked' ? 'Late' : shown.text}`,
    detail: [batchNames.join(', '), localTimeOf(now), resolution.flags.length ? 'Flagged for review' : ''].filter(Boolean).join(' · '),
    studentId,
  };
}

/** QR card or NFC sticker check-in (M-10 to M-23). */
export function checkInWithCard(scan: CredentialScan, photoUri: string | null): CheckinResult {
  const secret = getSecret(CARD_SECRET_KEY);
  if (!secret) return { tone: 'error', title: 'Phone not set up', detail: 'Sync while online, then try again.' };

  const id = identifyCredential(scan, q.credentials(), secret);
  switch (id.result) {
    case 'identified':
      return checkInStudent(id.studentId, scan.type, { credentialId: id.credentialId, photoUri });
    case 'revoked_credential':
      return { tone: 'error', title: 'Card not valid', detail: `${q.studentName(id.studentId)}: please see the office`, studentId: id.studentId };
    case 'unknown_credential':
      return { tone: 'warn', title: 'Sticker not linked', detail: 'Link it from the student’s profile.' };
    case 'invalid_credential':
      return { tone: 'error', title: 'Card not valid' };
  }
}
