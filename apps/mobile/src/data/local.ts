// Offline cache: the data attendance needs, plus the queue of check-ins
// waiting to upload (spec D-01, D-06). Rows are stored as the server sends them.
import * as SQLite from 'expo-sqlite';
import type { Row } from '@kfa/core';

export type EntityKind =
  | 'student'
  | 'student_pause'
  | 'batch'
  | 'enrolment'
  | 'session'
  | 'record'
  | 'credential'
  | 'leave';

const db = SQLite.openDatabaseSync('kfa.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS entities (kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (kind, id));
  CREATE TABLE IF NOT EXISTS punch_queue (
    client_punch_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    photo_uri TEXT,
    created_at INTEGER NOT NULL,
    uploaded INTEGER NOT NULL DEFAULT 0,
    server_outcome TEXT
  );
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

export function getAll(kind: EntityKind): Row[] {
  return db.getAllSync<{ data: string }>('SELECT data FROM entities WHERE kind = ?', [kind]).map((r) => JSON.parse(r.data));
}

export function getOne(kind: EntityKind, id: string): Row | null {
  const r = db.getFirstSync<{ data: string }>('SELECT data FROM entities WHERE kind = ? AND id = ?', [kind, id]);
  return r ? JSON.parse(r.data) : null;
}

export function put(kind: EntityKind, id: string, row: Row): void {
  db.runSync('INSERT OR REPLACE INTO entities (kind, id, data) VALUES (?, ?, ?)', [kind, id, JSON.stringify(row)]);
}

/** Replace every row of a kind (a full pull from the server). */
export function replaceAll(kind: EntityKind, rows: Row[], idOf: (r: Row) => string = (r) => r.id): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM entities WHERE kind = ?', [kind]);
    for (const r of rows) put(kind, idOf(r), r);
  });
}

export const recordId = (r: Row) => `${r.session_id}/${r.student_id}`;

export function getKv(key: string): string | null {
  return db.getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key])?.value ?? null;
}

export function setKv(key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', [key, value]);
}

export interface QueuedPunch {
  clientPunchId: string;
  data: Row;
  photoUri: string | null;
  createdAt: number;
}

/** Written before the result is shown, so a crash or dead battery loses nothing (D-06). */
export function enqueuePunch(clientPunchId: string, data: Row, photoUri: string | null): void {
  db.runSync('INSERT OR IGNORE INTO punch_queue (client_punch_id, data, photo_uri, created_at) VALUES (?, ?, ?, ?)', [
    clientPunchId,
    JSON.stringify(data),
    photoUri,
    Date.now(),
  ]);
}

export function pendingPunches(): QueuedPunch[] {
  return db
    .getAllSync<{ client_punch_id: string; data: string; photo_uri: string | null; created_at: number }>(
      'SELECT * FROM punch_queue WHERE uploaded = 0 ORDER BY created_at',
    )
    .map((r) => ({ clientPunchId: r.client_punch_id, data: JSON.parse(r.data), photoUri: r.photo_uri, createdAt: r.created_at }));
}

export function markUploaded(clientPunchId: string, outcome: string): void {
  db.runSync('UPDATE punch_queue SET uploaded = 1, server_outcome = ? WHERE client_punch_id = ?', [outcome, clientPunchId]);
}

export function seenPunchIds(): Set<string> {
  return new Set(db.getAllSync<{ client_punch_id: string }>('SELECT client_punch_id FROM punch_queue').map((r) => r.client_punch_id));
}

export function pendingCount(): number {
  return db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM punch_queue WHERE uploaded = 0')?.n ?? 0;
}

/** Sign-out: forget everything cached on this phone. */
export function clearAll(): void {
  db.execSync('DELETE FROM entities; DELETE FROM punch_queue; DELETE FROM kv;');
}
