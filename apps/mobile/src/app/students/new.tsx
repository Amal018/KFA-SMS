// Add a student with consents and batches, and issue their first QR card.
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { localDateOf } from '@kfa/core';
import { Button, Card, colors, Field, Pill, styles } from '@/components/ui';
import * as q from '@/data/queries';
import { syncNow } from '@/data/sync';
import { supabase } from '@/lib/supabase';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Text style={[styles.body, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

export default function NewStudent() {
  const [f, setF] = useState({
    full_name: '',
    admission_no: '',
    date_of_birth: '',
    phone: '',
    whatsapp_number: '',
    whatsapp_opt_in: false,
    guardian_name: '',
    guardian_relation: '',
    guardian_whatsapp_number: '',
    guardian_whatsapp_opt_in: false,
    face_consent: false,
  });
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(localDateOf(Date.now()));
  const [trial, setTrial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const minor = DATE.test(f.date_of_birth) && Date.now() - Date.parse(f.date_of_birth) < 18 * 365.25 * 86_400_000;

  async function save() {
    setError(null);
    if (!f.full_name.trim()) return setError('Name is required.');
    if (f.date_of_birth && !DATE.test(f.date_of_birth)) return setError('Date of birth must look like 2012-04-30.');
    if (!DATE.test(startDate)) return setError('Start date must look like 2026-10-03.');
    if (minor && !f.guardian_name.trim()) return setError('A guardian is required for students under 18.');
    if (batchIds.length === 0) return setError('Choose at least one batch.');

    setBusy(true);
    const now = new Date().toISOString();
    const digits = (v: string) => v.replace(/[^\d]/g, '') || null;
    const { data: student, error: e1 } = await supabase
      .from('students')
      .insert({
        ...f,
        full_name: f.full_name.trim(),
        admission_no: f.admission_no.trim() || null,
        date_of_birth: f.date_of_birth || null,
        whatsapp_number: digits(f.whatsapp_number),
        guardian_whatsapp_number: digits(f.guardian_whatsapp_number),
        whatsapp_opt_in_at: f.whatsapp_opt_in || f.guardian_whatsapp_opt_in ? now : null,
        face_consent_at: f.face_consent ? now : null,
      })
      .select('id')
      .single();
    if (e1 || !student) {
      setBusy(false);
      return setError(`Couldn't save (are you online?): ${e1?.message}`);
    }
    const { error: e2 } = await supabase
      .from('enrolments')
      .insert(batchIds.map((batch_id) => ({ student_id: student.id, batch_id, start_date: startDate, kind: trial ? 'trial' : 'regular' })));
    const { error: e3 } = await supabase.from('credentials').insert({ student_id: student.id, type: 'qr', value: '1' });
    setBusy(false);
    if (e2 || e3) return setError(`Student saved, but: ${(e2 ?? e3)?.message}`);
    await syncNow().catch(() => {});
    router.replace({ pathname: '/students/[id]', params: { id: student.id } });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.h2}>Student</Text>
        <Field label="Full name" value={f.full_name} onChangeText={set('full_name')} />
        <Field label="Admission no." value={f.admission_no} onChangeText={set('admission_no')} placeholder="KFA-001" />
        <Field label="Date of birth (YYYY-MM-DD)" value={f.date_of_birth} onChangeText={set('date_of_birth')} keyboardType="numbers-and-punctuation" />
        <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="WhatsApp number (with 91)" value={f.whatsapp_number} onChangeText={set('whatsapp_number')} keyboardType="phone-pad" placeholder="919876543210" />
        <Toggle label="Student agrees to WhatsApp messages" value={f.whatsapp_opt_in} onChange={set('whatsapp_opt_in')} />
      </Card>

      <Card>
        <Text style={styles.h2}>Guardian{minor ? ' (required, under 18)' : ''}</Text>
        <Field label="Name" value={f.guardian_name} onChangeText={set('guardian_name')} />
        <Field label="Relation" value={f.guardian_relation} onChangeText={set('guardian_relation')} placeholder="Mother, Father…" />
        <Field label="WhatsApp number (with 91)" value={f.guardian_whatsapp_number} onChangeText={set('guardian_whatsapp_number')} keyboardType="phone-pad" />
        <Toggle label="Guardian agrees to WhatsApp messages" value={f.guardian_whatsapp_opt_in} onChange={set('guardian_whatsapp_opt_in')} />
      </Card>

      <Card>
        <Text style={styles.h2}>Consent</Text>
        <Toggle label={minor ? 'Guardian consents to face recognition' : 'Student consents to face recognition'} value={f.face_consent} onChange={set('face_consent')} />
        <Text style={styles.muted}>Collect the signed consent form too. Without face consent, the student uses their QR card or NFC sticker.</Text>
      </Card>

      <Card>
        <Text style={styles.h2}>Batches</Text>
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          {q.batches().map((b) => {
            const on = batchIds.includes(b.id);
            return (
              <Pressable key={b.id} onPress={() => setBatchIds((ids) => (on ? ids.filter((i) => i !== b.id) : [...ids, b.id]))}>
                <Pill text={b.name} fg={on ? '#fff' : colors.primary} bg={on ? colors.primary : colors.bg} />
              </Pressable>
            );
          })}
        </View>
        <Field label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
        <Toggle label="Trial class (no absence messages)" value={trial} onChange={setTrial} />
      </Card>

      {error && <Text style={{ color: colors.error }}>{error}</Text>}
      <Button title="Save student" onPress={save} busy={busy} />
    </ScrollView>
  );
}
