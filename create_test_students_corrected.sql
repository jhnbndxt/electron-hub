-- ============================================================================
-- CREATE 100 TEST STUDENT ACCOUNTS - CORRECTED VERSION
-- ============================================================================
-- This script creates users in the public.users table (not auth.users)
-- ============================================================================

-- First, verify the public.users table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE EXCEPTION 'Table public.users does not exist. Please run SUPABASE_SCHEMA.sql first.';
    END IF;
END $$;

-- Insert 100 test users into public.users table
INSERT INTO public.users (
    email,
    password_hash,
    full_name,
    first_name,
    last_name,
    middle_name,
    sex,
    role,
    status,
    contact_number,
    created_at
) VALUES
('test001@student.com', '$2b$10$dummyhash', 'Test Student 001', 'Test', 'Student', 'A', 'Male', 'student', 'active', '09120000001', CURRENT_TIMESTAMP),
('test002@student.com', '$2b$10$dummyhash', 'Test Student 002', 'Test', 'Student', 'B', 'Female', 'student', 'active', '09120000002', CURRENT_TIMESTAMP),
('test003@student.com', '$2b$10$dummyhash', 'Test Student 003', 'Test', 'Student', 'C', 'Male', 'student', 'active', '09120000003', CURRENT_TIMESTAMP),
('test004@student.com', '$2b$10$dummyhash', 'Test Student 004', 'Test', 'Student', 'D', 'Female', 'student', 'active', '09120000004', CURRENT_TIMESTAMP),
('test005@student.com', '$2b$10$dummyhash', 'Test Student 005', 'Test', 'Student', 'E', 'Male', 'student', 'active', '09120000005', CURRENT_TIMESTAMP),
('test006@student.com', '$2b$10$dummyhash', 'Test Student 006', 'Test', 'Student', 'F', 'Female', 'student', 'active', '09120000006', CURRENT_TIMESTAMP),
('test007@student.com', '$2b$10$dummyhash', 'Test Student 007', 'Test', 'Student', 'G', 'Male', 'student', 'active', '09120000007', CURRENT_TIMESTAMP),
('test008@student.com', '$2b$10$dummyhash', 'Test Student 008', 'Test', 'Student', 'H', 'Female', 'student', 'active', '09120000008', CURRENT_TIMESTAMP),
('test009@student.com', '$2b$10$dummyhash', 'Test Student 009', 'Test', 'Student', 'I', 'Male', 'student', 'active', '09120000009', CURRENT_TIMESTAMP),
('test010@student.com', '$2b$10$dummyhash', 'Test Student 010', 'Test', 'Student', 'J', 'Female', 'student', 'active', '09120000010', CURRENT_TIMESTAMP),
('test011@student.com', '$2b$10$dummyhash', 'Test Student 011', 'Test', 'Student', 'K', 'Male', 'student', 'active', '09120000011', CURRENT_TIMESTAMP),
('test012@student.com', '$2b$10$dummyhash', 'Test Student 012', 'Test', 'Student', 'L', 'Female', 'student', 'active', '09120000012', CURRENT_TIMESTAMP),
('test013@student.com', '$2b$10$dummyhash', 'Test Student 013', 'Test', 'Student', 'M', 'Male', 'student', 'active', '09120000013', CURRENT_TIMESTAMP),
('test014@student.com', '$2b$10$dummyhash', 'Test Student 014', 'Test', 'Student', 'N', 'Female', 'student', 'active', '09120000014', CURRENT_TIMESTAMP),
('test015@student.com', '$2b$10$dummyhash', 'Test Student 015', 'Test', 'Student', 'O', 'Male', 'student', 'active', '09120000015', CURRENT_TIMESTAMP),
('test016@student.com', '$2b$10$dummyhash', 'Test Student 016', 'Test', 'Student', 'P', 'Female', 'student', 'active', '09120000016', CURRENT_TIMESTAMP),
('test017@student.com', '$2b$10$dummyhash', 'Test Student 017', 'Test', 'Student', 'Q', 'Male', 'student', 'active', '09120000017', CURRENT_TIMESTAMP),
('test018@student.com', '$2b$10$dummyhash', 'Test Student 018', 'Test', 'Student', 'R', 'Female', 'student', 'active', '09120000018', CURRENT_TIMESTAMP),
('test019@student.com', '$2b$10$dummyhash', 'Test Student 019', 'Test', 'Student', 'S', 'Male', 'student', 'active', '09120000019', CURRENT_TIMESTAMP),
('test020@student.com', '$2b$10$dummyhash', 'Test Student 020', 'Test', 'Student', 'T', 'Female', 'student', 'active', '09120000020', CURRENT_TIMESTAMP),
('test021@student.com', '$2b$10$dummyhash', 'Test Student 021', 'Test', 'Student', 'U', 'Male', 'student', 'active', '09120000021', CURRENT_TIMESTAMP),
('test022@student.com', '$2b$10$dummyhash', 'Test Student 022', 'Test', 'Student', 'V', 'Female', 'student', 'active', '09120000022', CURRENT_TIMESTAMP),
('test023@student.com', '$2b$10$dummyhash', 'Test Student 023', 'Test', 'Student', 'W', 'Male', 'student', 'active', '09120000023', CURRENT_TIMESTAMP),
('test024@student.com', '$2b$10$dummyhash', 'Test Student 024', 'Test', 'Student', 'X', 'Female', 'student', 'active', '09120000024', CURRENT_TIMESTAMP),
('test025@student.com', '$2b$10$dummyhash', 'Test Student 025', 'Test', 'Student', 'Y', 'Male', 'student', 'active', '09120000025', CURRENT_TIMESTAMP),
('test026@student.com', '$2b$10$dummyhash', 'Test Student 026', 'Test', 'Student', 'Z', 'Female', 'student', 'active', '09120000026', CURRENT_TIMESTAMP),
('test027@student.com', '$2b$10$dummyhash', 'Test Student 027', 'Test', 'Student', 'AA', 'Male', 'student', 'active', '09120000027', CURRENT_TIMESTAMP),
('test028@student.com', '$2b$10$dummyhash', 'Test Student 028', 'Test', 'Student', 'BB', 'Female', 'student', 'active', '09120000028', CURRENT_TIMESTAMP),
('test029@student.com', '$2b$10$dummyhash', 'Test Student 029', 'Test', 'Student', 'CC', 'Male', 'student', 'active', '09120000029', CURRENT_TIMESTAMP),
('test030@student.com', '$2b$10$dummyhash', 'Test Student 030', 'Test', 'Student', 'DD', 'Female', 'student', 'active', '09120000030', CURRENT_TIMESTAMP),
('test031@student.com', '$2b$10$dummyhash', 'Test Student 031', 'Test', 'Student', 'EE', 'Male', 'student', 'active', '09120000031', CURRENT_TIMESTAMP),
('test032@student.com', '$2b$10$dummyhash', 'Test Student 032', 'Test', 'Student', 'FF', 'Female', 'student', 'active', '09120000032', CURRENT_TIMESTAMP),
('test033@student.com', '$2b$10$dummyhash', 'Test Student 033', 'Test', 'Student', 'GG', 'Male', 'student', 'active', '09120000033', CURRENT_TIMESTAMP),
('test034@student.com', '$2b$10$dummyhash', 'Test Student 034', 'Test', 'Student', 'HH', 'Female', 'student', 'active', '09120000034', CURRENT_TIMESTAMP),
('test035@student.com', '$2b$10$dummyhash', 'Test Student 035', 'Test', 'Student', 'II', 'Male', 'student', 'active', '09120000035', CURRENT_TIMESTAMP),
('test036@student.com', '$2b$10$dummyhash', 'Test Student 036', 'Test', 'Student', 'JJ', 'Female', 'student', 'active', '09120000036', CURRENT_TIMESTAMP),
('test037@student.com', '$2b$10$dummyhash', 'Test Student 037', 'Test', 'Student', 'KK', 'Male', 'student', 'active', '09120000037', CURRENT_TIMESTAMP),
('test038@student.com', '$2b$10$dummyhash', 'Test Student 038', 'Test', 'Student', 'LL', 'Female', 'student', 'active', '09120000038', CURRENT_TIMESTAMP),
('test039@student.com', '$2b$10$dummyhash', 'Test Student 039', 'Test', 'Student', 'MM', 'Male', 'student', 'active', '09120000039', CURRENT_TIMESTAMP),
('test040@student.com', '$2b$10$dummyhash', 'Test Student 040', 'Test', 'Student', 'NN', 'Female', 'student', 'active', '09120000040', CURRENT_TIMESTAMP),
('test041@student.com', '$2b$10$dummyhash', 'Test Student 041', 'Test', 'Student', 'OO', 'Male', 'student', 'active', '09120000041', CURRENT_TIMESTAMP),
('test042@student.com', '$2b$10$dummyhash', 'Test Student 042', 'Test', 'Student', 'PP', 'Female', 'student', 'active', '09120000042', CURRENT_TIMESTAMP),
('test043@student.com', '$2b$10$dummyhash', 'Test Student 043', 'Test', 'Student', 'QQ', 'Male', 'student', 'active', '09120000043', CURRENT_TIMESTAMP),
('test044@student.com', '$2b$10$dummyhash', 'Test Student 044', 'Test', 'Student', 'RR', 'Female', 'student', 'active', '09120000044', CURRENT_TIMESTAMP),
('test045@student.com', '$2b$10$dummyhash', 'Test Student 045', 'Test', 'Student', 'SS', 'Male', 'student', 'active', '09120000045', CURRENT_TIMESTAMP),
('test046@student.com', '$2b$10$dummyhash', 'Test Student 046', 'Test', 'Student', 'TT', 'Female', 'student', 'active', '09120000046', CURRENT_TIMESTAMP),
('test047@student.com', '$2b$10$dummyhash', 'Test Student 047', 'Test', 'Student', 'UU', 'Male', 'student', 'active', '09120000047', CURRENT_TIMESTAMP),
('test048@student.com', '$2b$10$dummyhash', 'Test Student 048', 'Test', 'Student', 'VV', 'Female', 'student', 'active', '09120000048', CURRENT_TIMESTAMP),
('test049@student.com', '$2b$10$dummyhash', 'Test Student 049', 'Test', 'Student', 'WW', 'Male', 'student', 'active', '09120000049', CURRENT_TIMESTAMP),
('test050@student.com', '$2b$10$dummyhash', 'Test Student 050', 'Test', 'Student', 'XX', 'Female', 'student', 'active', '09120000050', CURRENT_TIMESTAMP),
('test051@student.com', '$2b$10$dummyhash', 'Test Student 051', 'Test', 'Student', 'YY', 'Male', 'student', 'active', '09120000051', CURRENT_TIMESTAMP),
('test052@student.com', '$2b$10$dummyhash', 'Test Student 052', 'Test', 'Student', 'ZZ', 'Female', 'student', 'active', '09120000052', CURRENT_TIMESTAMP),
('test053@student.com', '$2b$10$dummyhash', 'Test Student 053', 'Test', 'Student', 'AAA', 'Male', 'student', 'active', '09120000053', CURRENT_TIMESTAMP),
('test054@student.com', '$2b$10$dummyhash', 'Test Student 054', 'Test', 'Student', 'BBB', 'Female', 'student', 'active', '09120000054', CURRENT_TIMESTAMP),
('test055@student.com', '$2b$10$dummyhash', 'Test Student 055', 'Test', 'Student', 'CCC', 'Male', 'student', 'active', '09120000055', CURRENT_TIMESTAMP),
('test056@student.com', '$2b$10$dummyhash', 'Test Student 056', 'Test', 'Student', 'DDD', 'Female', 'student', 'active', '09120000056', CURRENT_TIMESTAMP),
('test057@student.com', '$2b$10$dummyhash', 'Test Student 057', 'Test', 'Student', 'EEE', 'Male', 'student', 'active', '09120000057', CURRENT_TIMESTAMP),
('test058@student.com', '$2b$10$dummyhash', 'Test Student 058', 'Test', 'Student', 'FFF', 'Female', 'student', 'active', '09120000058', CURRENT_TIMESTAMP),
('test059@student.com', '$2b$10$dummyhash', 'Test Student 059', 'Test', 'Student', 'GGG', 'Male', 'student', 'active', '09120000059', CURRENT_TIMESTAMP),
('test060@student.com', '$2b$10$dummyhash', 'Test Student 060', 'Test', 'Student', 'HHH', 'Female', 'student', 'active', '09120000060', CURRENT_TIMESTAMP),
('test061@student.com', '$2b$10$dummyhash', 'Test Student 061', 'Test', 'Student', 'III', 'Male', 'student', 'active', '09120000061', CURRENT_TIMESTAMP),
('test062@student.com', '$2b$10$dummyhash', 'Test Student 062', 'Test', 'Student', 'JJJ', 'Female', 'student', 'active', '09120000062', CURRENT_TIMESTAMP),
('test063@student.com', '$2b$10$dummyhash', 'Test Student 063', 'Test', 'Student', 'KKK', 'Male', 'student', 'active', '09120000063', CURRENT_TIMESTAMP),
('test064@student.com', '$2b$10$dummyhash', 'Test Student 064', 'Test', 'Student', 'LLL', 'Female', 'student', 'active', '09120000064', CURRENT_TIMESTAMP),
('test065@student.com', '$2b$10$dummyhash', 'Test Student 065', 'Test', 'Student', 'MMM', 'Male', 'student', 'active', '09120000065', CURRENT_TIMESTAMP),
('test066@student.com', '$2b$10$dummyhash', 'Test Student 066', 'Test', 'Student', 'NNN', 'Female', 'student', 'active', '09120000066', CURRENT_TIMESTAMP),
('test067@student.com', '$2b$10$dummyhash', 'Test Student 067', 'Test', 'Student', 'OOO', 'Male', 'student', 'active', '09120000067', CURRENT_TIMESTAMP),
('test068@student.com', '$2b$10$dummyhash', 'Test Student 068', 'Test', 'Student', 'PPP', 'Female', 'student', 'active', '09120000068', CURRENT_TIMESTAMP),
('test069@student.com', '$2b$10$dummyhash', 'Test Student 069', 'Test', 'Student', 'QQQ', 'Male', 'student', 'active', '09120000069', CURRENT_TIMESTAMP),
('test070@student.com', '$2b$10$dummyhash', 'Test Student 070', 'Test', 'Student', 'RRR', 'Female', 'student', 'active', '09120000070', CURRENT_TIMESTAMP),
('test071@student.com', '$2b$10$dummyhash', 'Test Student 071', 'Test', 'Student', 'SSS', 'Male', 'student', 'active', '09120000071', CURRENT_TIMESTAMP),
('test072@student.com', '$2b$10$dummyhash', 'Test Student 072', 'Test', 'Student', 'TTT', 'Female', 'student', 'active', '09120000072', CURRENT_TIMESTAMP),
('test073@student.com', '$2b$10$dummyhash', 'Test Student 073', 'Test', 'Student', 'UUU', 'Male', 'student', 'active', '09120000073', CURRENT_TIMESTAMP),
('test074@student.com', '$2b$10$dummyhash', 'Test Student 074', 'Test', 'Student', 'VVV', 'Female', 'student', 'active', '09120000074', CURRENT_TIMESTAMP),
('test075@student.com', '$2b$10$dummyhash', 'Test Student 075', 'Test', 'Student', 'WWW', 'Male', 'student', 'active', '09120000075', CURRENT_TIMESTAMP),
('test076@student.com', '$2b$10$dummyhash', 'Test Student 076', 'Test', 'Student', 'XXX', 'Female', 'student', 'active', '09120000076', CURRENT_TIMESTAMP),
('test077@student.com', '$2b$10$dummyhash', 'Test Student 077', 'Test', 'Student', 'YYY', 'Male', 'student', 'active', '09120000077', CURRENT_TIMESTAMP),
('test078@student.com', '$2b$10$dummyhash', 'Test Student 078', 'Test', 'Student', 'ZZZ', 'Female', 'student', 'active', '09120000078', CURRENT_TIMESTAMP),
('test079@student.com', '$2b$10$dummyhash', 'Test Student 079', 'Test', 'Student', 'AAAA', 'Male', 'student', 'active', '09120000079', CURRENT_TIMESTAMP),
('test080@student.com', '$2b$10$dummyhash', 'Test Student 080', 'Test', 'Student', 'BBBB', 'Female', 'student', 'active', '09120000080', CURRENT_TIMESTAMP),
('test081@student.com', '$2b$10$dummyhash', 'Test Student 081', 'Test', 'Student', 'CCCC', 'Male', 'student', 'active', '09120000081', CURRENT_TIMESTAMP),
('test082@student.com', '$2b$10$dummyhash', 'Test Student 082', 'Test', 'Student', 'DDDD', 'Female', 'student', 'active', '09120000082', CURRENT_TIMESTAMP),
('test083@student.com', '$2b$10$dummyhash', 'Test Student 083', 'Test', 'Student', 'EEEE', 'Male', 'student', 'active', '09120000083', CURRENT_TIMESTAMP),
('test084@student.com', '$2b$10$dummyhash', 'Test Student 084', 'Test', 'Student', 'FFFF', 'Female', 'student', 'active', '09120000084', CURRENT_TIMESTAMP),
('test085@student.com', '$2b$10$dummyhash', 'Test Student 085', 'Test', 'Student', 'GGGG', 'Male', 'student', 'active', '09120000085', CURRENT_TIMESTAMP),
('test086@student.com', '$2b$10$dummyhash', 'Test Student 086', 'Test', 'Student', 'HHHH', 'Female', 'student', 'active', '09120000086', CURRENT_TIMESTAMP),
('test087@student.com', '$2b$10$dummyhash', 'Test Student 087', 'Test', 'Student', 'IIII', 'Male', 'student', 'active', '09120000087', CURRENT_TIMESTAMP),
('test088@student.com', '$2b$10$dummyhash', 'Test Student 088', 'Test', 'Student', 'JJJJ', 'Female', 'student', 'active', '09120000088', CURRENT_TIMESTAMP),
('test089@student.com', '$2b$10$dummyhash', 'Test Student 089', 'Test', 'Student', 'KKKK', 'Male', 'student', 'active', '09120000089', CURRENT_TIMESTAMP),
('test090@student.com', '$2b$10$dummyhash', 'Test Student 090', 'Test', 'Student', 'LLLL', 'Female', 'student', 'active', '09120000090', CURRENT_TIMESTAMP),
('test091@student.com', '$2b$10$dummyhash', 'Test Student 091', 'Test', 'Student', 'MMMM', 'Male', 'student', 'active', '09120000091', CURRENT_TIMESTAMP),
('test092@student.com', '$2b$10$dummyhash', 'Test Student 092', 'Test', 'Student', 'NNNN', 'Female', 'student', 'active', '09120000092', CURRENT_TIMESTAMP),
('test093@student.com', '$2b$10$dummyhash', 'Test Student 093', 'Test', 'Student', 'OOOO', 'Male', 'student', 'active', '09120000093', CURRENT_TIMESTAMP),
('test094@student.com', '$2b$10$dummyhash', 'Test Student 094', 'Test', 'Student', 'PPPP', 'Female', 'student', 'active', '09120000094', CURRENT_TIMESTAMP),
('test095@student.com', '$2b$10$dummyhash', 'Test Student 095', 'Test', 'Student', 'QQQQ', 'Male', 'student', 'active', '09120000095', CURRENT_TIMESTAMP),
('test096@student.com', '$2b$10$dummyhash', 'Test Student 096', 'Test', 'Student', 'RRRR', 'Female', 'student', 'active', '09120000096', CURRENT_TIMESTAMP),
('test097@student.com', '$2b$10$dummyhash', 'Test Student 097', 'Test', 'Student', 'SSSS', 'Male', 'student', 'active', '09120000097', CURRENT_TIMESTAMP),
('test098@student.com', '$2b$10$dummyhash', 'Test Student 098', 'Test', 'Student', 'TTTT', 'Female', 'student', 'active', '09120000098', CURRENT_TIMESTAMP),
('test099@student.com', '$2b$10$dummyhash', 'Test Student 099', 'Test', 'Student', 'UUUU', 'Male', 'student', 'active', '09120000099', CURRENT_TIMESTAMP),
('test100@student.com', '$2b$10$dummyhash', 'Test Student 100', 'Test', 'Student', 'VVVV', 'Female', 'student', 'active', '09120000100', CURRENT_TIMESTAMP);

-- Create enrollments for all test students with 'enrolled' status
INSERT INTO public.enrollments (
  student_id, status, admission_type, last_name, first_name, middle_name,
  sex, email, contact_number, birth_date, region, province, city,
  barangay, home_address, father_last_name, father_first_name,
  mother_last_name, mother_first_name, preferred_track, year_level,
  submitted_at, approved_at, created_at
)
SELECT
  u.id, 'enrolled', 'New Student', u.last_name, u.first_name, u.middle_name,
  u.sex, u.email, u.contact_number,
  (CURRENT_DATE - INTERVAL '18 years' + (random() * INTERVAL '2 years'))::date,
  'NCR', 'Metro Manila', 'Quezon City', 'Test Barangay',
  '123 Test Street, Test Barangay, Quezon City',
  'TestFather', 'Father' || RIGHT(u.email, 3),
  'TestMother', 'Mother' || RIGHT(u.email, 3),
  CASE WHEN random() < 0.5 THEN 'STEM' ELSE 'HUMSS' END,
  'Grade 11', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM public.users u
WHERE u.email LIKE 'test%@student.com' AND u.role = 'student';

-- Verification queries
SELECT 'Users created:' as info, COUNT(*) as count FROM public.users WHERE email LIKE 'test%@student.com';
SELECT 'Enrollments created:' as info, COUNT(*) as count FROM public.enrollments WHERE status = 'enrolled' AND student_id IN (SELECT id FROM public.users WHERE email LIKE 'test%@student.com');
SELECT 'Section assignments (should be 0):' as info, COUNT(*) as count FROM public.section_assignments WHERE enrollment_id IN (SELECT id FROM public.enrollments WHERE status = 'enrolled' AND student_id IN (SELECT id FROM public.users WHERE email LIKE 'test%@student.com'));</content>
<parameter name="filePath">c:\Users\USER\Downloads\electron-hub-main (2)\electron-hub-main\create_test_students_corrected.sql