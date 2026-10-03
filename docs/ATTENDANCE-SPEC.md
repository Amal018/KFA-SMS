# KFA-SMS: Attendance Management Specification

**Date:** 2026-10-03
**Builds on:** [APP-PLAN.md](APP-PLAN.md) (face + QR + NFC on the owner's phone) and [HANDOFF.md](HANDOFF.md).
**Implementation:** the rules in this document live in `packages/core` (pure TypeScript, shared by the phone app and the server). Every scenario ID below (e.g. `P-07`) has an automated test with the same ID in `packages/core/test/`.

---

## 1. Concepts

| Term | Meaning |
|---|---|
| **Batch** | A recurring class, e.g. "Bharatanatyam Beginners". Has a teacher, fee, schedule and attendance settings |
| **Schedule** | A weekly slot for a batch: weekday + start time + end time, valid between two dates |
| **Session** | One dated occurrence of a batch, e.g. "Bharatanatyam Beginners, Sat 4 Oct 2026, 16:00–17:00". Generated from schedules, or added by hand (extra class) |
| **Enrolment** | A student belonging to a batch from a start date to an optional end date. Kind: `regular` or `trial` |
| **Expected student** | A student who should attend a session (§4) |
| **Punch** | One check-in event from a phone: who (identified by face, QR, NFC or manual), when, how. Never edited or deleted |
| **Attendance record** | The result for one student × one session: `present`, `late`, `absent` or `excused` |
| **Check-in window** | The time range when a punch counts for a session (§5.1) |
| **Finalisation** | The moment, after a session ends, when expected students without a record are marked absent (§7) |

All times are **India Standard Time (IST, UTC+05:30, no daylight saving)**. Dates are local IST dates.

---

## 2. Settings and defaults

Set institute-wide, and can be overridden per batch where marked ●.

| Setting | Default | Meaning |
|---|---|---|
| `openBeforeMin` ● | 30 | Check-in opens this many minutes before the start |
| `lateAfterMin` ● | 10 | Arrival more than this many minutes after the start is `late` |
| `absentIfLaterThanMin` ● | off | If set, arrival more than this many minutes after the start stays `absent` (arrival is still logged) |
| `closeAfterEndMin` ● | 0 | Check-in closes this many minutes after the end |
| `finalizeGraceMin` | 15 | Finalisation runs this many minutes after check-in closes |
| `maxSyncWaitMin` | 1440 (24 h) | If phones haven't synced, finalisation waits up to this long, then finalises with alerts suppressed |
| `multiSessionPolicy` | `all` | When one punch fits several of the student's sessions: `all` marks every one; `nearest` marks only the session whose start is closest to the punch |
| `cardCheckLevel` ● | `card_photo` | `card_only`, `card_photo` (snap a photo on card scans) or `card_face` (card plus 1:1 face check) |
| `faceMatchThreshold` | 0.70 | Minimum similarity for a face match (tuned in the first week) |
| `faceMargin` | 0.08 | Best match must beat the second-best student by at least this much |
| `faceRetryBand` | 0.10 | Scores this far below the threshold ask the student to retry instead of rejecting |
| `livenessRequired` | true | Face check-ins need a blink or head turn |
| `futureSkewMin` | 10 | Punches timestamped more than this far in the future are rejected as clock errors |
| `stalePunchDays` | 7 | Punches arriving more than this many days late go to review instead of auto-applying |
| `absenceAlerts` ● | on | Send "absent today" WhatsApp messages |
| `streakThreshold` | 3 | Consecutive absences that trigger a streak alert |
| `quietStart` / `quietEnd` | 20:00 / 09:00 | No messages sent in this window. Queued until `quietEnd` |

---

## 3. Sessions and calendar

| ID | Scenario | Expected behaviour |
|---|---|---|
| S-01 | Batch has a weekly schedule (e.g. Sat 16:00–17:00) | One session is generated for every Saturday between the schedule's valid dates |
| S-02 | Batch meets on several days (Tue + Thu) | One session per scheduled day |
| S-03 | Schedule changes from a date (Sat → Sun from 1 Nov) | Old schedule gets `validTo` 31 Oct, new one `validFrom` 1 Nov. Sessions follow whichever is valid on that date. Past sessions are never changed |
| S-04 | Institute-wide holiday | Sessions that day are created with status `holiday`. Nobody is expected, no absences, no alerts |
| S-05 | Holiday for some batches only | Only those batches' sessions become `holiday` |
| S-06 | Class cancelled (teacher ill) | Staff cancel the session (status `cancelled`, with a reason). Nobody expected, no absences, no alerts. Punches that day are logged as `outside_window` |
| S-07 | Extra or make-up class | Staff add a one-off session (`kind = extra`). Enrolled students are expected. Absence alerts follow the session's `absenceAlerts` flag (default off for extras) |
| S-08 | Exam or performance day | Session `kind = event` with `countsForPercent = false`: attendance is recorded but excluded from attendance % |
| S-09 | Generation re-run (idempotency) | Running generation twice for the same range creates no duplicates. Session identity is batch + date + start time |
| S-10 | Class rescheduled to another time the same day | Cancel the original and add an extra session at the new time |
| S-11 | Two schedules for the same batch overlap on a day | Both sessions are generated. Punches follow `multiSessionPolicy` |

---

## 4. Who is expected at a session

A student is **expected** at a session only if **all** of these hold:

1. The session status is `scheduled` (not `holiday` or `cancelled`).
2. The student has an enrolment in that batch whose start date ≤ session date and whose end date is empty or ≥ session date, with status `active`.
3. The student's status is `active` or `trial` on that date, and they aren't inside a pause period.

| ID | Scenario | Expected behaviour |
|---|---|---|
| E-01 | Active student, active enrolment | Expected |
| E-02 | Student joins mid-month (enrolment starts the 15th) | Not expected before the 15th: no absences before joining |
| E-03 | Enrolment ended (moved batch on the 10th) | Expected in the old batch up to the 10th, then in the new batch from its start date |
| E-04 | Student paused for a date range | Not expected during the pause. Punches during the pause are logged as `inactive_student` |
| E-05 | Student left | Not expected from the leaving date. All their credentials are revoked |
| E-06 | Trial student (trial enrolment) | Expected. Attendance is recorded, but absence alerts are not sent for trial enrolments |
| E-07 | Student in two batches the same day | Expected at both, with separate records |

---

## 5. Check-in methods

### 5.1 Check-in window

For a session with start `S` and end `E`, a punch at time `t` counts if:

```
S − openBeforeMin  ≤  t  ≤  E + closeAfterEndMin
```

Status from the punch time:

| Condition | Status |
|---|---|
| `t ≤ S + lateAfterMin` | `present` |
| `t > S + lateAfterMin` and (`absentIfLaterThanMin` off or `t ≤ S + absentIfLaterThanMin`) | `late` |
| `absentIfLaterThanMin` set and `t > S + absentIfLaterThanMin` | stays `absent`. Punch logged as `arrived_too_late` |

`late` counts as attended in attendance %, and is shown separately in reports.

### 5.2 Face recognition

| ID | Scenario | Expected behaviour |
|---|---|---|
| M-01 | Clear match: best score ≥ threshold, ahead of second-best by ≥ margin | Identified as that student |
| M-02 | Best score ≥ threshold but too close to another student (< margin) | `face_retry`: "Please try again or scan your card". Never guesses between two students |
| M-03 | Best score just below threshold (within the retry band) | `face_retry` |
| M-04 | Score well below threshold | `face_no_match`: "Not recognised" |
| M-05 | No students have face profiles | `face_no_match` |
| M-06 | Liveness check fails (photo or screen held up, no blink) | `liveness_failed`. Not marked |
| M-07 | Student has several face profiles (with/without glasses) | The best score across all of that student's profiles is used |
| M-08 | Face profile belongs to an inactive (deactivated) profile | Ignored in matching |

### 5.3 QR cards

QR payload: `KFA1.<studentId>.<cardVersion>.<signature>`, where the signature is HMAC-SHA256 over `KFA1.<studentId>.<cardVersion>` with the institute's secret key (base64url, truncated to 16 bytes).

| ID | Scenario | Expected behaviour |
|---|---|---|
| M-10 | Valid card | Identified as that student |
| M-11 | Forged or altered QR (bad signature) | `invalid_credential`. Not marked, logged for review |
| M-12 | Old card after reissue (version lower than current) | `revoked_credential` |
| M-13 | Card explicitly revoked (lost) | `revoked_credential` |
| M-14 | Not a KFA QR at all (random QR) | `invalid_credential` |

### 5.4 NFC stickers

The sticker's UID is linked to the student. The sticker also stores the same signed payload as a QR card.

| ID | Scenario | Expected behaviour |
|---|---|---|
| M-20 | Linked sticker | Identified as that student |
| M-21 | Unknown sticker (not linked) | `unknown_credential`. The app offers "Link to a student" (staff only) |
| M-22 | Revoked sticker | `revoked_credential` |
| M-23 | Sticker UID linked, but the stored signed payload belongs to a different student (copied data) | `invalid_credential` |

### 5.5 Card check levels (stopping proxies)

| ID | Scenario | Expected behaviour |
|---|---|---|
| M-30 | `card_only` | Card identification is enough |
| M-31 | `card_photo` | Marked, and the punch must carry a verification photo. A card punch without a photo is still marked but flagged `missing_photo` for review |
| M-32 | `card_face`, face matches the card's student (1:1 score ≥ threshold) | Marked |
| M-33 | `card_face`, face doesn't match | `face_verify_failed`. Not marked, flagged for review |
| M-34 | `card_face`, but the student has no face profile | Marked, flagged `no_face_profile` so staff can register one |

### 5.6 Manual

| ID | Scenario | Expected behaviour |
|---|---|---|
| M-40 | Staff mark a student present/late/absent/excused | Record set with `source = manual`, `locked = true`. Reason required. Audited |
| M-41 | Manual change without a reason | Rejected |
| M-42 | Teacher marks a student in a batch they don't teach | Rejected (permission) |

---

## 6. Punch resolution

After identification, a punch for student `X` at time `t` is resolved against `X`'s sessions that day.

| ID | Scenario | Expected behaviour |
|---|---|---|
| P-01 | On time, one session | `present` |
| P-02 | Early, within `openBeforeMin` | `present` |
| P-03 | Too early (before the window opens) | `outside_window` |
| P-04 | After `lateAfterMin` | `late` |
| P-05 | After `absentIfLaterThanMin` (when set) | `arrived_too_late`. Record stays/becomes `absent` |
| P-06 | After the window closes | `outside_window` |
| P-07 | Second scan for the same session | `duplicate`. The first scan stands (a later scan never turns `present` into `late`) |
| P-08 | Scan after the session was finalised as absent (late sync or very late arrival within window) | Record upgraded to `present`/`late`. Any unsent absence alert is cancelled. If the alert was already sent, the owner is notified "absence alert sent in error" |
| P-09 | Student on leave shows up anyway | Record upgraded from `excused` to `present`/`late` |
| P-10 | Record has a manual override | Punch is logged as `manual_locked`. The manual decision stands |
| P-11 | Student has no session today | `outside_window` (reason `no_session_today`) |
| P-12 | Student has a session today, but at a different time | `outside_window` (reason `not_in_window`) |
| P-13 | One punch fits two back-to-back sessions, policy `all` | Both marked |
| P-14 | Same, policy `nearest` | Only the session whose start is closest to the punch is marked |
| P-15 | Student paused or left | `inactive_student`. Not marked |
| P-16 | Punch timestamped more than `futureSkewMin` in the future | `clock_skew`. Not marked, phone flagged for a clock check |
| P-17 | Punch arrives more than `stalePunchDays` after it happened | `needs_review`. Staff approve or reject it |
| P-18 | Same punch uploaded twice (retry after a network drop) | Ignored the second time (same `clientPunchId`) |
| P-19 | Session is a holiday or cancelled | Not matched to it. Falls through to `outside_window` |
| P-20 | Scan at a session of a batch the student isn't enrolled in | `outside_window`. Staff may record it manually as a guest |

---

## 7. Finalisation (auto-absent)

Finalisation for a session runs at `E + closeAfterEndMin + finalizeGraceMin` (the scheduler checks every 5 minutes).

| ID | Scenario | Expected behaviour |
|---|---|---|
| F-01 | Before the finalisation time | Nothing happens (`not_due`) |
| F-02 | All phones synced after check-in closed | Every expected student without a record is marked `absent` (`source = auto`). Session state becomes `finalized` |
| F-03 | Expected student is on approved leave | Marked `excused`, not absent |
| F-04 | A phone hasn't synced since before check-in closed | State `awaiting_sync`: no absences yet. The owner sees "Phone X not synced" |
| F-05 | Still not synced after `maxSyncWaitMin` | Finalised anyway, with **alerts suppressed** for this session. Owner notified |
| F-06 | Holiday or cancelled session | Nothing to finalise |
| F-07 | Finalisation runs twice | No duplicate records. Existing records are never overwritten |
| F-08 | A student who already has a record (present, late, manual) | Untouched |
| F-09 | A phone that's been revoked or inactive for 7+ days | Ignored for the sync check, so a lost phone can't block finalisation forever |

---

## 8. Leave and manual overrides

| ID | Scenario | Expected behaviour |
|---|---|---|
| L-01 | Leave for a date range, all batches | Sessions in range are finalised as `excused` |
| L-02 | Leave for one batch only | Only that batch's sessions are excused |
| L-03 | Leave entered after the session was finalised absent | Staff apply it: record changes `absent → excused` (`source = manual`, reason "leave"). If the absence alert hasn't gone yet, it's cancelled |
| L-04 | Leave cancelled before the date | No effect on records |
| L-05 | Manual override changes `present → absent` (e.g. the student left early) | Allowed with a reason. Locked against later punches |
| L-06 | Undo a manual override | Lock removed. The record reverts to what the punches say, or `absent` if there are none and the session is finalised |

---

## 9. Absence and streak alerts

### 9.1 "Absent today" alert

Sent for a record only if **all** of these hold:

1. The record is `absent` with `source = auto` (manual absences send no automatic alert, but staff can send one by hand).
2. The session was finalised with alerts allowed (not `F-05`), and the session/batch has `absenceAlerts` on.
3. The enrolment is not `trial`.
4. The recipient has WhatsApp opt-in (the guardian for under-18s, otherwise the student).
5. No alert has been sent with the same idempotency key `absent:<sessionId>:<studentId>`.

| ID | Scenario | Expected behaviour |
|---|---|---|
| N-01 | Normal absence | One alert, to the guardian if under 18, else the student |
| N-02 | Finalised at 21:00 (inside quiet hours) | Alert scheduled for 09:00 next morning |
| N-03 | No WhatsApp opt-in | Not sent. Listed under "can't message" |
| N-04 | Trial enrolment | Not sent |
| N-05 | Absence alerts off for the batch or session | Not sent |
| N-06 | Alerts suppressed (late finalisation, F-05) | Not sent |
| N-07 | Student turned up late and the record was upgraded before sending | Alert cancelled |
| N-08 | Job runs twice | Sent once (idempotency key) |
| N-09 | Excused (leave) | Not sent |

### 9.2 Absence streak alert

Consecutive absences are counted per enrolment, in session order, counting only sessions that count for attendance. `excused`, `holiday`, `cancelled` and `event` sessions are skipped (they neither count nor break a streak). A `present` or `late` resets it.

| ID | Scenario | Expected behaviour |
|---|---|---|
| N-20 | Third absence in a row (threshold 3) | One streak alert (key `streak:<enrolmentId>:<firstAbsentSessionId>`), to the recipient and the owner |
| N-21 | Fourth and fifth absences in the same streak | No new alert (same streak) |
| N-22 | Absent, absent, holiday, absent | Streak of 3: alert |
| N-23 | Absent, absent, excused, absent | Streak of 3: alert |
| N-24 | Absent, absent, present, absent | Streak of 1: no alert |
| N-25 | Streak ends, then a new streak reaches 3 | New alert (different first session) |

---

## 10. Reports

| ID | Scenario | Expected behaviour |
|---|---|---|
| R-01 | Attendance % | `(present + late) ÷ (present + late + absent)` over sessions that count. `excused`, events and holidays excluded |
| R-02 | No countable sessions yet | Shown as "–" (not 0% or 100%) |
| R-03 | Daily register | Per session: each expected student's status, method icon (face/QR/NFC/manual) and time |
| R-04 | Monthly summary | Per student and batch: present, late, absent, excused, % |
| R-05 | Chronic absentees | Students below a set % (default 75%) in the last 30 days |
| R-06 | Exports | Excel and PDF of R-03 to R-05 |

---

## 11. Devices, offline and sync

| ID | Scenario | Expected behaviour |
|---|---|---|
| D-01 | No internet during class | Identification and punch rules run on the phone (same `packages/core` code), giving instant on-screen results. Punches are queued and uploaded later |
| D-02 | Upload after reconnecting | The server re-runs the rules as the source of truth. Results normally match. If not (e.g. a record changed on the server meanwhile), the server wins |
| D-03 | Phone clock wrong | Phone time is compared with server time on every sync. A difference over 2 minutes is shown as a warning. Over `futureSkewMin` → P-16 |
| D-04 | Two phones taking attendance | Both register as devices. Both must sync before finalisation (F-04). Duplicates across phones → P-07 |
| D-05 | Phone lost | Revoke it from another login. Revoked devices are ignored for sync (F-09), and their sessions are signed out |
| D-06 | App killed or battery dead mid-class | Punches are written to local storage before the result shows, so nothing is lost. They sync on restart |

---

## 12. Security and audit

| ID | Scenario | Expected behaviour |
|---|---|---|
| X-01 | Someone prints a QR with another student's ID | Rejected: signature check (M-11) |
| X-02 | A friend scans another student's card | Deterred by `card_photo`, and blocked by `card_face` (M-31 to M-33) |
| X-03 | Photo or video of a student held to the camera | Blocked by liveness (M-06) |
| X-04 | Signing secret rotated | All cards invalid; reprint. Card versions are untouched |
| X-05 | Every manual change, approval of a review punch, leave and revocation | Written to the audit log: who, when, before, after, reason |
| X-06 | Face data | Only embeddings are used for matching, encrypted at rest. Deleted when a student leaves or withdraws consent |

---

## 13. Outcome codes (reference)

| Code | Marked? | Shown to the student | Goes to staff review |
|---|---|---|---|
| `marked` | Yes | "✓ Name: Present/Late" | No |
| `duplicate` | No (already marked) | "✓ Already marked" | No |
| `arrived_too_late` | No | "Too late for this class" | No |
| `outside_window` | No | "No class right now" | Yes (can mark as guest) |
| `inactive_student` | No | "See the office" | Yes |
| `manual_locked` | No | "See the office" | No |
| `face_retry` | No | "Try again or scan your card" | No |
| `face_no_match` | No | "Not recognised" | No |
| `liveness_failed` | No | "Please blink" | No |
| `face_verify_failed` | No | "See the office" | Yes |
| `invalid_credential` | No | "Card not valid" | Yes |
| `revoked_credential` | No | "Card not valid, see the office" | Yes |
| `unknown_credential` | No | "Sticker not linked" | No |
| `clock_skew` | No | "Phone time is wrong" | Yes |
| `needs_review` | Pending | — | Yes |
