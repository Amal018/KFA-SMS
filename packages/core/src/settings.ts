import type { AttendanceSettings, Batch, Session } from './types';

export const DEFAULT_SETTINGS: AttendanceSettings = {
  openBeforeMin: 30,
  lateAfterMin: 10,
  absentIfLaterThanMin: null,
  closeAfterEndMin: 0,
  finalizeGraceMin: 15,
  maxSyncWaitMin: 24 * 60,
  multiSessionPolicy: 'all',
  cardCheckLevel: 'card_photo',
  faceMatchThreshold: 0.7,
  faceMargin: 0.08,
  faceRetryBand: 0.1,
  livenessRequired: true,
  futureSkewMin: 10,
  stalePunchDays: 7,
  absenceAlerts: true,
  streakThreshold: 3,
  quietStart: '20:00',
  quietEnd: '09:00',
  deviceInactiveDays: 7,
  chronicBelowPercent: 75,
};

/** Institute settings with the batch's overrides applied. */
export function settingsForBatch(settings: AttendanceSettings, batch: Batch | undefined): AttendanceSettings {
  if (!batch?.settings) return settings;
  const merged = { ...settings };
  for (const [key, value] of Object.entries(batch.settings)) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

/** Whether absence alerts are on for a session (session flag wins over batch). */
export function absenceAlertsOn(session: Session, settings: AttendanceSettings, batch: Batch | undefined): boolean {
  if (session.absenceAlerts !== null) return session.absenceAlerts;
  return settingsForBatch(settings, batch).absenceAlerts;
}
