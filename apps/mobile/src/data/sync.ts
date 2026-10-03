// Pull what attendance needs into the offline cache, and push queued check-ins
// to the server, which re-runs the rules as the source of truth (spec §11).
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import {
  addDays,
  fromSession,
  generateSessions,
  localDateOf,
  toHoliday,
  toSchedule,
  type Row,
} from '@kfa/core';
import { supabase } from '@/lib/supabase';
import { emitChange } from './events';
import { getKv, markUploaded, pendingPunches, put, recordId, replaceAll, setKv } from './local';

export const CARD_SECRET_KEY = 'kfa_card_secret';

function rows(res: { data: unknown; error: { message: string } | null }): Row[] {
  if (res.error) throw new Error(res.error.message);
  return (res.data as Row[] | null) ?? [];
}

/** Register this phone once; finalisation waits for every registered phone to sync (F-04). */
export async function ensureDevice(name: string): Promise<string> {
  const existing = getKv('device_id');
  if (existing) return existing;
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('devices')
    .insert({ name, user_id: auth.user?.id, app_version: Constants.expoConfig?.version ?? null })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  setKv('device_id', data.id);
  return data.id;
}

export async function pullAll(): Promise<void> {
  const today = localDateOf(Date.now());
  const from = addDays(today, -1);
  const to = addDays(today, 7);

  const role = (await supabase.rpc('my_role')).data as string | null;
  if (!role) throw new Error('Your account has no staff profile yet. Ask the owner to add you.');
  setKv('role', role);

  const settings = (await supabase.from('institute_settings').select('*').eq('id', 1).maybeSingle()).data;
  setKv('settings', JSON.stringify(settings ?? {}));

  if (role !== 'teacher') {
    const secret = (await supabase.from('app_secrets').select('card_secret').eq('id', 1).maybeSingle()).data?.card_secret;
    if (secret) await SecureStore.setItemAsync(CARD_SECRET_KEY, secret);
  }

  replaceAll('batch', rows(await supabase.from('batches').select('*').eq('active', true)));
  replaceAll('enrolment', rows(await supabase.from('enrolments').select('*').eq('status', 'active')));
  if (role === 'teacher') {
    replaceAll('student', rows(await supabase.from('teacher_students').select('*')).map((s) => ({ ...s, whatsapp_opt_in: false })));
    replaceAll('credential', []);
  } else {
    replaceAll('student', rows(await supabase.from('students').select('*').is('left_on', null)));
    replaceAll('student_pause', rows(await supabase.from('student_pauses').select('*').gte('to_date', from)));
    replaceAll('credential', rows(await supabase.from('credentials').select('*')));
    replaceAll('leave', rows(await supabase.from('leaves').select('*').gte('to_date', from)));
  }

  // Sessions: generate locally from schedules so the phone works offline even
  // before the server cron runs, then let server rows (cancellations, extras) win.
  const schedules = rows(await supabase.from('schedules').select('*')).map(toSchedule);
  const holidays = rows(await supabase.from('holidays').select('*').gte('date', from).lte('date', to)).map(toHoliday);
  const serverSessions = rows(await supabase.from('sessions').select('*').gte('date', from).lte('date', to));
  const byId = new Map<string, Row>(generateSessions(schedules, holidays, from, to).map((s) => [s.id, fromSession(s)]));
  for (const s of serverSessions) byId.set(s.id, s);
  replaceAll('session', [...byId.values()]);

  const ids = [...byId.keys()];
  replaceAll('record', ids.length ? rows(await supabase.from('attendance_records').select('*').in('session_id', ids)) : [], recordId);
  setKv('last_pull', String(Date.now()));
}

async function uploadPhoto(clientPunchId: string, uri: string): Promise<string | null> {
  try {
    const body = await (await fetch(uri)).arrayBuffer();
    const path = `verify/${localDateOf(Date.now())}/${clientPunchId}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(path, body, { contentType: 'image/jpeg', upsert: true });
    return error ? null : path;
  } catch {
    return null;
  }
}

export interface PushResult {
  uploaded: number;
  clockDriftMs: number | null;
}

export async function pushPunches(): Promise<PushResult> {
  const deviceId = getKv('device_id');
  const queue = pendingPunches();
  if (!deviceId) return { uploaded: 0, clockDriftMs: null };

  const punches = [];
  for (const q of queue) {
    const verifyPhotoPath = q.photoUri ? await uploadPhoto(q.clientPunchId, q.photoUri) : null;
    punches.push({ ...q.data, verifyPhotoPath });
  }
  // An empty upload still counts as a sync, so finalisation isn't held up (F-04).
  const { data, error } = await supabase.functions.invoke('ingest-punches', {
    body: { deviceId, appVersion: Constants.expoConfig?.version, clientTime: new Date().toISOString(), punches },
  });
  if (error) throw new Error(error.message);
  for (const r of data.results as { clientPunchId: string; outcome: string }[]) markUploaded(r.clientPunchId, r.outcome);
  setKv('last_push', String(Date.now()));
  return { uploaded: punches.length, clockDriftMs: data.clockDriftMs ?? null };
}

let running: Promise<PushResult> | null = null;

/** Push then pull. Concurrent calls share one run. */
export function syncNow(): Promise<PushResult> {
  running ??= (async () => {
    try {
      const result = await pushPunches();
      await pullAll();
      setKv('last_sync', String(Date.now()));
      if (result.clockDriftMs !== null) setKv('clock_drift_ms', String(result.clockDriftMs));
      emitChange('done');
      return result;
    } catch (e) {
      emitChange('error', (e as Error).message);
      throw e;
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Apply a record change locally right away (the server confirms on sync). */
export function putRecord(row: Row): void {
  put('record', recordId(row), row);
}
