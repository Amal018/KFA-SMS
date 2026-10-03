// The door screen: the phone stands at the entrance, the front camera reads
// QR cards and NFC listens in the background, all at once (APP-PLAN §3.5).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { cardPayload, expectedStudents, settingsForBatch, type CredentialScan } from '@kfa/core';
import { checkInWithCard, type CheckinResult, type Tone } from '@/attendance/checkin';
import { Button, colors, styles as ui } from '@/components/ui';
import * as q from '@/data/queries';
import { syncNow } from '@/data/sync';
import { DEMO_SECRET, isDemo } from '@/data/demo';
import { startListening, stopListening, type NfcState } from '@/lib/nfc';

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

const KEEP_AWAKE_TAG = 'attendance-mode';

/** Keep the door phone's screen on. Browsers (the web preview) don't support it reliably. */
function useKeepScreenOn() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);
}

export default function Attendance() {
  useKeepScreenOn();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [nfcState, setNfcState] = useState<NfcState | 'checking'>('checking');
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
    startListening((uid, payload) => handle(`nfc:${uid}`, { type: 'nfc', uid, payload }))
      .then((state) => !cancelled && setNfcState(state))
      .catch(() => setNfcState('off'));
    return () => {
      cancelled = true;
      stopListening();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [handle]);

  if (!permission) return <View style={ui.screen} />;
  // Demo mode works without a camera (simulated scans), e.g. on a laptop.
  if (!permission.granted && !isDemo()) {
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
      {permission.granted && (
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="front"
        animateShutter={false}
        onCameraReady={() => (cameraReady.current = true)}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcode}
      />
      )}

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

      {isDemo() && <DemoScanner onScan={(payload) => handle(`qr:${payload}`, { type: 'qr', payload })} />}

      <Pressable onLongPress={() => router.back()} delayLongPress={1200} style={s.exit} accessibilityHint="Hold to leave attendance mode">
        <Text style={{ color: '#fff' }}>Hold to exit</Text>
      </Pressable>
    </View>
  );
}

/** Demo only: tap a student to simulate showing their QR card. */
function DemoScanner({ onScan }: { onScan: (payload: string) => void }) {
  const students = q.students();
  const enrolments = q.enrolments();
  const expected = q.sessionsOn().flatMap((session) => expectedStudents(session, students, enrolments).map((e) => e.student));
  const unique = [...new Map(expected.map((st) => [st.id, st])).values()];
  return (
    <View style={s.demo}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>Demo: tap a student to simulate their QR card</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {unique.map((st) => (
          <Pressable key={st.id} onPress={() => onScan(cardPayload(DEMO_SECRET, st.id, 1))} style={s.demoChip}>
            <Text style={{ color: '#fff' }}>{st.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  demo: { position: 'absolute', top: 175, left: 16, right: 16, backgroundColor: 'rgba(138,59,18,0.85)', borderRadius: 12, padding: 12, gap: 8 },
  demoChip: { borderRadius: 999, borderWidth: 1, borderColor: '#fff', paddingHorizontal: 12, paddingVertical: 6 },
  top: { position: 'absolute', top: 48, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 14, gap: 4 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sub: { color: '#ddd', fontSize: 13 },
  frame: { position: 'absolute', top: '30%', left: '15%', right: '15%', aspectRatio: 1, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 20 },
  result: { position: 'absolute', left: 16, right: 16, bottom: 110, borderRadius: 16, padding: 20, gap: 6 },
  resultTitle: { fontSize: 26, fontWeight: '800' },
  exit: { position: 'absolute', bottom: 40, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
});
