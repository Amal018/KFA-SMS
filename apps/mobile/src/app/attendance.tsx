// The door screen: the phone stands at the entrance, the front camera reads
// QR cards and NFC listens in the background, all at once (APP-PLAN §3.5).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import NfcManager, { Ndef, NfcEvents, type TagEvent } from 'react-native-nfc-manager';
import { settingsForBatch, type CredentialScan } from '@kfa/core';
import { checkInWithCard, type CheckinResult, type Tone } from '@/attendance/checkin';
import { Button, colors, styles as ui } from '@/components/ui';
import * as q from '@/data/queries';
import { syncNow } from '@/data/sync';

const RESULT_MS = 3500;
const SAME_CARD_COOLDOWN_MS = 6000;

const toneStyle: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: colors.ok, fg: '#fff' },
  info: { bg: colors.info, fg: '#fff' },
  warn: { bg: colors.warn, fg: '#fff' },
  error: { bg: colors.error, fg: '#fff' },
};

/** Whether any of today's batches wants a photo with card scans (M-31). */
function photoWanted(): boolean {
  const settings = q.settings();
  const batches = q.batches();
  return q
    .sessionsOn()
    .some((s) => settingsForBatch(settings, batches.find((b) => b.id === s.batchId)).cardCheckLevel !== 'card_only');
}

function textFromTag(tag: TagEvent): string | null {
  const record = tag.ndefMessage?.[0];
  if (!record) return null;
  try {
    return Ndef.text.decodePayload(Uint8Array.from(record.payload));
  } catch {
    return null;
  }
}

export default function Attendance() {
  useKeepAwake();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [nfcState, setNfcState] = useState<'checking' | 'on' | 'off' | 'unsupported'>('checking');
  const camera = useRef<CameraView>(null);
  const cameraReady = useRef(false);
  const busy = useRef(false);
  const lastScan = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handle = useCallback(async (key: string, scan: CredentialScan) => {
    const now = Date.now();
    if (busy.current || (lastScan.current.key === key && now - lastScan.current.at < SAME_CARD_COOLDOWN_MS)) return;
    busy.current = true;
    lastScan.current = { key, at: now };
    try {
      let photoUri: string | null = null;
      if (photoWanted() && camera.current && cameraReady.current) {
        try {
          photoUri = (await camera.current.takePictureAsync({ quality: 0.3, shutterSound: false })).uri;
        } catch {
          photoUri = null; // Still marked, flagged missing_photo (M-31).
        }
      }
      const r = checkInWithCard(scan, photoUri);
      setResult(r);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setResult(null), RESULT_MS);
      syncNow().catch(() => {}); // Upload in the background when online.
    } finally {
      busy.current = false;
    }
  }, []);

  const onBarcode = useCallback((e: BarcodeScanningResult) => handle(`qr:${e.data}`, { type: 'qr', payload: e.data }), [handle]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await NfcManager.isSupported())) return setNfcState('unsupported');
      await NfcManager.start();
      if (!(await NfcManager.isEnabled())) return setNfcState('off');
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
        if (!tag.id) return;
        handle(`nfc:${tag.id}`, { type: 'nfc', uid: tag.id, payload: textFromTag(tag) });
      });
      await NfcManager.registerTagEvent({ invalidateAfterFirstRead: false, isReaderModeEnabled: true });
      if (!cancelled) setNfcState('on');
    })().catch(() => setNfcState('off'));
    return () => {
      cancelled = true;
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.unregisterTagEvent().catch(() => {});
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [handle]);

  if (!permission) return <View style={ui.screen} />;
  if (!permission.granted) {
    return (
      <View style={[ui.screen, ui.content, { justifyContent: 'center' }]}>
        <Text style={ui.h2}>Camera needed</Text>
        <Text style={ui.body}>The camera reads student QR cards and takes check-in photos.</Text>
        <Button title="Allow camera" onPress={requestPermission} />
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const tone = result ? toneStyle[result.tone] : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="front"
        animateShutter={false}
        onCameraReady={() => (cameraReady.current = true)}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcode}
      />

      <View style={s.top}>
        <Text style={s.title}>Show your card, or tap your sticker</Text>
        <Text style={s.sub}>
          NFC: {nfcState === 'on' ? 'ready' : nfcState === 'off' ? 'turned off in phone settings' : nfcState === 'unsupported' ? 'not on this phone' : '…'}
          {'  ·  '}Face recognition: coming soon
        </Text>
      </View>

      <View style={s.frame} pointerEvents="none" />

      {result && tone && (
        <View style={[s.result, { backgroundColor: tone.bg }]}>
          <Text style={[s.resultTitle, { color: tone.fg }]}>{result.title}</Text>
          {result.detail ? <Text style={{ color: tone.fg, fontSize: 16 }}>{result.detail}</Text> : null}
        </View>
      )}

      <Pressable onLongPress={() => router.back()} delayLongPress={1200} style={s.exit} accessibilityHint="Hold to leave attendance mode">
        <Text style={{ color: '#fff' }}>Hold to exit</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', top: 48, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 14, gap: 4 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sub: { color: '#ddd', fontSize: 13 },
  frame: { position: 'absolute', top: '30%', left: '15%', right: '15%', aspectRatio: 1, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 20 },
  result: { position: 'absolute', left: 16, right: 16, bottom: 110, borderRadius: 16, padding: 20, gap: 6 },
  resultTitle: { fontSize: 26, fontWeight: '800' },
  exit: { position: 'absolute', bottom: 40, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
});
