// The card-signing key lives in the phone's secure storage. The web preview
// has no secure storage, so it falls back to localStorage there.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export function getSecret(key: string): string | null {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItem(key);
}

export async function setSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecret(key: string): Promise<void> {
  if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
  await SecureStore.deleteItemAsync(key);
}
