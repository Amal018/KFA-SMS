// NFC sticker reading and writing (spec §5.4). Web has no NFC: see nfc.web.ts.
import NfcManager, { Ndef, NfcEvents, NfcTech, type TagEvent } from 'react-native-nfc-manager';

export type NfcState = 'on' | 'off' | 'unsupported';

function textFromTag(tag: TagEvent): string | null {
  const record = tag.ndefMessage?.[0];
  if (!record) return null;
  try {
    return Ndef.text.decodePayload(Uint8Array.from(record.payload));
  } catch {
    return null;
  }
}

/** Listen for sticker taps in the background. Returns the NFC state. */
export async function startListening(onTag: (uid: string, payload: string | null) => void): Promise<NfcState> {
  if (!(await NfcManager.isSupported())) return 'unsupported';
  await NfcManager.start();
  if (!(await NfcManager.isEnabled())) return 'off';
  NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
    if (tag.id) onTag(tag.id, textFromTag(tag));
  });
  await NfcManager.registerTagEvent({ invalidateAfterFirstRead: false, isReaderModeEnabled: true });
  return 'on';
}

export function stopListening(): void {
  NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
  NfcManager.unregisterTagEvent().catch(() => {});
}

/** Wait for a sticker, write `payload` to it as a text record, and return its UID. */
export async function writeSticker(payload: string): Promise<string> {
  if (!(await NfcManager.isSupported())) throw new Error('This phone has no NFC.');
  await NfcManager.start();
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, { alertMessage: 'Hold the sticker to the back of the phone' });
    const tag = await NfcManager.getTag();
    if (!tag?.id) throw new Error("Couldn't read the sticker.");
    await NfcManager.ndefHandler.writeNdefMessage(Ndef.encodeMessage([Ndef.textRecord(payload)]));
    return tag.id;
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}
