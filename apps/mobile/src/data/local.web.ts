// Web preview version of the offline cache (see local.ts). Browser SQLite needs
// cross-origin isolation headers the dev server doesn't send, so the preview
// keeps the same data in localStorage instead. The phone app uses SQLite.
import type { Row } from '@kfa/core';
import type { EntityKind, QueuedPunch } from './local';

export type { EntityKind, QueuedPunch } from './local';

const KEY = 'kfa:local';

interface Store {
  entities: Record<string, Record<string, Row>>;
  queue: (QueuedPunch & { uploaded: boolean; outcome: string | null })[];
  kv: Record<string, string>;
}

function load(): Store {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupt or blocked storage: start empty.
  }
  return { entities: {}, queue: [], kv: {} };
}

let store = load();

function save(): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export function getAll(kind: EntityKind): Row[] {
  return Object.values(store.entities[kind] ?? {});
}

export function getOne(kind: EntityKind, id: string): Row | null {
  return store.entities[kind]?.[id] ?? null;
}

export function put(kind: EntityKind, id: string, row: Row): void {
  (store.entities[kind] ??= {})[id] = row;
  save();
}

export function replaceAll(kind: EntityKind, rows: Row[], idOf: (r: Row) => string = (r) => r.id): void {
  store.entities[kind] = Object.fromEntries(rows.map((r) => [idOf(r), r]));
  save();
}

export const recordId = (r: Row) => `${r.session_id}/${r.student_id}`;

export function getKv(key: string): string | null {
  return store.kv[key] ?? null;
}

export function setKv(key: string, value: string): void {
  store.kv[key] = value;
  save();
}

export function enqueuePunch(clientPunchId: string, data: Row, photoUri: string | null): void {
  if (store.queue.some((q) => q.clientPunchId === clientPunchId)) return;
  store.queue.push({ clientPunchId, data, photoUri, createdAt: Date.now(), uploaded: false, outcome: null });
  save();
}

export function pendingPunches(): QueuedPunch[] {
  return store.queue.filter((q) => !q.uploaded).map(({ clientPunchId, data, photoUri, createdAt }) => ({ clientPunchId, data, photoUri, createdAt }));
}

export function markUploaded(clientPunchId: string, outcome: string): void {
  const q = store.queue.find((p) => p.clientPunchId === clientPunchId);
  if (q) Object.assign(q, { uploaded: true, outcome });
  save();
}

export function seenPunchIds(): Set<string> {
  return new Set(store.queue.map((q) => q.clientPunchId));
}

export function pendingCount(): number {
  return store.queue.filter((q) => !q.uploaded).length;
}

export function clearAll(): void {
  store = { entities: {}, queue: [], kv: {} };
  save();
}
