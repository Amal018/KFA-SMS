// Browsers (the local web preview) have no NFC.
export type NfcState = 'on' | 'off' | 'unsupported';

export async function startListening(_onTag: (uid: string, payload: string | null) => void): Promise<NfcState> {
  return 'unsupported';
}

export function stopListening(): void {}

export async function writeSticker(_payload: string): Promise<string> {
  throw new Error('NFC stickers can only be linked from the phone app.');
}
