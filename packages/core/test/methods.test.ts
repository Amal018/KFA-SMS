import { describe, expect, it } from 'vitest';
import {
  cardPayload,
  DEFAULT_SETTINGS,
  identifyCredential,
  identifyFace,
  manualMark,
  resolvePunch,
  verifyFace,
  type Credential,
  type FaceProfile,
} from '../src';
import { ctx, dance, punch, session } from './fixtures';

const SECRET = 'test-secret';

/** Unit vector pointing mostly along axis `i`, with `noise` along the next axis. */
function vec(i: number, noise = 0, size = 8): number[] {
  const v = new Array(size).fill(0);
  v[i] = 1;
  v[(i + 1) % size] = noise;
  return v;
}

const profiles: FaceProfile[] = [
  { id: 'f1', studentId: 'asha', embedding: vec(0), active: true },
  { id: 'f2', studentId: 'bala', embedding: vec(2), active: true },
];

describe('Face recognition (spec §5.2)', () => {
  it('M-01 clear match identifies the student', () => {
    expect(identifyFace(vec(0, 0.1), true, profiles, DEFAULT_SETTINGS)).toMatchObject({ result: 'match', studentId: 'asha' });
  });

  it('M-02 two students too close together asks for a retry instead of guessing', () => {
    const twins: FaceProfile[] = [
      { id: 'a', studentId: 'asha', embedding: [1, 0.05], active: true },
      { id: 'b', studentId: 'anu', embedding: [1, -0.05], active: true },
    ];
    expect(identifyFace([1, 0], true, twins, DEFAULT_SETTINGS).result).toBe('face_retry');
  });

  it('M-03 score just below the threshold asks for a retry', () => {
    // cos ≈ 0.65: below 0.70 but inside the 0.10 retry band
    expect(identifyFace(vec(0, 1.17), true, profiles, DEFAULT_SETTINGS).result).toBe('face_retry');
  });

  it('M-04 score well below the threshold is not recognised', () => {
    expect(identifyFace(vec(5), true, profiles, DEFAULT_SETTINGS).result).toBe('face_no_match');
  });

  it('M-05 no enrolled faces is not recognised', () => {
    expect(identifyFace(vec(0), true, [], DEFAULT_SETTINGS)).toEqual({ result: 'face_no_match', score: null });
  });

  it('M-06 failed liveness check is rejected', () => {
    expect(identifyFace(vec(0), false, profiles, DEFAULT_SETTINGS).result).toBe('liveness_failed');
  });

  it('M-07 the best of a student’s several profiles is used', () => {
    const withGlasses = [...profiles, { id: 'f3', studentId: 'bala', embedding: vec(4), active: true }];
    expect(identifyFace(vec(4, 0.05), true, withGlasses, DEFAULT_SETTINGS)).toMatchObject({ result: 'match', studentId: 'bala' });
  });

  it('M-08 inactive profiles are ignored', () => {
    const inactive = [{ ...profiles[0]!, active: false }];
    expect(identifyFace(vec(0), true, inactive, DEFAULT_SETTINGS).result).toBe('face_no_match');
  });
});

describe('QR cards (spec §5.3)', () => {
  const cards: Credential[] = [
    { id: 'c1', studentId: 'asha', type: 'qr', value: '1', status: 'revoked' },
    { id: 'c2', studentId: 'asha', type: 'qr', value: '2', status: 'active' },
    { id: 'c3', studentId: 'bala', type: 'qr', value: '1', status: 'revoked' },
  ];

  it('M-10 valid card identifies the student', () => {
    expect(identifyCredential({ type: 'qr', payload: cardPayload(SECRET, 'asha', 2) }, cards, SECRET)).toEqual({
      result: 'identified',
      studentId: 'asha',
      credentialId: 'c2',
    });
  });

  it('M-11 forged or altered QR is invalid', () => {
    const forged = cardPayload('wrong-secret', 'asha', 2);
    const altered = cardPayload(SECRET, 'asha', 2).replace('asha', 'bala');
    expect(identifyCredential({ type: 'qr', payload: forged }, cards, SECRET).result).toBe('invalid_credential');
    expect(identifyCredential({ type: 'qr', payload: altered }, cards, SECRET).result).toBe('invalid_credential');
  });

  it('M-12 old card after reissue is revoked', () => {
    expect(identifyCredential({ type: 'qr', payload: cardPayload(SECRET, 'asha', 1) }, cards, SECRET).result).toBe('revoked_credential');
  });

  it('M-13 explicitly revoked card is revoked', () => {
    expect(identifyCredential({ type: 'qr', payload: cardPayload(SECRET, 'bala', 1) }, cards, SECRET).result).toBe('revoked_credential');
  });

  it('M-14 random QR is invalid', () => {
    expect(identifyCredential({ type: 'qr', payload: 'https://example.com' }, cards, SECRET).result).toBe('invalid_credential');
  });
});

describe('NFC stickers (spec §5.4)', () => {
  const stickers: Credential[] = [
    { id: 'n1', studentId: 'asha', type: 'nfc', value: '04A1B2C3D4E5F6', status: 'active' },
    { id: 'n2', studentId: 'bala', type: 'nfc', value: '0411223344', status: 'revoked' },
  ];

  it('M-20 linked sticker identifies the student (UID format-insensitive)', () => {
    expect(identifyCredential({ type: 'nfc', uid: '04:a1:b2:c3:d4:e5:f6', payload: cardPayload(SECRET, 'asha', 1) }, stickers, SECRET)).toEqual({
      result: 'identified',
      studentId: 'asha',
      credentialId: 'n1',
    });
  });

  it('M-21 unknown sticker', () => {
    expect(identifyCredential({ type: 'nfc', uid: 'FFFF' }, stickers, SECRET).result).toBe('unknown_credential');
  });

  it('M-22 revoked sticker', () => {
    expect(identifyCredential({ type: 'nfc', uid: '0411223344' }, stickers, SECRET).result).toBe('revoked_credential');
  });

  it('M-23 sticker payload belonging to another student is invalid', () => {
    expect(identifyCredential({ type: 'nfc', uid: '04A1B2C3D4E5F6', payload: cardPayload(SECRET, 'bala', 1) }, stickers, SECRET).result).toBe(
      'invalid_credential',
    );
  });
});

describe('Card check levels (spec §5.5)', () => {
  const withLevel = (cardCheckLevel: 'card_only' | 'card_photo' | 'card_face') =>
    ctx({ batches: [{ ...dance, settings: { cardCheckLevel } }] });

  it('M-30 card only: a card scan is enough', () => {
    const r = resolvePunch(punch('asha', '16:00', { method: 'qr' }), withLevel('card_only'));
    expect(r.outcome).toBe('marked');
    expect(r.flags).toEqual([]);
  });

  it('M-31 card + photo: marked, flagged when the photo is missing', () => {
    expect(resolvePunch(punch('asha', '16:00', { method: 'nfc', verifyPhoto: true }), withLevel('card_photo')).flags).toEqual([]);
    const missing = resolvePunch(punch('asha', '16:00', { method: 'nfc' }), withLevel('card_photo'));
    expect(missing.outcome).toBe('marked');
    expect(missing.flags).toEqual(['missing_photo']);
  });

  it('M-32 card + face: matching face is marked', () => {
    expect(resolvePunch(punch('asha', '16:00', { method: 'qr', faceVerify: 'match' }), withLevel('card_face')).outcome).toBe('marked');
  });

  it('M-33 card + face: mismatched face is rejected and flagged', () => {
    const r = resolvePunch(punch('asha', '16:00', { method: 'qr', faceVerify: 'mismatch' }), withLevel('card_face'));
    expect(r.outcome).toBe('face_verify_failed');
    expect(r.upserts).toEqual([]);
    expect(r.notices[0]!.kind).toBe('review_needed');
  });

  it('M-34 card + face: no face profile is marked and flagged', () => {
    const r = resolvePunch(punch('asha', '16:00', { method: 'qr', faceVerify: 'no_profile' }), withLevel('card_face'));
    expect(r.outcome).toBe('marked');
    expect(r.flags).toEqual(['no_face_profile']);
  });

  it('verifyFace compares against the card owner only', () => {
    expect(verifyFace(vec(0), 'asha', profiles, DEFAULT_SETTINGS)).toBe('match');
    expect(verifyFace(vec(2), 'asha', profiles, DEFAULT_SETTINGS)).toBe('mismatch');
    expect(verifyFace(vec(0), 'chitra', profiles, DEFAULT_SETTINGS)).toBe('no_profile');
  });
});

describe('Manual marking (spec §5.6)', () => {
  const owner = { userId: 'u1', role: 'owner' as const };

  it('M-40 staff mark with a reason: manual, locked', () => {
    const r = manualMark(session(), 'asha', 'present', 'Forgot card', owner);
    expect(r).toMatchObject({ ok: true, record: { status: 'present', source: 'manual', locked: true, reason: 'Forgot card' } });
  });

  it('M-41 reason is required', () => {
    expect(manualMark(session(), 'asha', 'present', '  ', owner)).toEqual({ ok: false, error: 'reason_required' });
  });

  it('M-42 teacher cannot mark a batch they do not teach', () => {
    const teacher = { userId: 't1', role: 'teacher' as const, batchIds: ['music'] };
    expect(manualMark(session(), 'asha', 'present', 'Here', teacher)).toEqual({ ok: false, error: 'forbidden' });
    expect(manualMark(session(), 'asha', 'present', 'Here', { ...teacher, batchIds: ['dance'] }).ok).toBe(true);
  });
});
