import type { Instant, LocalDate, LocalTime } from './types.ts';

/** India Standard Time is a fixed UTC+05:30 with no daylight saving. */
export const IST_OFFSET_MIN = 330;
export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

function parseDate(date: LocalDate): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function parseTime(time: LocalTime): [number, number] {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) throw new Error(`Invalid time: ${time}`);
  return [Number(m[1]), Number(m[2])];
}

/** The instant of an IST wall-clock date and time. */
export function toInstant(date: LocalDate, time: LocalTime): Instant {
  const [y, mo, d] = parseDate(date);
  const [h, mi] = parseTime(time);
  return Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MIN * MINUTE;
}

/** The IST calendar date of an instant. */
export function localDateOf(instant: Instant): LocalDate {
  return new Date(instant + IST_OFFSET_MIN * MINUTE).toISOString().slice(0, 10);
}

/** The IST wall-clock time of an instant. */
export function localTimeOf(instant: Instant): LocalTime {
  return new Date(instant + IST_OFFSET_MIN * MINUTE).toISOString().slice(11, 16);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, mo, d] = parseDate(date);
  return new Date(Date.UTC(y, mo - 1, d) + days * DAY).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(date: LocalDate): number {
  const [y, mo, d] = parseDate(date);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** Inclusive date comparison helper; ISO dates compare correctly as strings. */
export function inRange(date: LocalDate, from: LocalDate, to: LocalDate | null): boolean {
  return date >= from && (to === null || date <= to);
}

/** Whole years between a birth date and a date. */
export function ageOn(dateOfBirth: LocalDate, on: LocalDate): number {
  const [by, bm, bd] = parseDate(dateOfBirth);
  const [y, m, d] = parseDate(on);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}

/**
 * The earliest instant at or after `at` that is outside quiet hours.
 * Quiet hours run from `quietStart` to `quietEnd` and may cross midnight.
 */
export function nextSendTime(at: Instant, quietStart: LocalTime, quietEnd: LocalTime): Instant {
  const time = localTimeOf(at);
  const date = localDateOf(at);
  const crossesMidnight = quietStart > quietEnd;
  const inQuiet = crossesMidnight
    ? time >= quietStart || time < quietEnd
    : time >= quietStart && time < quietEnd;
  if (!inQuiet) return at;
  const endDate = crossesMidnight && time >= quietStart ? addDays(date, 1) : date;
  return toInstant(endDate, quietEnd);
}
