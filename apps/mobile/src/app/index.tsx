import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { expectedStudents, localTimeOf } from '@kfa/core';
import { Button, Card, colors, Pill, statusColors, styles } from '@/components/ui';
import { onDataChange } from '@/data/events';
import { clearAll, getKv, pendingCount } from '@/data/local';
import * as q from '@/data/queries';
import { ensureDevice, syncNow } from '@/data/sync';
import { supabase } from '@/lib/supabase';

function useRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((t) => t + 1)), []);
}

export default function Home() {
  useRefresh();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      await ensureDevice(Constants.deviceName ?? 'Phone');
      await syncNow();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const role = q.role();
  const today = q.sessionsOn();
  const students = q.students();
  const enrolments = q.enrolments();
  const records = q.records();
  const lastSync = getKv('last_sync');
  const pending = pendingCount();
  const drift = Number(getKv('clock_drift_ms') ?? 0);

  function signOut() {
    const go = async () => {
      clearAll();
      await supabase.auth.signOut();
    };
    if (pending > 0) {
      Alert.alert('Check-ins not uploaded', `${pending} check-in(s) haven't reached the server yet. Sync first, or they will be lost.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out anyway', style: 'destructive', onPress: go },
      ]);
    } else go();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={syncing} onRefresh={sync} />}>
      <Card>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.h2}>Sync</Text>
          {pending > 0 ? <Pill text={`${pending} waiting`} fg={colors.warn} bg={colors.warnBg} /> : <Pill text="Up to date" fg={colors.ok} bg={colors.okBg} />}
        </View>
        <Text style={styles.muted}>{lastSync ? `Last synced at ${localTimeOf(Number(lastSync))}` : 'Not synced yet'}</Text>
        {Math.abs(drift) > 120_000 && (
          <Text style={{ color: colors.error }}>This phone's clock is off by {Math.round(drift / 60_000)} min. Fix it in Settings → Date & time.</Text>
        )}
        {error && <Text style={{ color: colors.error }}>{error}</Text>}
        <Button title="Sync now" variant="secondary" onPress={sync} busy={syncing} />
      </Card>

      {role !== 'teacher' && <Button title="Start attendance mode" onPress={() => router.push('/attendance')} />}

      <Text style={styles.h2}>Today's classes</Text>
      {today.length === 0 && <Text style={styles.muted}>No classes today.</Text>}
      {today.map((s) => {
        const expected = expectedStudents(s, students, enrolments);
        const recs = records.filter((r) => r.sessionId === s.id);
        const count = (st: string) => recs.filter((r) => r.status === st).length;
        return (
          <Card key={s.id}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.h2}>{q.batchName(s.batchId)}</Text>
              <Text style={styles.muted}>
                {s.start}–{s.end}
              </Text>
            </View>
            {s.status !== 'scheduled' ? (
              <Pill text={s.status === 'holiday' ? 'Holiday' : 'Cancelled'} fg={colors.muted} bg={colors.bg} />
            ) : (
              <View style={[styles.row, { flexWrap: 'wrap' }]}>
                <Pill text={`${count('present')} present`} {...statusColors.present} />
                <Pill text={`${count('late')} late`} {...statusColors.late} />
                <Pill text={`${count('absent')} absent`} {...statusColors.absent} />
                <Pill text={`${Math.max(0, expected.length - recs.length)} not yet`} {...statusColors.pending} />
              </View>
            )}
          </Card>
        );
      })}

      <Button title="Today's register" variant="secondary" onPress={() => router.push('/register')} />
      {role !== 'teacher' && <Button title="Students" variant="secondary" onPress={() => router.push('/students')} />}
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}
