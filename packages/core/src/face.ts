import type { AttendanceSettings, FaceVerifyResult } from './types.ts';

export interface FaceProfile {
  id: string;
  studentId: string;
  embedding: ArrayLike<number>;
  active: boolean;
}

export type FaceIdentification =
  | { result: 'match'; studentId: string; score: number }
  | { result: 'face_retry'; score: number }
  | { result: 'face_no_match'; score: number | null }
  | { result: 'liveness_failed' };

export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) throw new Error('Embedding sizes differ');
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

/** Best score per student across that student's active profiles (M-07, M-08). */
function bestScoresByStudent(probe: ArrayLike<number>, profiles: FaceProfile[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const p of profiles) {
    if (!p.active) continue;
    const score = cosineSimilarity(probe, p.embedding);
    if (score > (scores.get(p.studentId) ?? -Infinity)) scores.set(p.studentId, score);
  }
  return scores;
}

/** 1:N identification against every enrolled face (spec §5.2). */
export function identifyFace(
  probe: ArrayLike<number>,
  live: boolean,
  profiles: FaceProfile[],
  settings: Pick<AttendanceSettings, 'faceMatchThreshold' | 'faceMargin' | 'faceRetryBand' | 'livenessRequired'>,
): FaceIdentification {
  if (settings.livenessRequired && !live) return { result: 'liveness_failed' };

  const ranked = [...bestScoresByStudent(probe, profiles)].sort((a, b) => b[1] - a[1]);
  const best = ranked[0];
  if (!best) return { result: 'face_no_match', score: null };

  const [studentId, score] = best;
  const second = ranked[1]?.[1] ?? -Infinity;
  if (score >= settings.faceMatchThreshold) {
    // Never guess between two similar students (M-02).
    if (score - second >= settings.faceMargin) return { result: 'match', studentId, score };
    return { result: 'face_retry', score };
  }
  if (score >= settings.faceMatchThreshold - settings.faceRetryBand) return { result: 'face_retry', score };
  return { result: 'face_no_match', score };
}

/** 1:1 check that a face belongs to the student whose card was scanned (M-32 to M-34). */
export function verifyFace(
  probe: ArrayLike<number>,
  studentId: string,
  profiles: FaceProfile[],
  settings: Pick<AttendanceSettings, 'faceMatchThreshold'>,
): FaceVerifyResult {
  const own = profiles.filter((p) => p.studentId === studentId && p.active);
  if (own.length === 0) return 'no_profile';
  const best = Math.max(...own.map((p) => cosineSimilarity(probe, p.embedding)));
  return best >= settings.faceMatchThreshold ? 'match' : 'mismatch';
}
