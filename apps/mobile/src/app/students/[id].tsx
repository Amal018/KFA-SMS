// Student profile: attendance summary, QR card, NFC sticker (spec §5.3, §5.4, R-04).
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import QRCode from 'react-native-qrcode-svg';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';
import { cardPayload, normalizeUid, summarize } from '@kfa/core';
import { Button, Card, colors, Pill, styles } from '@/components/ui';
import { onDataChange } from '@/data/events';
import { getOne } from '@/data/local';
import * as q from '@/data/queries';
import { CARD_SECRET_KEY, syncNow } from '@/data/sync';
import { supabase } from '@/lib/supabase';

export default function StudentProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((t) => t + 1)), []);
  const [busy, setBusy] = useState<string | null>(null);

  const row = getOne('student', id);
  if (!row) return <Text style={[styles.content, styles.muted]}>Student not found. Pull down to sync on the home screen.</Text>;

  const creds = q.credentials().filter((c) => c.studentId === id && c.status === 'active');
  const qr = creds.find((c) => c.type === 'qr');
  const nfc = creds.find((c) => c.type === 'nfc');
  const secret = SecureStore.getItem(CARD_SECRET_KEY);
  const payload = qr && secret ? cardPayload(secret, id, Number(qr.value)) : null;
  const summary = summarize(
    q.records().filter((r) => r.studentId === id),
    q.sessions(),
  );
  const enrolments = q.enrolments().filter((e) => e.studentId === id);

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    try {
      await task();
      await syncNow().catch(() => {});
    } catch (e) {
      Alert.alert('Something went wrong', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /** Lost card: bump the version so the old QR stops working (M-12). */
  const reissueQr = () =>
    run('qr', async () => {
      const next = qr ? Number(qr.value) + 1 : 1;
      if (qr) {
        const { error } = await supabase.from('credentials').update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_reason: 'Reissued' }).eq('id', qr.id);
        if (error) throw new Error(error.message);
      }
      const { error } = await supabase.from('credentials').insert({ student_id: id, type: 'qr', value: String(next) });
      if (error) throw new Error(error.message);
    });

  /** Hold a sticker to the phone: save its UID and write the signed payload to it (M-20). */
  const linkNfc = () =>
    run('nfc', async () => {
      if (!secret) throw new Error('Sync first so this phone has the card key.');
      if (!(await NfcManager.isSupported())) throw new Error('This phone has no NFC.');
      await NfcManager.start();
      try {
        await NfcManager.requestTechnology(NfcTech.Ndef, { alertMessage: 'Hold the sticker to the back of the phone' });
        const tag = await NfcManager.getTag();
        if (!tag?.id) throw new Error("Couldn't read the sticker.");
        const bytes = Ndef.encodeMessage([Ndef.textRecord(cardPayload(secret, id, 1))]);
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        if (nfc) await supabase.from('credentials').update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_reason: 'Replaced' }).eq('id', nfc.id);
        const { error } = await supabase.from('credentials').insert({ student_id: id, type: 'nfc', value: normalizeUid(tag.id) });
        if (error) throw new Error(error.message.includes('credentials_nfc_uid') ? 'This sticker is already linked to someone.' : error.message);
      } finally {
        await NfcManager.cancelTechnologyRequest().catch(() => {});
      }
    });

  const unlinkNfc = () =>
    nfc &&
    run('unlink', async () => {
      const { error } = await supabase.from('credentials').update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_reason: 'Lost or removed' }).eq('id', nfc.id);
      if (error) throw new Error(error.message);
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: row.full_name }} />
      <Card>
        <Text style={styles.h1}>{row.full_name}</Text>
        <Text style={styles.muted}>{[row.admission_no, enrolments.map((e) => q.batchName(e.batchId) + (e.kind === 'trial' ? ' (trial)' : '')).join(', ')].filter(Boolean).join(' · ')}</Text>
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          <Pill text={summary.percent === null ? 'Attendance: –' : `Attendance ${summary.percent}%`} fg={colors.info} bg={colors.infoBg} />
          <Pill text={`${summary.present + summary.late} attended`} fg={colors.ok} bg={colors.okBg} />
          <Pill text={`${summary.absent} absent`} fg={colors.error} bg={colors.errorBg} />
        </View>
      </Card>

      <Card style={{ alignItems: 'center' }}>
        <Text style={[styles.h2, { alignSelf: 'flex-start' }]}>QR card</Text>
        {payload ? <QRCode value={payload} size={200} /> : <Text style={styles.muted}>{qr ? 'Sync to load the card key.' : 'No card issued.'}</Text>}
        {qr && <Text style={styles.muted}>Card version {qr.value}. Screenshot or print this for the student.</Text>}
        <Button title={qr ? 'Reissue card (old one stops working)' : 'Issue card'} variant="secondary" onPress={reissueQr} busy={busy === 'qr'} />
      </Card>

      <Card>
        <Text style={styles.h2}>NFC sticker</Text>
        <Text style={styles.muted}>{nfc ? `Linked (${nfc.value})` : 'No sticker linked.'}</Text>
        <Button title={nfc ? 'Replace sticker' : 'Link a sticker'} variant="secondary" onPress={linkNfc} busy={busy === 'nfc'} />
        {nfc && <Button title="Unlink (lost sticker)" variant="danger" onPress={unlinkNfc} busy={busy === 'unlink'} />}
      </Card>

      <Card>
        <Text style={styles.h2}>Face</Text>
        <Text style={styles.muted}>{row.face_consent ? 'Consent given. Face registration arrives in the next update.' : 'No face consent: uses card or sticker.'}</Text>
      </Card>
    </ScrollView>
  );
}
