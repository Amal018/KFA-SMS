// Runs every 5 minutes (pg_cron): sends due WhatsApp messages through the
// official WhatsApp Cloud API (or a BSP exposing the same API), with a final
// re-check before each send (N-07), retries and owner notices.
import { localDateOf } from '@kfa/core';
import { isServiceCall, json, notify, one, rows, serviceClient } from '../_shared/db.ts';

const MAX_ATTEMPTS = 3;
const BATCH = 50;

interface Template {
  name: string;
  params: string[];
}

/**
 * WHATSAPP_PROVIDER:
 *   "log"   (default) – don't send, just record; safe for testing
 *   "cloud" – POST to WHATSAPP_API_URL (default Meta Graph API) with WHATSAPP_TOKEN
 */
async function sendWhatsApp(to: string, template: Template): Promise<{ id: string }> {
  const provider = Deno.env.get('WHATSAPP_PROVIDER') ?? 'log';
  if (provider === 'log') {
    console.log(`[whatsapp:log] to=${to} template=${template.name} params=${JSON.stringify(template.params)}`);
    return { id: `log-${crypto.randomUUID()}` };
  }
  const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const base = Deno.env.get('WHATSAPP_API_URL') ?? `https://graph.facebook.com/v21.0/${phoneId}/messages`;
  const res = await fetch(base, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('WHATSAPP_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') ?? 'en' },
        components: [{ type: 'body', parameters: template.params.map((text) => ({ type: 'text', text })) }],
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error?.message ?? `HTTP ${res.status}`) as Error & { permanent?: boolean };
    // 131026: recipient not on WhatsApp / undeliverable; 4xx (except rate limits) won't succeed on retry.
    err.permanent = body?.error?.code === 131026 || (res.status >= 400 && res.status < 500 && res.status !== 429);
    throw err;
  }
  return { id: body?.messages?.[0]?.id ?? 'unknown' };
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

Deno.serve(async (req) => {
  if (!isServiceCall(req)) return json({ error: 'Forbidden' }, 403);
  const db = serviceClient();
  const now = new Date();

  const due = rows(
    await db
      .from('outgoing_messages')
      .select('*, students(full_name, whatsapp_number, guardian_whatsapp_number), sessions(date, batch_id, batches(name))')
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString())
      .order('scheduled_at')
      .limit(BATCH),
  );

  const summary = { sent: 0, failed: 0, cancelled: 0 };
  for (const m of due) {
    // Re-check right before sending: the student may have been marked present since (N-07).
    if (m.template === 'absent_today') {
      const rec = one(
        await db.from('attendance_records').select('status, source').eq('session_id', m.session_id).eq('student_id', m.student_id).maybeSingle(),
      );
      if (!rec || rec.status !== 'absent' || rec.source !== 'auto') {
        rows(await db.from('outgoing_messages').update({ status: 'cancelled' }).eq('id', m.id));
        summary.cancelled++;
        continue;
      }
    }

    const student = m.students;
    const to = (m.recipient === 'guardian' ? student?.guardian_whatsapp_number : student?.whatsapp_number)?.replace(/[^\d]/g, '');
    if (!to) {
      rows(await db.from('outgoing_messages').update({ status: 'failed', error: 'No WhatsApp number' }).eq('id', m.id));
      summary.failed++;
      continue;
    }

    const batchName = m.sessions?.batches?.name ?? '';
    const template: Template =
      m.template === 'absent_today'
        ? { name: Deno.env.get('WA_TEMPLATE_ABSENT') ?? 'absent_today', params: [student.full_name, batchName, formatDate(m.sessions?.date ?? localDateOf(Date.now()))] }
        : { name: Deno.env.get('WA_TEMPLATE_STREAK') ?? 'absence_streak', params: [student.full_name, batchName] };

    try {
      const { id } = await sendWhatsApp(to, template);
      rows(
        await db
          .from('outgoing_messages')
          .update({ status: 'sent', provider_message_id: id, sent_at: new Date().toISOString(), attempts: m.attempts + 1, error: null })
          .eq('id', m.id),
      );
      summary.sent++;
    } catch (e) {
      const err = e as Error & { permanent?: boolean };
      const attempts = m.attempts + 1;
      const giveUp = err.permanent || attempts >= MAX_ATTEMPTS;
      // Back off 5, 10, 20 minutes between retries.
      const retryAt = new Date(Date.now() + 5 * 60_000 * 2 ** (attempts - 1)).toISOString();
      rows(
        await db
          .from('outgoing_messages')
          .update({ status: giveUp ? 'failed' : 'pending', attempts, error: err.message, scheduled_at: giveUp ? m.scheduled_at : retryAt })
          .eq('id', m.id),
      );
      if (giveUp) {
        summary.failed++;
        await notify(db, { kind: 'message_failed', message: `WhatsApp to ${student.full_name} failed: ${err.message}`, studentId: m.student_id });
      }
    }
  }

  // Streak alerts always reach the owner in the app, even when no one could be messaged (N-20).
  const ownerAlerts = rows(
    await db.from('outgoing_messages').select('id, student_id, students(full_name)').eq('notify_owner', true).in('status', ['sent', 'failed', 'skipped']),
  );
  for (const a of ownerAlerts) {
    await notify(db, { kind: 'absence_streak', message: `${a.students?.full_name ?? 'A student'} has missed several classes in a row.`, studentId: a.student_id });
    rows(await db.from('outgoing_messages').update({ notify_owner: false }).eq('id', a.id));
  }

  return json({ ok: true, ...summary });
});
