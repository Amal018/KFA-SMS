import type { AttendanceRecord, Session } from './types.ts';

export interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  excused: number;
  /** null when there are no countable sessions (R-02). */
  percent: number | null;
}

/**
 * Attendance % = (present + late) ÷ (present + late + absent) over sessions
 * that count. Excused, events, holidays and cancelled classes are excluded (R-01).
 */
export function summarize(records: AttendanceRecord[], sessions: Session[]): AttendanceSummary {
  const byId = new Map(sessions.map((s) => [s.id, s]));
  const summary: AttendanceSummary = { present: 0, late: 0, absent: 0, excused: 0, percent: null };
  for (const r of records) {
    const session = byId.get(r.sessionId);
    if (!session || session.status !== 'scheduled' || !session.countsForPercent) continue;
    summary[r.status]++;
  }
  const attended = summary.present + summary.late;
  const countable = attended + summary.absent;
  summary.percent = countable === 0 ? null : Math.round((attended / countable) * 1000) / 10;
  return summary;
}

/** Students whose attendance % is below the threshold (R-05). */
export function chronicAbsentees(
  recordsByStudent: Map<string, AttendanceRecord[]>,
  sessions: Session[],
  belowPercent: number,
): { studentId: string; summary: AttendanceSummary }[] {
  const result: { studentId: string; summary: AttendanceSummary }[] = [];
  for (const [studentId, records] of recordsByStudent) {
    const summary = summarize(records, sessions);
    if (summary.percent !== null && summary.percent < belowPercent) result.push({ studentId, summary });
  }
  return result.sort((a, b) => a.summary.percent! - b.summary.percent!);
}
