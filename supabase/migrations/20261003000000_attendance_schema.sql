-- KFA-SMS attendance schema. Mirrors packages/core types; rules live in the
-- core package and run in edge functions with the service role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- types

create type app_role as enum ('owner', 'staff', 'teacher');
create type session_status as enum ('scheduled', 'holiday', 'cancelled');
create type session_kind as enum ('regular', 'extra', 'event');
create type enrolment_kind as enum ('regular', 'trial');
create type attendance_status as enum ('present', 'late', 'absent', 'excused');
create type record_source as enum ('punch', 'auto', 'manual');
create type punch_method as enum ('face', 'qr', 'nfc', 'manual');
create type credential_type as enum ('qr', 'nfc');
create type message_status as enum ('pending', 'sent', 'failed', 'cancelled', 'skipped');

-- ---------------------------------------------------------------- staff

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role app_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- The first account becomes the owner; later accounts default to staff.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when exists (select 1 from profiles) then 'staff'::app_role else 'owner'::app_role end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

create function my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and active
$$;

create function is_staff() returns boolean
language sql stable as $$ select coalesce(my_role() in ('owner', 'staff'), false) $$;

create function is_owner() returns boolean
language sql stable as $$ select coalesce(my_role() = 'owner', false) $$;

-- ---------------------------------------------------------------- settings

create table institute_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'KFA',
  -- Overrides of packages/core DEFAULT_SETTINGS; missing keys use the defaults.
  attendance jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
insert into institute_settings default values;

-- Signs QR cards and NFC stickers. Phones need it to verify cards offline.
create table app_secrets (
  id smallint primary key default 1 check (id = 1),
  card_secret text not null default encode(gen_random_bytes(32), 'hex'),
  rotated_at timestamptz not null default now()
);
insert into app_secrets default values;

-- ---------------------------------------------------------------- classes

create table batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  art_form text,
  teacher_id uuid references profiles on delete set null,
  monthly_fee numeric(10, 2),
  -- BatchSettings overrides (openBeforeMin, lateAfterMin, cardCheckLevel, …)
  settings jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create function teaches(batch uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from batches where id = batch and teacher_id = auth.uid())
$$;

create table schedules (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  valid_from date not null default current_date,
  valid_to date,
  check (end_time > start_time),
  check (valid_to is null or valid_to >= valid_from)
);

create table holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  -- null = every batch
  batch_ids uuid[]
);
create index on holidays (date);

-- Session id is "<batch_id>:<date>:<HH:MM>", matching core sessionId().
create table sessions (
  id text primary key,
  batch_id uuid not null references batches on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  status session_status not null default 'scheduled',
  kind session_kind not null default 'regular',
  counts_for_percent boolean not null default true,
  absence_alerts boolean,
  cancel_reason text,
  finalized_at timestamptz,
  alerts_allowed boolean,
  created_at timestamptz not null default now(),
  unique (batch_id, date, start_time)
);
create index on sessions (date);
create index on sessions (finalized_at) where finalized_at is null;

-- ---------------------------------------------------------------- students

create table students (
  id uuid primary key default gen_random_uuid(),
  admission_no text unique,
  full_name text not null,
  photo_path text,
  date_of_birth date,
  gender text,
  phone text,
  whatsapp_number text,
  whatsapp_opt_in boolean not null default false,
  whatsapp_opt_in_at timestamptz,
  guardian_name text,
  guardian_relation text,
  guardian_phone text,
  guardian_whatsapp_number text,
  guardian_whatsapp_opt_in boolean not null default false,
  face_consent boolean not null default false,
  face_consent_at timestamptz,
  address text,
  joined_on date not null default current_date,
  left_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table student_pauses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  from_date date not null,
  to_date date not null check (to_date >= from_date),
  reason text
);

create table enrolments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  batch_id uuid not null references batches on delete cascade,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  kind enrolment_kind not null default 'regular',
  fee_override numeric(10, 2),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);
create index on enrolments (batch_id);
create index on enrolments (student_id);

create table leaves (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  from_date date not null,
  to_date date not null check (to_date >= from_date),
  -- null = all batches
  batch_id uuid references batches on delete cascade,
  reason text,
  status text not null default 'approved' check (status in ('approved', 'cancelled')),
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- identity

-- Embeddings are encrypted on the phone before upload; never readable as plain numbers here.
create table face_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  embedding bytea not null,
  model_version text not null,
  quality real,
  active boolean not null default true,
  captured_at timestamptz not null default now(),
  captured_by uuid references profiles
);

create table credentials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  type credential_type not null,
  -- QR: card version. NFC: normalised UID (uppercase hex).
  value text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text
);
create unique index credentials_nfc_uid on credentials (value) where type = 'nfc';
create unique index credentials_one_active_qr on credentials (student_id) where type = 'qr' and status = 'active';

-- ---------------------------------------------------------------- attendance

create table devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references profiles on delete set null,
  last_sync_at timestamptz,
  app_version text,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table punches (
  id uuid primary key default gen_random_uuid(),
  client_punch_id text not null unique,
  device_id uuid references devices,
  student_id uuid references students on delete cascade,
  method punch_method not null,
  punched_at timestamptz not null,
  received_at timestamptz not null default now(),
  credential_id uuid references credentials,
  match_score real,
  verify_photo_path text,
  face_verify text check (face_verify in ('match', 'mismatch', 'no_profile')),
  outcome text not null,
  outcome_reason text,
  flags text[] not null default '{}',
  review_status text check (review_status in ('pending', 'approved', 'rejected'))
);
create index on punches (student_id, punched_at);
create index on punches (review_status) where review_status = 'pending';

create table attendance_records (
  session_id text not null references sessions on delete cascade,
  student_id uuid not null references students on delete cascade,
  status attendance_status not null,
  source record_source not null,
  locked boolean not null default false,
  client_punch_id text,
  punched_at timestamptz,
  reason text,
  marked_by uuid references profiles,
  updated_at timestamptz not null default now(),
  primary key (session_id, student_id),
  check (source <> 'manual' or (reason is not null and length(trim(reason)) > 0))
);
create index on attendance_records (student_id);

-- ---------------------------------------------------------------- messages

create table outgoing_messages (
  id uuid primary key default gen_random_uuid(),
  -- Idempotency key from core (absent:<session>:<student>, streak:<enrolment>:<session>)
  key text not null unique,
  template text not null,
  student_id uuid references students on delete cascade,
  recipient text check (recipient in ('student', 'guardian')),
  notify_owner boolean not null default false,
  session_id text references sessions on delete set null,
  scheduled_at timestamptz not null,
  status message_status not null default 'pending',
  attempts smallint not null default 0,
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index on outgoing_messages (status, scheduled_at) where status = 'pending';

create table owner_notices (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  message text not null,
  session_id text,
  student_id uuid,
  device_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- audit

create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  table_name text not null,
  row_id text,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

create function audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, action, table_name, row_id, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(to_jsonb(new), to_jsonb(old)) ->> 'id',
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

-- Manual attendance changes (X-05): audit only manual writes and unlocks.
create function audit_attendance() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.source = 'manual' or (tg_op = 'UPDATE' and old.locked and not new.locked) then
    insert into audit_log (actor, action, table_name, row_id, before, after)
    values (auth.uid(), lower(tg_op), 'attendance_records', new.session_id || '/' || new.student_id,
            case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  end if;
  return new;
end $$;

create trigger audit_attendance after insert or update on attendance_records
for each row execute function audit_attendance();
create trigger audit_leaves after insert or update or delete on leaves for each row execute function audit();
create trigger audit_credentials after insert or update or delete on credentials for each row execute function audit();
create trigger audit_face_profiles after insert or update or delete on face_profiles for each row execute function audit();
create trigger audit_students after update or delete on students for each row execute function audit();
create trigger audit_devices after update on devices for each row execute function audit();

-- ---------------------------------------------------------------- RLS

alter table profiles enable row level security;
alter table institute_settings enable row level security;
alter table app_secrets enable row level security;
alter table batches enable row level security;
alter table schedules enable row level security;
alter table holidays enable row level security;
alter table sessions enable row level security;
alter table students enable row level security;
alter table student_pauses enable row level security;
alter table enrolments enable row level security;
alter table leaves enable row level security;
alter table face_profiles enable row level security;
alter table credentials enable row level security;
alter table devices enable row level security;
alter table punches enable row level security;
alter table attendance_records enable row level security;
alter table outgoing_messages enable row level security;
alter table owner_notices enable row level security;
alter table audit_log enable row level security;

-- Profiles: everyone reads their own; the owner manages staff.
create policy "own profile" on profiles for select using (id = auth.uid() or is_staff());
create policy "owner manages staff" on profiles for update using (is_owner());

-- Settings: staff read, owner writes.
create policy "staff read settings" on institute_settings for select using (is_staff() or my_role() = 'teacher');
create policy "owner writes settings" on institute_settings for update using (is_owner());
create policy "staff read card secret" on app_secrets for select using (is_staff());
create policy "owner rotates card secret" on app_secrets for update using (is_owner());

-- Office data: owner and staff have full access.
create policy "staff all" on batches for all using (is_staff()) with check (is_staff());
create policy "staff all" on schedules for all using (is_staff()) with check (is_staff());
create policy "staff all" on holidays for all using (is_staff()) with check (is_staff());
create policy "staff all" on sessions for all using (is_staff()) with check (is_staff());
create policy "staff all" on students for all using (is_staff()) with check (is_staff());
create policy "staff all" on student_pauses for all using (is_staff()) with check (is_staff());
create policy "staff all" on enrolments for all using (is_staff()) with check (is_staff());
create policy "staff all" on leaves for all using (is_staff()) with check (is_staff());
create policy "staff all" on face_profiles for all using (is_staff()) with check (is_staff());
create policy "staff all" on credentials for all using (is_staff()) with check (is_staff());
create policy "staff all" on devices for all using (is_staff()) with check (is_staff());
create policy "staff read punches" on punches for select using (is_staff());
create policy "staff all" on attendance_records for all using (is_staff()) with check (is_staff());
create policy "staff read messages" on outgoing_messages for select using (is_staff());
create policy "staff read notices" on owner_notices for select using (is_staff());
create policy "staff mark notices read" on owner_notices for update using (is_staff());
create policy "owner reads audit" on audit_log for select using (is_owner());

-- Teachers: their own batches only, no phone numbers or fees (M-42, handoff §9).
create policy "teacher batches" on batches for select using (teacher_id = auth.uid());
create policy "teacher schedules" on schedules for select using (teaches(batch_id));
create policy "teacher holidays" on holidays for select using (my_role() = 'teacher');
create policy "teacher sessions" on sessions for select using (teaches(batch_id));
create policy "teacher enrolments" on enrolments for select using (teaches(batch_id));
create policy "teacher records read" on attendance_records for select
  using (teaches((select batch_id from sessions s where s.id = session_id)));
create policy "teacher records write" on attendance_records for insert
  with check (source = 'manual' and teaches((select batch_id from sessions s where s.id = session_id)));
create policy "teacher records update" on attendance_records for update
  using (teaches((select batch_id from sessions s where s.id = session_id)))
  with check (source = 'manual');

-- Names and photos only, for teachers' registers.
create view teacher_students with (security_barrier) as
  select distinct s.id, s.full_name, s.admission_no, s.photo_path
  from students s
  join enrolments e on e.student_id = s.id
  where teaches(e.batch_id) or is_staff();
grant select on teacher_students to authenticated;

-- Photos bucket (profile photos and card-scan verification photos), private.
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;
create policy "staff photos" on storage.objects for all
  using (bucket_id = 'photos' and is_staff()) with check (bucket_id = 'photos' and is_staff());
