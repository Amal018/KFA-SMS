# KFA Students Management System

Attendance, fees and WhatsApp reminders for an arts institute. Students check in
at the door on the owner's Android phone with a **QR card**, an **NFC sticker**,
or (coming next) **face recognition**.

| Folder | What it is |
|---|---|
| [`packages/core`](packages/core) | The attendance rules engine (pure TypeScript), shared by the phone and the server. 101 tests, one per scenario in the spec |
| [`supabase`](supabase) | Database schema with role-based access, and server functions: check-in upload, auto-absent job, WhatsApp sender |
| [`apps/mobile`](apps/mobile) | The Android app (Expo / React Native) |
| [`docs`](docs) | [Handoff](docs/HANDOFF.md), [app plan](docs/APP-PLAN.md), [attendance spec](docs/ATTENDANCE-SPEC.md) |

## What works today

- Sign in (owner / staff / teacher), offline cache and background sync
- **Attendance mode**: front camera scans signed QR cards and NFC stickers at the same time, instant result on screen, works offline, optional check-in photo against proxies
- Auto-absent after each class, holidays, leave, trial students, late arrivals, back-to-back classes, phones that haven't synced (all from the spec)
- Today's register with manual marking (reason required, audited)
- Students: add (with WhatsApp and face consent), QR card on screen, reissue a lost card, link/replace/unlink NFC stickers, attendance %
- WhatsApp "absent today" and absence-streak messages through the official WhatsApp Cloud API (dry-run "log" mode by default)

**Not yet:** face recognition (phase 3), fees, reports/exports, printable ID cards.

## Setup

### 1. Run the checks locally

```bash
npm install
npm test
```

### 2. Create the Supabase project (free tier is fine)

1. Create a project at https://supabase.com (region: Mumbai).
2. Link and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push
   ```
3. In the dashboard → **Authentication → Users → Add user**, create the owner's login. **The first account becomes the owner**; later accounts are staff (change roles in the `profiles` table, e.g. `teacher`).
4. Deploy the server functions and set their secrets:
   ```bash
   npx supabase functions deploy ingest-punches
   npx supabase functions deploy attendance-cron
   npx supabase functions deploy send-messages
   npx supabase secrets set CRON_SECRET=<a long random string>
   ```
5. Open `supabase/setup/cron.sql`, fill in the project ref and the same `CRON_SECRET`, and run it in the SQL editor. This schedules auto-absent and messaging every 5 minutes.
6. Add batches and their weekly schedules in the Table Editor (`batches`, `schedules`), or load `supabase/seed.sql` into a test project.

### 3. WhatsApp (when ready)

Messages are only logged until you switch the provider on:

```bash
npx supabase secrets set WHATSAPP_PROVIDER=cloud WHATSAPP_TOKEN=<token> WHATSAPP_PHONE_NUMBER_ID=<id>
```

Get approval for two **Utility** templates first: `absent_today` (variables: student name, batch, date) and `absence_streak` (student name, batch). Template names can be changed with `WA_TEMPLATE_ABSENT` / `WA_TEMPLATE_STREAK`.

### 4. Build the Android app

```bash
cd apps/mobile
cp .env.example .env        # fill in the Supabase URL and publishable key
npx eas-cli@latest login     # free Expo account
npx eas-cli@latest build --profile preview --platform android
```

EAS builds the APK in the cloud (no Android Studio needed) and gives a link to install it on the phone. For development with live reload, use `--profile development`, then `npx expo start`.
