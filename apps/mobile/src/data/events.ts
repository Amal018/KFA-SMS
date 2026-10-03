// Tiny pub/sub so screens refresh after a sync or a check-in.
type SyncEvent = { state: 'done' | 'error' | 'changed'; message?: string };
type Listener = (e: SyncEvent) => void;

const listeners = new Set<Listener>();

export function onDataChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitChange(state: SyncEvent['state'], message?: string): void {
  for (const l of listeners) l({ state, message });
}
