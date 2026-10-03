// Read helpers over the offline cache, returning core types.
import {
  localDateOf,
  toBatch,
  toCredential,
  toEnrolment,
  toLeave,
  toRecord,
  toSession,
  toSettings,
  toStudent,
  type AttendanceSettings,
  type Batch,
  type Row,
  type Session,
} from '@kfa/core';
import { getAll, getKv } from './local';

export const settings = (): AttendanceSettings => toSettings(JSON.parse(getKv('settings') ?? 'null'));
export const batches = (): Batch[] => getAll('batch').map(toBatch);
export const studentRows = (): Row[] => getAll('student').sort((a, b) => String(a.full_name).localeCompare(b.full_name));
export const students = () => {
  const pauses = getAll('student_pause');
  return getAll('student').map((r) => toStudent(r, pauses));
};
export const enrolments = () => getAll('enrolment').map(toEnrolment);
export const credentials = () => getAll('credential').map(toCredential);
export const leaves = () => getAll('leave').map(toLeave);
export const records = () => getAll('record').map(toRecord);
export const sessions = (): Session[] => getAll('session').map(toSession);

export function sessionsOn(date = localDateOf(Date.now())): Session[] {
  return sessions()
    .filter((s) => s.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export const role = () => getKv('role') ?? 'staff';
export const studentName = (id: string) => getAll('student').find((s) => s.id === id)?.full_name ?? 'Unknown student';
export const batchName = (id: string) => getAll('batch').find((b) => b.id === id)?.name ?? '';
