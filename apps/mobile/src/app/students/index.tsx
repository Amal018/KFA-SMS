import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Field, Pill, styles } from '@/components/ui';
import { onDataChange } from '@/data/events';
import * as q from '@/data/queries';

export default function Students() {
  const [, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((t) => t + 1)), []);
  const [search, setSearch] = useState('');

  const credentials = q.credentials();
  const enrolments = q.enrolments();
  const term = search.trim().toLowerCase();
  const rows = q
    .studentRows()
    .filter((s) => !term || [s.full_name, s.admission_no, s.phone, s.whatsapp_number].some((v) => String(v ?? '').toLowerCase().includes(term)));

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Button title="Add student" onPress={() => router.push('/students/new')} />
            <Field label="Search" value={search} onChangeText={setSearch} placeholder="Name, admission no or phone" />
          </View>
        }
        ListEmptyComponent={<Text style={styles.muted}>No students found.</Text>}
        renderItem={({ item }) => {
          const has = (type: 'qr' | 'nfc') => credentials.some((c) => c.studentId === item.id && c.type === type && c.status === 'active');
          const batches = enrolments.filter((e) => e.studentId === item.id).map((e) => q.batchName(e.batchId));
          return (
            <Pressable onPress={() => router.push({ pathname: '/students/[id]', params: { id: item.id } })} style={[styles.card, { gap: 6 }]}>
              <Text style={styles.h2}>{item.full_name}</Text>
              <Text style={styles.muted}>{[item.admission_no, batches.join(', ')].filter(Boolean).join(' · ')}</Text>
              <View style={[styles.row, { flexWrap: 'wrap' }]}>
                {!has('qr') && <Pill text="No QR card" fg={colors.warn} bg={colors.warnBg} />}
                {!has('nfc') && <Pill text="No NFC sticker" fg={colors.muted} bg={colors.bg} />}
                {!item.whatsapp_opt_in && !item.guardian_whatsapp_opt_in && <Pill text="No WhatsApp consent" fg={colors.error} bg={colors.errorBg} />}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
