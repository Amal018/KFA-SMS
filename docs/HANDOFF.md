# KFA Students Management System: Analysis & Handoff

**Status:** Requirements analysis. No code written yet.
**Audience:** The developer(s) who will build this, and the institute owner, who has to answer the open questions in §12.
**Date:** 2026-10-03

---

## 1. What the owner asked for

> An application for managing students in my arts institute. Add students and store them with their fingerprint. When a student puts their finger on the scanner, their attendance is marked present; otherwise they are marked absent. Send WhatsApp reminders to students who haven't paid fees or were absent.

That gives four core capabilities:

| # | Capability | Summary |
|---|---|---|
| C1 | Student management | Add, edit, pause or remove students, their guardians and their class enrolments |
| C2 | Fingerprint enrolment | Capture and store each student's fingerprint, linked to their record |
| C3 | Biometric attendance | A scan marks the student present. Anyone enrolled in a session who didn't scan is marked absent automatically |
| C4 | WhatsApp reminders | Automatic messages for unpaid fees and for absences |

To make "absent" and "hasn't paid" mean something, the system also needs two supporting pieces:

- **Batches and schedules.** Without them, "absent" is undefined: absent *from what*, *when*?
- **Fees and payments.** Without them, there's nothing to compare "hasn't paid" against.

---

## 2. Key decisions and recommendations

### 2.1 Fingerprint hardware: the most important decision

Browsers can't read USB fingerprint scanners. WebAuthn and Windows Hello don't work here either, because they verify *the device owner*; they can't tell *which of 300 students* touched the sensor. So the hardware choice decides the architecture.

| Option | How it works | Cost (approx., India) | Pros | Cons |
|---|---|---|---|---|
| **A. Standalone attendance terminal (recommended)**, e.g. ZKTeco / eSSL models with **ADMS / push** support (K40 Pro, MB20, X990 or similar) | The device stores fingerprints and does the matching itself. Every punch is pushed over Wi-Fi/LAN to our server's HTTP endpoint (ADMS protocol), or pulled over TCP port 4370 by a small bridge program | ₹4,000–₹10,000 | Matching is solved and fast. Works offline: punches queue on the device and sync later. Has its own screen and beep, so no PC is needed at the door. Proven in Indian schools and offices | Enrolment happens on the device or via its protocol, not in our UI. We must map device user IDs to students. Must buy a model that supports push/ADMS |
| **B. USB scanner + Windows desktop app**, e.g. Mantra MFS110 or SecuGen Hamster Pro 20 | A PC app built on the vendor SDK captures templates and runs 1:N matching against every enrolled student | ₹2,500–₹4,000 per scanner | Enrolment and attendance all happen inside our app, which matches the owner's description of opening the app and scanning | We build and maintain the 1:N matching loop and a Windows desktop app (or a local bridge service). Needs a PC that's on all day at the entrance. Works only while that PC is running |

#### Update 2026-10-03: the owner wants to run attendance from their mobile phone

**The phone's built-in fingerprint sensor can't do this.** Android (`BiometricPrompt`) and iOS (Touch ID / Face ID) never give an app the fingerprint or say *whose* finger it was. They only answer "one of the fingers enrolled on this phone matched: yes or no". The phone also holds only about 5 fingers, all treated as the phone owner. An app can't tell students apart this way, and no app can work around it.

The workable way to keep "phone + fingerprint" is an external scanner plugged into the phone:

| Option | How it works | Cost (approx., India) | Pros | Cons |
|---|---|---|---|---|
| **C. Android phone + USB-OTG fingerprint scanner (now recommended)**, e.g. Mantra MFS110 L1 or SecuGen Hamster Pro 20 (both have Android SDKs) | A native Android app talks to the scanner via its SDK. It captures templates at enrolment and does 1:N matching on each scan against the students stored on the phone, then syncs the result to the server | ₹2,500–₹4,000 per scanner, plus an OTG adapter if needed | Everything happens in one app on the owner's phone. No PC needed. Works offline: attendance queues on the phone and syncs later | **Android only:** iPhones can't use these scanners. Needs a native app (Kotlin, or Flutter/React Native with a native module), not a website. We build the 1:N matching loop (fine for a few hundred students). The scanner must be plugged in during attendance. Templates live on the phone, so they must be encrypted and backed up |

Options A and B remain fallbacks: A if a second phone or staff member needs to take attendance, B if a PC is preferred.

> ⚠️ **Before buying a scanner,** confirm the exact model's **Android SDK supports template extraction and matching** (not only the Aadhaar "RD Service" mode, which is for UIDAI authentication and can't be used for our own matching). Test it with the owner's actual phone over OTG.

**Recommendation:** Option C: an Android app for enrolment, attendance and day-to-day use, with the same server (§2.3) for data, scheduled jobs and WhatsApp. The flow stays exactly as the owner described: open the app, the student puts their finger on the scanner, and they're marked present.

> ⚠️ **If using Option A,** confirm the exact model supports **ADMS / cloud push** (or the TCP SDK), and that its capacity (fingerprints, logs) covers the expected number of students plus 50% growth.

Whichever option is chosen, everything below still applies. Only the "punch ingestion" component (§5.3) changes. With Option C, the phone app creates the Punch records itself.

### 2.2 WhatsApp: use the official API only

| Option | Verdict |
|---|---|
| **WhatsApp Business Platform (Cloud API)** directly from Meta | ✅ Official. Needs a Meta Business account, a dedicated phone number not used in the WhatsApp app, and **pre-approved message templates** |
| **An Indian BSP** (Interakt, AiSensy, WATI, Gupshup, etc.) on top of the Cloud API | ✅ **Recommended for this owner.** Simpler onboarding, a dashboard, and help with template approval. Small monthly fee on top of Meta charges |
| Unofficial "WhatsApp Web" automation libraries | ❌ **Do not use.** Breaks WhatsApp's terms, and the number gets banned, typically right after sending bulk reminders |

Constraints the developer must design for:

- **Business-initiated messages must use an approved template.** Free text is only allowed within 24 hours of the recipient messaging us.
- Fee and absence reminders fall under the **Utility** template category. Keep the wording factual with no promotions, or Meta may reclassify them as Marketing, which costs more and can be blocked.
- **Opt-in is mandatory.** Collect and store consent (who, when, how) at admission.
- **Every message costs money.** Meta charges per message. Check the current rate card at build time and show the owner an estimated monthly cost.
- Support **Tamil and English** templates (see open question Q9).

### 2.3 Platform and stack (suggested)

- **Android app (Option C):** the owner's main tool. Students, enrolment with the fingerprint scanner, attendance scanning, fees and reminders. Built in Kotlin, or Flutter with a native plugin wrapping the scanner SDK. Keeps a local encrypted database (students plus templates) so scanning works offline, and syncs punches and changes to the server.
- **Server and web admin:** Next.js with TypeScript (the stack already used for ADS-photography) serving the app's API, plus an optional browser admin for reports and exports.
- **Database:** PostgreSQL, hosted (e.g. Supabase or Neon), with daily automated backups.
- **Scheduled jobs:** absence marking, fee reminders and absence reminders, run on the server by a cron (platform cron or `pg_cron`), never on the phone, so reminders still go out if the phone is off.
- **Device integration:** Option C: punches come from the Android app through the API. Option A: an ADMS push endpoint (`/iclock/cdata` style) on the server.
- **Template backup (Option C):** encrypted fingerprint templates are backed up to the server (encrypted at rest, never readable in the web admin) so a lost or replaced phone doesn't mean re-enrolling every student.
- **Auth:** email or phone plus password for staff, with roles (§9).
- **Timezone:** everything stored in UTC and displayed in **Asia/Kolkata (IST)**.

---

## 3. Domain model

```
Guardian 1─* Student *─* Batch   (via Enrolment)
Batch 1─* Schedule (weekday + start/end time)
Schedule ──generates──> Session (a dated class occurrence)
Student 1─* BiometricIdentity (device user id / template ref)
Punch (raw scan event) ──resolves to──> AttendanceRecord (Student × Session)
Enrolment 1─* FeeDue ──paid by──> Payment (*─* via allocation)
MessageTemplate 1─* MessageLog
Holiday, User (staff), AuditLog, Settings
```

### Core entities and fields

| Entity | Key fields |
|---|---|
| **Student** | id, admission_no (unique), full_name, photo, date_of_birth, gender, phone, whatsapp_number, whatsapp_opt_in (+ timestamp, source), address, joined_on, status (`active`, `paused`, `left`), notes |
| **Guardian** | id, name, relation, phone, whatsapp_number, whatsapp_opt_in. Required if the student is under 18 |
| **Batch** | id, name (e.g. "Bharatanatyam – Beginners – Sat 4pm"), course/art form, teacher, capacity, monthly_fee, active |
| **Schedule** | batch_id, weekday, start_time, end_time, valid_from, valid_to |
| **Session** | batch_id, date, start_at, end_at, status (`scheduled`, `cancelled`, `holiday`, `extra`) |
| **Enrolment** | student_id, batch_id, start_date, end_date, fee_override, discount, status |
| **BiometricIdentity** | student_id, device_user_id (Option A) *or* encrypted template (Option B), finger_index, enrolled_at, enrolled_by, active |
| **Punch** | id, device_serial, device_user_id, punched_at (device time), received_at, raw payload, resolved_student_id, processing_status (`matched`, `unknown_user`, `duplicate`, `outside_window`) |
| **AttendanceRecord** | student_id, session_id, status (`present`, `late`, `absent`, `excused`/`leave`, `holiday`), source (`biometric`, `manual`, `auto_absent`), punch_id, marked_by, reason |
| **FeeDue** | enrolment_id, period (e.g. 2026-10), amount, due_date, status (`due`, `partially_paid`, `paid`, `waived`) |
| **Payment** | student_id, amount, paid_on, mode (`cash`, `UPI`, `bank`, `card`), reference, received_by, receipt_no |
| **MessageTemplate** | key (`fee_due`, `fee_overdue`, `absent_today`, `absent_streak`), language, provider_template_name, approval_status |
| **MessageLog** | recipient, student_id, template, variables, idempotency_key, provider_message_id, status (`queued`, `sent`, `delivered`, `read`, `failed`), error, cost |
| **AuditLog** | who, what, when, before/after. Required for manual attendance edits, fee waivers and deletions |

---

## 4. Feature specification

### C1. Student management
- Create, edit, view and search students (by name, admission no, phone, batch).
- Enrol a student in one or more batches with start dates. Move between batches. End an enrolment.
- Status changes: **Active → Paused** (e.g. exams or travel: no fees, no absences, no reminders) **→ Active**, and **→ Left** (archived, never hard-deleted).
- Guardian details and consent capture at admission (WhatsApp opt-in plus biometric consent, §8).
- Bulk import from an Excel/CSV template for existing students.
- Student profile page: details, batches, attendance history and %, fee ledger, message history.

### C2. Fingerprint enrolment
- Option A: create the student in the app, which assigns a `device_user_id` and pushes it to the device. Staff then enrol the finger on the device. The app shows the enrolment status per student.
- Option B: an "Enrol fingerprint" button in the app captures **3 samples**, checks quality, and stores an encrypted template.
- Enrol **at least 2 fingers** per student (backup for cuts, bandages, paint or henna on the hand).
- Re-enrol and remove fingerprint actions (audited).
- **A non-biometric fallback is mandatory** (§6.2): manual marking by staff, and optionally a PIN or card on the device.

### C3. Attendance
- Every scan creates a **Punch** (raw event, never edited or deleted).
- The punch-resolution rule is in §5.
- **Auto-absent job:** at `session.end_at + grace` (default 15 minutes), every student actively enrolled in that session with no record is marked `absent` with source `auto_absent`.
- **Manual override** by staff: present, absent or excused, with a required reason. Audited.
- **Leave:** staff can record leave in advance for a date range. Those sessions are marked `excused`, not absent, and no absence reminder is sent.
- **Live "Today" screen:** each session today showing present / not yet arrived / absent, updating as punches arrive.
- **Reports:** daily register, monthly attendance % per student and batch, chronic absentees, export to Excel/PDF.

### C4. Fees
- Fee due generation: on the 1st of each month (configurable), create a FeeDue for each active enrolment (amount = batch fee − discount, or fee_override).
- One-time fees: admission fee, costume or materials fees, exam fees.
- Record payments (full, partial or advance), allocated oldest-due-first. Generate a receipt number (and optionally a PDF or WhatsApp receipt).
- Waive or discount with a reason (owner role only, audited).
- **Reports:** collection by month, outstanding dues (defaulter list), payment-mode breakdown.

### C5. WhatsApp reminders
| Trigger | Default rule | Recipient |
|---|---|---|
| Fee due soon (optional) | 3 days before due_date | Guardian if under 18, else student |
| Fee overdue | due_date + grace (default 5 days), then every 7 days, **max 3 reminders per due** | Same |
| Absent today | Once per absent session, sent after the auto-absent job, not before 9am or after 8pm IST | Same |
| Absence streak | N consecutive absences in a batch (default 3). One message per streak | Same, plus an owner alert |
| Payment received (optional) | When a payment is recorded | Same |

- All rules are configurable in Settings, with a global **"pause all messaging"** switch.
- Every send is **idempotent**, keyed on `(template, student, due_or_session_id, attempt_no)`, so retries and cron re-runs never double-send.
- Quiet hours: queue messages generated outside 9:00–20:00 IST until 9:00.
- Owner-facing log of every message with its delivery status. Manual "send reminder now" button.

---

## 5. Attendance rules: precise definitions

### 5.1 Session window
- A punch counts for a session if it falls in **[start_at − 30 min, end_at]** (both configurable per batch).
- **Late:** a punch after `start_at + late_threshold` (default 10 minutes) is marked `late` (counts as present for %, shown separately). Whether to track "late" at all is open question Q6.

### 5.2 Resolving a punch
1. Look up the student by `device_user_id`. Not found → `unknown_user`, shown on the admin "needs attention" list.
2. Student not `active` → record the punch, don't mark attendance, and flag it.
3. Find today's sessions for the student's active enrolments whose window contains the punch time.
   - **None** → `outside_window` (e.g. came on the wrong day). Keep it and show it; staff may manually assign it.
   - **One** → mark `present` or `late`.
   - **Several** (overlapping or back-to-back batches) → mark **every** matching session present. Back-to-back classes may need a second scan (open question Q7).
4. Repeat scan for a session that's already present → `duplicate`, ignored (the first scan wins).
5. A punch for a session already auto-marked `absent` (late sync or a very late arrival) → upgrade to `present`/`late` if it falls within the window, and cancel any unsent absence message.

### 5.3 Ingestion reliability
- The device clock can drift. The bridge or endpoint syncs device time daily and logs the drift. Reject or flag punches more than 10 minutes in the future.
- **Offline device or internet:** punches queue on the device and arrive later. Because of this, the absence *message* job must wait until the punches for that session have synced. If the device (or, with Option C, the attendance phone) hasn't checked in since before session end, **hold absence messages** and alert the owner instead.
- Ingestion is idempotent on `(device_serial, device_user_id, punched_at)`.

---

## 6. Edge cases (the "all cases" list)

### 6.1 Students and enrolment
| Case | Expected behaviour |
|---|---|
| Duplicate student (same name and phone) | Warn on create and allow a merge |
| Student joins mid-month | Fee pro-rating is configurable (Q3). No absences before the enrolment start date |
| Student in multiple batches | Fees and attendance tracked per enrolment |
| Student switches batch mid-month | End the old enrolment and start the new one. History is kept |
| Student paused | No sessions expected, no fees generated, no reminders |
| Student leaves | Status `left`, fingerprint deactivated on the device, outstanding dues still visible, reminders stop (or a final dues reminder, per Q4) |
| Student rejoins | Reactivate the same record, keeping history |
| Siblings with the same guardian | One guardian linked to many students. Messages per student, or batched (Q10) |
| Minor student | Guardian required, messages go to the guardian, guardian consent required (§8) |
| Wrong phone number entered | Delivery fails, the student is flagged "invalid WhatsApp number" in the UI |

### 6.2 Fingerprint and biometrics
| Case | Expected behaviour |
|---|---|
| Finger not recognised (cut, wet, paint, henna, worn prints, small children) | Retry with the backup finger. Otherwise staff mark manually from the app (audited, source `manual`) |
| Student can't enrol at all (very young, disability, poor-quality prints) | Allowed. Flagged "no biometric": manual or PIN attendance only |
| Student refuses biometric consent | Same as above. Biometrics must not be mandatory |
| Proxy attendance (friend scans someone else's finger) | Not possible with fingerprints, but possible with PIN or manual. Those are audited and shown with a different icon |
| False match (device matches the wrong student) | Rare. Staff can reassign a punch to the correct student (audited) |
| Device replaced or reset | Re-sync users and templates from the backup (Option A: back up templates via the SDK if the device allows) or re-enrol |
| Second device / second branch | Each device registered with a serial number and location. Users synced to all relevant devices |

### 6.3 Sessions and calendar
| Case | Expected behaviour |
|---|---|
| Public holiday or institute closed | Holiday calendar: sessions marked `holiday`, no absences, no reminders |
| Class cancelled (teacher unavailable) | Cancel the session: no absences. Optionally notify students (Q11) |
| Extra or make-up class | Create a one-off session. Attendance is tracked, but absence there may not trigger a reminder (configurable) |
| Schedule change (batch moves from Sat to Sun) | New schedule `valid_from`. Past sessions unchanged |
| Exam or performance day | A session type that may not count towards attendance % |

### 6.4 Fees
| Case | Expected behaviour |
|---|---|
| Partial payment | FeeDue becomes `partially_paid`. The reminder shows the remaining amount |
| Advance payment (e.g. 3 months) | Credit balance, auto-applied to future dues. No reminders while covered |
| Paid in cash and not yet entered | Staff enter it before the reminder runs. Reminders run once a day at a fixed time (e.g. 10:00) to give a window |
| Payment recorded after a reminder was queued | The job re-checks status just before sending and skips if paid |
| Fee changed for a batch | Applies to future dues only |
| Discount, scholarship, sibling discount | Per-enrolment discount or override. Waivers are owner-only |
| Refund | Negative payment entry with a reason (owner only) |
| Wrong payment entry | Reverse it (never delete) and re-enter. Audited |
| Student absent all month | Fee still due unless paused (policy, Q5) |

### 6.5 WhatsApp messaging
| Case | Expected behaviour |
|---|---|
| No opt-in recorded | Never send. Shown on the "can't message" list |
| Recipient replies STOP / opts out | Mark opt-out and stop all non-essential messages. The owner sees it |
| Number not on WhatsApp / invalid | Mark failed, flag the student, don't retry |
| Provider error or rate limit | Retry with backoff (3 attempts), then mark failed and show it |
| Template rejected or paused by Meta | Disable that reminder type and alert the owner |
| Recipient replies to a reminder | Show the reply in the message log (or forward to the owner's number). Optional, see Q12 |
| Same guardian, 3 children absent | One message per child, or a combined message (Q10) |
| Cron runs twice or the server restarts mid-job | Idempotency keys prevent duplicate sends |
| Message cost budget exceeded | Optional monthly cap, with an alert when reached |

### 6.6 System and operations
| Case | Expected behaviour |
|---|---|
| Internet down at the institute | Device stores punches. Web app unavailable until it's back. Absence messages held (§5.3) |
| Power cut | Device keeps punches in memory. Recommend a small UPS |
| Server or database outage | Device retries its push. Bridge buffers locally |
| Staff member leaves | Deactivate their user account. Their audit history is kept |
| Data loss | Daily DB backups with 30-day retention. Restore tested once before go-live |
| Phone lost, stolen or replaced (Option C) | Install the app on the new phone, log in, and restore encrypted templates from the server. Revoke the old phone's session from the web admin |
| Scanner unplugged or not detected (Option C) | App shows a clear "connect scanner" banner. Manual marking is still available |
| Phone battery dies or app closed during class (Option C) | Scans already taken are stored locally and sync when reopened. Absence messages are held until the phone syncs (§5.3) |
| Phone has no internet during class (Option C) | Scanning works offline. Results sync when the connection returns |

---

## 7. Screens (MVP)

1. **Login**
2. **Dashboard:** today's sessions with present/absent counts, fees outstanding this month, failed messages, "needs attention" (unknown punches, missing fingerprints, invalid numbers)
3. **Students:** list with filters, plus add/edit form (details, guardian, consents, enrolments)
4. **Student profile:** tabs for Overview / Attendance / Fees / Messages
5. **Batches & schedules**
6. **Attendance:** today (live), register by batch and date (with manual edit), leave entry
7. **Fees:** dues list, record payment, receipts, defaulters
8. **Messages:** log, templates and their status, "send now"
9. **Reports:** attendance %, collections, exports
10. **Settings:** institute details, holidays, reminder rules, quiet hours, devices, staff users

---

## 8. Privacy, consent and legal (India)

- Fingerprints are **personal data**, and in practice the most sensitive data the system holds. The Digital Personal Data Protection Act, 2023 (and its Rules) apply: **clear purpose, informed consent, a way to withdraw it, and deletion when no longer needed.**
- **Children (under 18): verifiable consent from a parent or guardian is required.** Capture it at admission (a signed form, plus a checkbox with a timestamp in the app).
- **Store templates, never fingerprint images.** With Option A, templates stay on the device. With Option B, templates are encrypted at rest and never exported.
- **Delete biometric data** when a student leaves or withdraws consent (both device and database). Log the deletion.
- Biometric attendance must be **optional**: offer the manual/PIN alternative (§6.2).
- WhatsApp opt-in recorded per number (§2.2).
- Role-based access: teachers can't see fees or phone numbers unless allowed.
- Have the owner review the consent form wording with a local advisor. This document is not legal advice.

---

## 9. Roles

| Role | Can do |
|---|---|
| **Owner/Admin** | Everything, including settings, waivers, refunds, deletions, staff management and message configuration |
| **Office staff** | Students, enrolments, payments, manual attendance, sending reminders. No waivers, refunds or settings |
| **Teacher** (optional) | View and mark attendance for their own batches only |

---

## 10. Delivery plan

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Decisions** | Owner answers §12. Hardware bought. WhatsApp BSP account created and templates submitted (approval can take days, so **start early**) | Device on the network. Templates approved |
| **1. Core data** | Auth, roles, students, guardians, batches, schedules, enrolments, sessions, holidays, CSV import | Owner can load all real students and batches |
| **2. Attendance** | Device integration, punch resolution, auto-absent, manual override, leave, Today screen, register | One week of real attendance matches a paper register |
| **3. Fees** | Dues generation, payments, receipts, defaulters | One month of fees reconciles with the owner's records |
| **4. WhatsApp** | Templates, opt-in, the reminder jobs, message log, retries, quiet hours | Test reminders reach staff phones. Then enable for real students |
| **5. Hardening** | Reports and exports, audit log UI, backups, monitoring, owner training | Owner signs off |

---

## 11. Acceptance tests (examples)

1. A student enrolled in "Sat 4–5pm" scans at 3:45 → `present`. Scans again at 3:50 → duplicate, ignored.
2. They scan at 4:20 with a late threshold of 10 minutes → `late`.
3. No scan by 5:15 → auto `absent`. At 5:20 (within allowed messaging hours) one "absent today" WhatsApp goes to the guardian, and never a second one.
4. The device is offline from 3pm to 6pm and the student did scan → the punch arrives at 6pm, the record upgrades to `present`, and no absence message was sent because messages were held.
5. Saturday is marked a holiday → no sessions, no absences, no messages.
6. The October fee of ₹1,500 is due on the 5th, and ₹1,000 is paid on the 3rd → on the 10th the overdue reminder says ₹500. Paid in full on the 12th → no further reminders.
7. A student is paused for October → no October due, no absences, no messages.
8. A guardian replies STOP → opt-out recorded, and no further messages to that number.
9. An unknown finger is scanned → an `unknown_user` punch appears in "needs attention."
10. A teacher tries to waive a fee → denied.
11. A student leaves → removed from the device, history kept, reminders stop.

---

## 12. Open questions for the owner

| # | Question | Why it matters |
|---|---|---|
| Q1 | Roughly how many students, batches and branches? Expected growth? | Device capacity, cost, number of devices |
| Q2 | ~~Which hardware option?~~ **Answered: the owner's mobile phone (Option C).** Is the phone Android (which model)? Does it have a USB-C port with OTG? Will anyone else take attendance on another phone? | Option C works only on Android (§2.1) |
| Q3 | Fee structure: monthly per batch? Due date? Pro-rating for mid-month joiners? Admission or other fees? | Fee engine (§4 C4) |
| Q4 | When a student leaves with dues outstanding, should reminders continue? | Reminder rules |
| Q5 | Is the fee still due if a student is absent all month without pausing? | Fee policy |
| Q6 | Should "late" be tracked? From how many minutes after start? | Attendance rules |
| Q7 | For back-to-back classes, is one scan enough or should each class need its own scan? | Punch resolution |
| Q8 | Absence message: after every absence, or only after N in a row? | Message volume and cost |
| Q9 | Message language: English, Tamil or both? Can you share the exact wording you want? | Template approval |
| Q10 | Siblings: one combined message or one per child? | Templates |
| Q11 | Should students be notified when a class is cancelled? | Extra template |
| Q12 | Should replies to reminders reach a staff phone? | Inbox or forwarding |
| Q13 | Which phone number will send the WhatsApp messages? (It must be a number *not* currently used in the WhatsApp app, or one you're willing to migrate.) | Meta onboarding |
| Q14 | Who uses the app (owner only, office staff, teachers)? | Roles |
| Q15 | Is the institute's internet reliable? Is there a UPS? | Offline design |
| Q16 | Do you have existing student data (Excel or registers) to import? | Import tooling |

---

## 13. Out of scope (for now)

Online fee payment (UPI links or a payment gateway), a parent/student mobile app, a teacher payroll module, multi-branch consolidated reporting, a class-content or LMS module. All are possible later additions.
