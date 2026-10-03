/** Local IST calendar date, `YYYY-MM-DD`. */
export type LocalDate = string;
/** Local IST wall-clock time, `HH:MM` (24h). */
export type LocalTime = string;
/** Absolute time in epoch milliseconds. */
export type Instant = number;

export type MultiSessionPolicy = 'all' | 'nearest';
export type CardCheckLevel = 'card_only' | 'card_photo' | 'card_face';

export interface AttendanceSettings {
  openBeforeMin: number;
  lateAfterMin: number;
  /** null = off */
  absentIfLaterThanMin: number | null;
  closeAfterEndMin: number;
  finalizeGraceMin: number;
  maxSyncWaitMin: number;
  multiSessionPolicy: MultiSessionPolicy;
  cardCheckLevel: CardCheckLevel;
  faceMatchThreshold: number;
  faceMargin: number;
  faceRetryBand: number;
  livenessRequired: boolean;
  futureSkewMin: number;
  stalePunchDays: number;
  absenceAlerts: boolean;
  streakThreshold: number;
  quietStart: LocalTime;
  quietEnd: LocalTime;
  /** Devices not synced for this many days are ignored by the finalisation sync check. */
  deviceInactiveDays: number;
  /** Attendance % below which a student counts as a chronic absentee. */
  chronicBelowPercent: number;
}

/** Settings a batch may override. */
export type BatchSettings = Partial<
  Pick<
    AttendanceSettings,
    | 'openBeforeMin'
    | 'lateAfterMin'
    | 'absentIfLaterThanMin'
    | 'closeAfterEndMin'
    | 'cardCheckLevel'
    | 'absenceAlerts'
  >
>;

export interface Batch {
  id: string;
  name: string;
  teacherId?: string | null;
  settings?: BatchSettings;
}

export interface Schedule {
  id: string;
  batchId: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  start: LocalTime;
  end: LocalTime;
  validFrom: LocalDate;
  validTo: LocalDate | null;
}

export interface Holiday {
  date: LocalDate;
  name: string;
  /** null = every batch */
  batchIds: string[] | null;
}

export type SessionStatus = 'scheduled' | 'holiday' | 'cancelled';
export type SessionKind = 'regular' | 'extra' | 'event';

export interface Session {
  id: string;
  batchId: string;
  date: LocalDate;
  start: LocalTime;
  end: LocalTime;
  status: SessionStatus;
  kind: SessionKind;
  countsForPercent: boolean;
  /** null = follow the batch setting */
  absenceAlerts: boolean | null;
  cancelReason?: string | null;
}

export interface DateRange {
  from: LocalDate;
  to: LocalDate;
}

export interface Student {
  id: string;
  name: string;
  dateOfBirth?: LocalDate | null;
  /** Set when the student leaves; not expected from this date. */
  leftOn?: LocalDate | null;
  pauses?: DateRange[];
  whatsappOptIn: boolean;
  guardian?: { name: string; whatsappOptIn: boolean } | null;
}

export type EnrolmentKind = 'regular' | 'trial';

export interface Enrolment {
  id: string;
  studentId: string;
  batchId: string;
  startDate: LocalDate;
  endDate: LocalDate | null;
  status: 'active' | 'cancelled';
  kind: EnrolmentKind;
}

export interface Leave {
  id: string;
  studentId: string;
  from: LocalDate;
  to: LocalDate;
  /** null = all batches */
  batchId: string | null;
  status: 'approved' | 'cancelled';
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';
export type RecordSource = 'punch' | 'auto' | 'manual';

export interface AttendanceRecord {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  source: RecordSource;
  /** Manual overrides are locked against later punches. */
  locked: boolean;
  punchId?: string | null;
  /** Time of the punch that set this record, if any. */
  punchedAt?: Instant | null;
  reason?: string | null;
}

export type PunchMethod = 'face' | 'qr' | 'nfc' | 'manual';

export interface Punch {
  /** UUID generated on the phone; used to ignore re-uploads. */
  clientPunchId: string;
  deviceId: string;
  studentId: string;
  method: PunchMethod;
  punchedAt: Instant;
  receivedAt: Instant;
  credentialId?: string | null;
  /** Face similarity for face punches. */
  matchScore?: number | null;
  /** A verification photo was captured with a card scan. */
  verifyPhoto?: boolean;
  /** Result of the 1:1 face check done on a card scan (card_face level). */
  faceVerify?: FaceVerifyResult | null;
}

export type FaceVerifyResult = 'match' | 'mismatch' | 'no_profile';

export interface Device {
  id: string;
  name: string;
  lastSyncAt: Instant | null;
  revoked: boolean;
}

export type OutcomeCode =
  | 'marked'
  | 'duplicate'
  | 'duplicate_upload'
  | 'arrived_too_late'
  | 'outside_window'
  | 'inactive_student'
  | 'unknown_student'
  | 'manual_locked'
  | 'face_verify_failed'
  | 'clock_skew'
  | 'needs_review';

export type ReviewFlag = 'missing_photo' | 'no_face_profile';

export interface OwnerNotice {
  kind:
    | 'absence_alert_cancelled'
    | 'phone_not_synced'
    | 'finalized_without_sync'
    | 'clock_skew'
    | 'review_needed';
  message: string;
  sessionId?: string;
  studentId?: string;
  deviceId?: string;
}

export type AlertTemplate = 'absent_today' | 'absence_streak';

export interface OutgoingAlert {
  /** Idempotency key: the same key is never sent twice. */
  key: string;
  template: AlertTemplate;
  studentId: string;
  /** null = nobody can be messaged; only the owner is told (if notifyOwner). */
  recipient: 'student' | 'guardian' | null;
  scheduledAt: Instant;
  /** Also notify the owner (streak alerts). */
  notifyOwner: boolean;
  sessionId?: string;
}
