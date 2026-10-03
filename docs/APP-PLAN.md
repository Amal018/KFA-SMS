# KFA-SMS: App Build Plan

**Date:** 2026-10-03
**Supersedes:** the fingerprint sections of [HANDOFF.md](HANDOFF.md) (§2.1, C2, §6.2). Everything else in the handoff (fees, WhatsApp, edge cases, privacy, roles) still applies, and this plan builds on it.

**Attendance methods:** face recognition, QR code cards and NFC stickers, all on the owner's phone. No extra hardware apart from printed cards and stickers.

---

## 1. Product summary

One phone app does everything:

- **Students:** add or edit students, take their face photos, and link a QR card and an NFC sticker to each one.
- **Attendance mode:** the phone stands at the entrance. Each student shows their face, shows their QR card or taps their NFC sticker, and is marked present. At the end of the class, everyone who didn't check in is marked absent.
- **Fees:** record payments and see who owes money.
- **WhatsApp:** automatic reminders for unpaid fees and absences, sent from the server so they go out even when the phone is off.

---

## 2. Architecture

```
┌──────────────────────────── Owner's phone (Android first) ───────────────────────────┐
│  KFA-SMS app (React Native + Expo, TypeScript)                                        │
│   ├─ Camera ─► Face detection + liveness (ML Kit) ─► Face embedding (TFLite model)    │
│   ├─ Camera ─► QR scanner (signed QR payload)                                          │
│   ├─ NFC reader ─► sticker tag ID / NDEF payload                                       │
│   ├─ Local SQLite: students, face embeddings (encrypted), today's sessions, punches   │
│   └─ Sync engine: push punches/changes, pull updates (works offline, syncs later)     │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           │ HTTPS (Supabase client + auth)
┌──────────────────────────────────────────▼───────────────────────────────────────────┐
│  Supabase (hosted)                                                                    │
│   ├─ Postgres: all data + row-level security per role                                │
│   ├─ Auth: staff logins                                                               │
│   ├─ Storage: student profile photos (private bucket)                                 │
│   ├─ Edge Functions: punch ingestion rules, fee dues, WhatsApp sender, webhooks       │
│   └─ pg_cron: auto-absent, fee-due generation, reminder jobs                          │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           │ HTTPS
                          ┌────────────────▼────────────────┐
                          │ WhatsApp BSP (Interakt/AiSensy/ │
                          │ WATI) → WhatsApp Cloud API      │
                          └─────────────────────────────────┘
```

### Why this stack

| Choice | Reason |
|---|---|
| **React Native + Expo (development build), TypeScript** | Same language as the owner's existing Next.js work. One codebase can later ship to iPhone too (camera, ML and NFC all work on iOS). Mature libraries for every hardware need below |
| **Supabase** | Postgres, auth, file storage, server functions and cron in one hosted service. No server to run. A free tier is enough to start |
| **On-device face recognition** | Fast, works offline, and no face images are sent to a third-party cloud (better for privacy and the law) |
| **WhatsApp via an Indian BSP** | Official API, simpler setup and template approval (see handoff §2.2) |

### Key libraries (verify current versions at build time)

| Need | Library |
|---|---|
| Camera + real-time frames | `react-native-vision-camera` (frame processors) |
| Face detection, landmarks, eye-open / head-angle (for liveness) | Google ML Kit face detection via a Vision Camera plugin |
| Face embedding model | `react-native-fast-tflite` running **MobileFaceNet** (or a similar 128/192-d embedding model; check the model's licence permits commercial use) |
| QR scanning | Vision Camera's built-in code scanner |
| NFC | `react-native-nfc-manager` |
| Local DB | `expo-sqlite` (or WatermelonDB if sync gets complex) |
| Secure key storage | `expo-secure-store` (holds the key that encrypts embeddings) |
| Backend client | `@supabase/supabase-js` |
| UI | React Native Paper or Tamagui, with Tamil + English i18n via `i18next` |

> Expo Go can't run these native modules. Use an **Expo development build** (`npx expo run:android` / EAS Build).

---

## 3. Attendance methods: how each one works

### 3.1 Face recognition

**Registration (in the student form):**
1. Staff open "Register face" and the student looks at the camera.
2. The app captures **5 good frames**: face centred, eyes open, slight left/right turns, good lighting (quality checks from ML Kit).
3. Each frame goes through the TFLite model, producing an **embedding**: a list of 128–192 numbers describing the face. These are stored per student (encrypted), not the photos. One clear profile photo is stored separately for display, with consent.

**Recognition (attendance mode):**
1. The camera runs continuously. ML Kit finds a face.
2. **Liveness check:** the app asks for a blink (or a head turn) and confirms it from the eye-open / head-angle readings. This stops someone holding up a photo or another phone.
3. Make an embedding and compare it, using cosine similarity, against every enrolled student's embeddings (1:N). A few hundred students takes milliseconds.
4. **Decision:**
   - Best score ≥ **match threshold** *and* clearly ahead of the second-best (margin rule) → mark present, show "✓ Priya: Present" with their photo and play a sound.
   - Score in the "unsure" band → ask the student to try again, or to scan their QR/NFC instead.
   - Below threshold → "Not recognised".
5. Thresholds start at the model's recommended values and are **tuned with real students in week 1** (see §9).

**Known limits and mitigations:** poor lighting (suggest a fixed spot facing a window or a light), glasses or masks (register with and without glasses), children's faces changing (prompt to re-register every 12 months, or when match scores drift down), and twins (fall back to a card).

### 3.2 QR code cards

- Each student gets a printed ID card (or a QR on their phone) with a **signed QR payload**: `KFA1.<student_uuid>.<card_version>.<signature>`. The signature is an HMAC with a secret key kept on the server and the app, so **a home-made QR with someone's ID won't work**.
- **Lost card:** staff tap "Reissue card". The card version goes up, the old QR stops working immediately, and the app prints a new one.
- Generate the cards from the app as a PDF (photo, name, batch, QR) to print on A4 sheets, 8 per page.

### 3.3 NFC stickers

- Stick an NFC sticker (NTAG213/215, about ₹10–30) on the back of the ID card, or give it as a key-tag.
- **Linking:** in the student form, tap "Link NFC" and hold the sticker to the phone. The app saves the sticker's **unique ID (UID)** against the student, and also writes a signed payload (same format as QR) to the sticker.
- **At attendance:** a tap is read, the UID and payload are verified, and the student is marked present.
- **Lost sticker:** unlink it, and the old UID is blocked.
- **Phone requirement:** the phone must have NFC (most mid-range and higher Android phones do). Check in Settings → Connected devices.
- Cheap stickers can be cloned by someone determined. Good enough here, especially with the proxy rule below. (Higher security later: NTAG 424 DNA tags, which generate a fresh code each tap.)

### 3.4 Stopping proxy attendance with cards (a friend scanning someone else's card)

Cards identify a *card*, not a *person*. Per-batch setting **"Card check level"**:

| Level | Behaviour |
|---|---|
| **Card only** | QR or NFC marks present. Fastest |
| **Card + photo snap** (default) | On a card scan, the front camera silently takes a small photo, kept for 30 days for review. The student's profile photo is shown big on screen, so staff can see at a glance if it's the wrong person |
| **Card + face verify** | After the card scan, the app checks the face *against that one student* (1:1, more accurate than 1:N). Mismatch → flagged and not marked |

### 3.5 Choosing the method at the door

Attendance mode shows the **camera view** with face detection running and the QR scanner on simultaneously, while **NFC listens in the background**. Whatever the student does (shows a face, a card, or taps a sticker), it's handled. No mode switching needed.

### 3.6 Manual fallback

Staff can always open a session's register and mark a student present, absent or excused, with a reason (audited). Used when the camera or NFC fails or a student forgot their card.

---

## 4. Data model changes (vs. handoff §3)

Replace `BiometricIdentity` with:

| Table | Fields |
|---|---|
| **face_profile** | id, student_id, embedding (encrypted bytes), model_version, quality_score, captured_at, captured_by, active |
| **credential** | id, student_id, type (`qr`, `nfc`), value (QR card_version or NFC UID), status (`active`, `revoked`), issued_at, revoked_at, revoked_reason |
| **punch** (updated) | … + `method` (`face`, `qr`, `nfc`, `manual`), `match_score` (face), `credential_id` (qr/nfc), `verify_photo_path` (card + photo snap), `device_id` (which phone), `client_punch_id` (UUID made on the phone, for de-duplication) |
| **device** | id, name, owner_user_id, last_sync_at, app_version, revoked |
| **settings** (additions) | face_match_threshold, face_margin, liveness_required, card_check_level (per batch), verify_photo_retention_days |

`model_version` on face_profile matters: if the face model is upgraded, every student's embeddings must be regenerated (from stored photos if the student consented, otherwise by re-registering).

---

## 5. Offline and sync

- The phone keeps a local copy of what attendance needs: active students, embeddings, credentials, and the next 7 days of sessions.
- Every scan becomes a local punch with a `client_punch_id`. The sync engine uploads queued punches as soon as there's internet, and the server ignores duplicates.
- Server rules (§5 of the handoff) decide present / late / duplicate / outside window, so results are the same whether a punch arrives instantly or hours later.
- **Absence messages wait for sync:** if the attendance phone hasn't synced since before a session ended, absence reminders for that session are held and the owner gets an alert ("Phone not synced, absence messages paused").
- Changes made in the app (new student, payment) are also queued offline and synced. When two people edit the same record, the most recent edit wins, and attendance records always merge.

---

## 6. Screens

| # | Screen | Notes |
|---|---|---|
| 1 | Login | Staff email/phone + password. Remembers the device |
| 2 | Home / Dashboard | Today's classes with present / absent counts, dues this month, alerts (unsynced, failed messages, low face-match quality) |
| 3 | **Attendance mode** | Full-screen camera, big result banner with the student's photo and name, sound. Optional "kiosk" lock so students can't leave the screen |
| 4 | Today's register | Per session: present (with method icons: face / QR / NFC / manual), not yet arrived, absent. Manual edits |
| 5 | Students list | Search, filter by batch or status, badges showing missing face / QR / NFC |
| 6 | Student form | Details, guardian, consents (WhatsApp, face), batches, fee override |
| 7 | Student profile | Tabs: Overview, Attendance, Fees, Messages, Credentials (register face, print QR, link NFC, revoke) |
| 8 | Register face | Guided capture with live quality feedback |
| 9 | Batches & schedules | Days, times, fee, teacher, card check level |
| 10 | Fees | Dues, record payment, receipt (share via WhatsApp/PDF), defaulters |
| 11 | Messages | Log with delivery status, "send reminder now", template status |
| 12 | Reports | Attendance %, collections, exports (Excel/PDF) |
| 13 | Settings | Institute info, holidays, reminder rules, quiet hours, face thresholds, devices, staff users, print ID cards |

---

## 7. Repository layout

```
KFA-SMS/
├─ apps/
│  └─ mobile/                 # Expo app
│     ├─ app/                 # screens (expo-router)
│     ├─ src/
│     │  ├─ attendance/       # face pipeline, QR, NFC, decision logic
│     │  ├─ db/               # SQLite schema, sync engine
│     │  ├─ features/         # students, fees, messages, reports
│     │  └─ lib/              # supabase client, crypto, i18n
│     └─ assets/models/       # face embedding .tflite
├─ supabase/
│  ├─ migrations/             # SQL schema + RLS policies
│  ├─ functions/              # edge functions (ingest-punches, whatsapp-send, generate-dues, …)
│  └─ seed.sql                # test batches/students for development
├─ docs/
│  ├─ HANDOFF.md
│  └─ APP-PLAN.md
└─ README.md
```

---

## 8. Build phases

Estimates assume one developer working full-time. Part-time, roughly double.

### Phase 0: Setup and prerequisites (week 1)
- [ ] Owner answers the open questions in handoff §12 (student count, fee rules, message wording, etc.)
- [ ] Confirm the phone is Android with **NFC**. Buy 20 test NFC stickers
- [ ] Create a Supabase project. Set up the Expo app with a development build running on the owner's phone
- [ ] Sign up with a WhatsApp BSP. **Submit message templates now** (approval takes days)
- [ ] Draft the consent form (WhatsApp + face photo, parent signature for under-18s)

### Phase 1: Core data (weeks 2–3)
- [ ] Database schema + row-level security for owner / staff / teacher
- [ ] Login, roles, device registration
- [ ] Students, guardians, batches, schedules, enrolments, holidays (CRUD screens)
- [ ] Session generation from schedules
- [ ] Excel/CSV import of existing students
- [ ] Local SQLite + sync engine (pull + push), working offline
- **Done when:** the owner can load all real students and batches from the phone

### Phase 2: QR and NFC attendance (weeks 4–5)
*Built before face because it's simpler and proves the whole attendance pipeline.*
- [ ] Signed QR payload, ID card PDF generation
- [ ] NFC link / unlink / revoke, signed sticker payload
- [ ] Attendance mode: QR scanner + NFC listener, result banner, sounds
- [ ] Server punch rules (window, late, duplicate, outside window, multiple batches)
- [ ] Auto-absent job, manual override, leave, Today's register
- [ ] "Card + photo snap" proxy check
- **Done when:** a week of real classes runs on QR/NFC and matches a paper register

### Phase 3: Face recognition (weeks 6–8)
- [ ] Face detection + quality checks + guided registration
- [ ] Embedding model on-device, encrypted storage, sync of embeddings
- [ ] 1:N matching with threshold + margin rules
- [ ] Liveness (blink / head turn)
- [ ] "Card + face verify" (1:1) mode
- [ ] Threshold tuning screen (owner only) + match logs for review
- **Done when:** on 30+ real students over a week, ≥ 97% of face scans are recognised, with **zero wrong-person matches** (§9)

### Phase 4: Fees (weeks 9–10)
- [ ] Monthly dues generation, one-time fees, discounts and overrides
- [ ] Record payments (partial / advance), receipts, waivers (owner only), reversal
- [ ] Defaulters list
- **Done when:** a month of fees reconciles with the owner's records

### Phase 5: WhatsApp reminders (weeks 11–12)
- [ ] BSP integration edge function, template mapping (Tamil + English)
- [ ] Opt-in tracking, STOP handling, invalid number flagging
- [ ] Fee due / overdue, absent today, absence streak jobs. Quiet hours, idempotency, retries
- [ ] "Absence messages wait for sync" safeguard
- [ ] Message log screen, "send now", monthly cost estimate
- **Done when:** test messages reach staff phones, then go live for real students

### Phase 6: Hardening and launch (weeks 13–14)
- [ ] Reports and exports, audit log view
- [ ] Backups verified (restore tested), error monitoring (e.g. Sentry)
- [ ] Kiosk mode for attendance, battery/charging guidance
- [ ] Owner training + a 1-page quick guide (Tamil + English)
- [ ] Release the APK (direct install), or publish to Play Store as a private/unlisted app

**Total: about 14 weeks full-time.** A lean MVP of phases 0–2 plus fee reminders (QR/NFC attendance, fees, WhatsApp) could ship in about **6–7 weeks**, with face recognition added afterwards.

---

## 9. Testing plan

| Area | How |
|---|---|
| Punch rules | Automated tests on the server rules for every case in handoff §5–6 (window, late, duplicate, overlapping batches, holidays, late sync) |
| Reminders | Automated tests for idempotency, quiet hours, paid-before-send, opt-out, held-for-sync |
| QR/NFC | Forged QR (wrong signature) rejected, revoked card rejected, unknown sticker → "not linked" |
| Face accuracy | Register 30+ students. Log every scan's best and second-best score for a week. Pick the threshold so **wrong-person matches are 0**, accepting a few retries. Test in morning, evening and artificial light, with and without glasses |
| Liveness | Printed photo, photo on another phone, video on another phone: all must fail |
| Offline | Airplane mode during a class, then reconnect: all punches sync, no duplicates, absence messages correct |
| Devices | Test on the owner's phone and one cheap Android phone (slowest case) |

---

## 10. Privacy and security (additions to handoff §8)

- **Faces are biometric data** under India's DPDP Act. Get written consent (from a parent for under-18s), offer QR/NFC as the non-face alternative, and delete face data when a student leaves or withdraws consent.
- Store **embeddings, not face photos**, for matching. Encrypt them with a key in the phone's secure storage, and encrypt them at rest on the server. The profile photo (for display) goes in a private storage bucket, only with consent.
- Card-scan verification photos are auto-deleted after 30 days (configurable).
- The QR/NFC signing secret is never shown in the UI. It can be rotated (which invalidates all cards; reprint).
- **A lost phone** can be revoked from Settings → Devices on another login. The local database is encrypted, and the app requires login plus the phone's screen lock.
- All server tables use row-level security. Teachers see only their own batches and no fees or phone numbers.

---

## 11. Running costs (estimates; confirm at setup)

| Item | Cost |
|---|---|
| Supabase | Free tier to start. About US$25/month (Pro) when backups and more storage are needed |
| WhatsApp BSP | About ₹1,000–3,000/month plan (varies by provider) |
| WhatsApp messages | Meta's per-message charge for utility templates (check the current India rate). E.g. 200 students × ~6 messages/month |
| NFC stickers | ₹10–30 each |
| ID card printing | ₹10–40 per card (PVC), or print on paper and laminate |
| Play Store developer account | US$25 one-time (optional; an APK can be installed directly) |
| Apple developer account (if iPhone later) | US$99/year |

---

## 12. Decisions still needed from the owner

1. Phone model. Does it have NFC? (Phase 0 blocker)
2. The open questions in handoff §12 (fees, absence rules, message language, sibling messages, etc.)
3. Default **card check level**: card only, card + photo snap, or card + face verify?
4. ID cards: PVC cards with an NFC sticker on the back, or separate key-tags?
5. Ship the full plan (~14 weeks), or the lean MVP first (~6–7 weeks, face recognition added after)?
