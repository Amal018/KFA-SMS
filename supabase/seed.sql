-- Sample data for local development / a test project. Not for production.
insert into batches (id, name, art_form, monthly_fee) values
  ('11111111-1111-1111-1111-111111111111', 'Bharatanatyam Beginners', 'Dance', 1500),
  ('22222222-2222-2222-2222-222222222222', 'Carnatic Vocal', 'Music', 1200),
  ('33333333-3333-3333-3333-333333333333', 'Drawing Juniors', 'Art', 1000);

insert into schedules (batch_id, weekday, start_time, end_time, valid_from) values
  ('11111111-1111-1111-1111-111111111111', 6, '16:00', '17:00', '2026-01-01'),
  ('11111111-1111-1111-1111-111111111111', 0, '10:00', '11:00', '2026-01-01'),
  ('22222222-2222-2222-2222-222222222222', 2, '17:30', '18:30', '2026-01-01'),
  ('22222222-2222-2222-2222-222222222222', 4, '17:30', '18:30', '2026-01-01'),
  ('33333333-3333-3333-3333-333333333333', 6, '10:00', '11:30', '2026-01-01');

insert into students (id, admission_no, full_name, date_of_birth, whatsapp_number, whatsapp_opt_in,
                      guardian_name, guardian_whatsapp_number, guardian_whatsapp_opt_in, face_consent) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'KFA-001', 'Asha Kumar', '2012-04-10', null, false, 'Lakshmi Kumar', '919800000001', true, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'KFA-002', 'Bala Murugan', '1998-09-21', '919800000002', true, null, null, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'KFA-003', 'Chitra Devi', '2015-01-30', null, false, 'Ravi Devi', '919800000003', true, false);

insert into enrolments (student_id, batch_id, start_date, kind) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-06-01', 'regular'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-06-01', 'regular'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '2026-09-15', 'trial');

insert into credentials (student_id, type, value) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'qr', '1'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'qr', '1'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'qr', '1');

insert into holidays (date, name) values ('2026-10-20', 'Deepavali');
