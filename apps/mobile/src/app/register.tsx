// Today's register with manual marking (spec §5.6, §8, R-03).
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { expectedStudents, fromRecord, localTimeOf, manualMark, type AttendanceStatus, type Role, type Session } from '@kfa/core';
import { Button, Card, colors, Field, Pill, statusColors, styles } from '@/components/ui';
import { emitChange, onDataChange } from '@/data/events';
import * as q from '@/data/queries';
import { putRecord } from '@/data/sync';
import { supabase } from '@/lib/supabase';

const METHOD_LABEL: Record<string, string> = { punch: 'scan', auto: 'auto', manual: 'manual' };
const STATUSES: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];

export default function Register() {
  const [, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((t) => t + 1)), []);
  const [editing, setEditing] = useState<{ session: Session; studentId: string } | null>(null);

  const students = q.students();
  const enrolments = q.enrolments();
  const records = q.records();
  const sessions = q.sessionsOn().filter((s) => s.status === 'scheduled');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {sessions.length === 0 && <Text style={styles.muted}>No classes today.</Text>}
      {sessions.map((session) => (
        <Card key={session.id}>
          <Text style={styles.h2}>
            {q.batchName(session.batchId)} · {session.start}–{session.end}
          </Text>
          {expectedStudents(session, students, enrolments).map(({ student, enrolment }) => {
            const rec = records.find((r) => r.sessionId === session.id && r.studentId === student.id);
            const status = rec?.status ?? 'pending';
            return (
              <Pressable
                key={student.id}
                onPress={() => setEditing({ session, studentId: student.id })}
                style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}
              >
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.body}>
                      {student.name}
                      {enrolment.kind === 'trial' ? '  (trial)' : ''}
                    </Text>
                    <Text style={styles.muted}>
                      {rec
                        ? [METHOD_LABEL[rec.source], rec.punchedAt ? localTimeOf(rec.punchedAt) : null, rec.reason].filter(Boolean).join(' · ')
                        : 'Not checked in yet'}
                    </Text>
                  </View>
                  <Pill text={status === 'pending' ? 'not yet' : status} {...statusColors[status]} />
                </View>
              </Pressable>
            );
          })}
        </Card>
      ))}
      {editing && <MarkModal {...editing} onClose={() => setEditing(null)} />}
    </ScrollView>
  );
}

function MarkModal({ session, studentId, onClose }: { session: Session; studentId: string; onClose: () => void }) {
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const { data: auth } = await supabase.auth.getUser();
    const actor = { userId: auth.user?.id ?? '', role: q.role() as Role, batchIds: q.batches().filter((b) => b.teacherId === auth.user?.id).map((b) => b.id) };
    const result = manualMark(session, studentId, status, reason, actor);
    if (!result.ok) return setError(result.error === 'reason_required' ? 'Please give a reason.' : "You can't mark this class.");
    setBusy(true);
    // Manual changes need the server: they are locked and audited (M-40, X-05).
    const row = { ...fromRecord(result.record), marked_by: actor.userId };
    const { error: dbError } = await supabase.from('attendance_records').upsert(row, { onConflict: 'session_id,student_id' });
    if (!dbError && result.cancelAlertKeys.length) {
      await supabase.from('outgoing_messages').update({ status: 'cancelled' }).in('key', result.cancelAlertKeys).eq('status', 'pending');
    }
    setBusy(false);
    if (dbError) return setError(`Couldn't save (are you online?): ${dbError.message}`);
    putRecord(row);
    emitChange('changed');
    onClose();
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View style={[styles.card, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20, gap: 12 }]}>
          <Text style={styles.h2}>{q.studentName(studentId)}</Text>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {STATUSES.map((s) => (
              <Pressable key={s} onPress={() => setStatus(s)}>
                <Pill text={s} fg={status === s ? '#fff' : statusColors[s].fg} bg={status === s ? statusColors[s].fg : statusColors[s].bg} />
              </Pressable>
            ))}
          </View>
          <Field label="Reason (required)" value={reason} onChangeText={setReason} placeholder="e.g. Forgot card, left early, on leave" />
          {error && <Text style={{ color: colors.error }}>{error}</Text>}
          <Button title="Save" onPress={save} busy={busy} />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
