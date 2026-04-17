-- ============================================================================
-- ELECTRON HUB - SUPABASE/PostgreSQL Schema
-- ============================================================================
-- This schema converts the current localStorage data structure to a 
-- relational database suitable for Supabase
-- ============================================================================

-- ============================================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  profile_picture_url TEXT,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'registrar', 'branchcoordinator', 'cashier', 'superadmin')),
  admin_type VARCHAR(50) CHECK (admin_type IN ('registrar', 'branchcoordinator', 'cashier')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 2. ENROLLMENTS
-- ============================================================================

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled', 'dropped')),
  
  -- Page 1: Basic Information
  admission_type VARCHAR(50) NOT NULL,
  previous_student_id VARCHAR(50),
  lrn VARCHAR(50),
  is_working_student BOOLEAN DEFAULT FALSE,
  
  -- Personal Information
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  suffix VARCHAR(50) DEFAULT 'None',
  sex VARCHAR(20),
  civil_status VARCHAR(50),
  religion VARCHAR(100),
  nationality VARCHAR(100) DEFAULT 'Filipino',
  disability VARCHAR(100) DEFAULT 'Not Applicable',
  disability_other VARCHAR(255),
  indigenous_group VARCHAR(100) DEFAULT 'Not Applicable',
  indigenous_group_other VARCHAR(255),
  
  -- Contact Information
  birth_date DATE,
  email VARCHAR(255),
  contact_number VARCHAR(20),
  facebook_name VARCHAR(255),
  
  -- Page 2: Address
  region VARCHAR(100),
  province VARCHAR(100),
  city VARCHAR(100),
  barangay VARCHAR(100),
  home_address TEXT,
  
  -- Page 3: Parents/Guardians
  father_last_name VARCHAR(100),
  father_first_name VARCHAR(100),
  father_middle_name VARCHAR(100),
  father_occupation VARCHAR(100),
  father_contact VARCHAR(20),
  
  mother_maiden_name VARCHAR(100),
  mother_last_name VARCHAR(100),
  mother_first_name VARCHAR(100),
  mother_middle_name VARCHAR(100),
  mother_occupation VARCHAR(100),
  mother_contact VARCHAR(20),
  
  guardian_source VARCHAR(100),
  guardian_last_name VARCHAR(100),
  guardian_first_name VARCHAR(100),
  guardian_middle_name VARCHAR(100),
  guardian_occupation VARCHAR(100),
  guardian_contact VARCHAR(20),
  
  is_4ps_member BOOLEAN DEFAULT FALSE,
  
  -- Page 4: Enrollment Information
  preferred_track VARCHAR(100),
  elective_1 VARCHAR(100),
  elective_2 VARCHAR(100),
  year_level VARCHAR(50),
  
  -- Page 5: Educational Background
  primary_school VARCHAR(255),
  primary_year_graduated YEAR,
  secondary_school VARCHAR(255),
  secondary_year_graduated YEAR,
  grade_10_adviser VARCHAR(255),
  
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_submitted_at ON enrollments(submitted_at);

-- ============================================================================
-- 3. ENROLLMENT DOCUMENTS
-- ============================================================================

CREATE TABLE enrollment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL CHECK (document_type IN ('form138', 'form137', 'goodMoral', 'birthCertificate', 'idPicture', 'diploma', 'escCertificate')),
  file_path VARCHAR(500),
  file_url VARCHAR(500),
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_enrollment_documents_enrollment_id ON enrollment_documents(enrollment_id);
CREATE INDEX idx_enrollment_documents_type ON enrollment_documents(document_type);

-- ============================================================================
-- 4. ENROLLMENT PROGRESS TRACKING
-- ============================================================================

CREATE TABLE enrollment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'current', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enrollment_progress_student_id ON enrollment_progress(student_id);
CREATE UNIQUE INDEX idx_enrollment_progress_unique ON enrollment_progress(student_id, step_name);

-- ============================================================================
-- 5. AI ASSESSMENT RESULTS
-- ============================================================================

CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  
  -- Results
  recommended_track VARCHAR(100),
  elective_1 VARCHAR(100),
  elective_2 VARCHAR(100),
  
  -- Scores (0-100)
  verbal_ability_score SMALLINT CHECK (verbal_ability_score >= 0 AND verbal_ability_score <= 100),
  mathematical_ability_score SMALLINT CHECK (mathematical_ability_score >= 0 AND mathematical_ability_score <= 100),
  spatial_ability_score SMALLINT CHECK (spatial_ability_score >= 0 AND spatial_ability_score <= 100),
  logical_reasoning_score SMALLINT CHECK (logical_reasoning_score >= 0 AND logical_reasoning_score <= 100),
  overall_score SMALLINT CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Analysis
  top_domains JSONB, -- Array of strings
  top_interests JSONB, -- Array of strings
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_results_student_id ON assessment_results(student_id);
CREATE INDEX idx_assessment_results_date ON assessment_results(assessment_date);

-- ============================================================================
-- 5.5 ASSESSMENT QUESTIONS (FLEXIBLE - ANY NUMBER OF QUESTIONS)
-- ============================================================================

CREATE TABLE assessment_questions (
  id BIGSERIAL PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer SMALLINT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Verbal', 'Math', 'Science', 'Logical', 'Interests')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for category grouping (needed for dynamic scoring)
CREATE INDEX idx_assessment_questions_category ON assessment_questions(category);

-- Table to track question count per category for scoring calculations
CREATE TABLE assessment_question_stats (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) UNIQUE NOT NULL,
  question_count SMALLINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update question counts when questions are added/removed
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO assessment_question_stats (category, question_count)
  SELECT category, COUNT(*) FROM assessment_questions GROUP BY category
  ON CONFLICT (category) DO UPDATE SET
    question_count = EXCLUDED.question_count,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_questions_stats_trigger
AFTER INSERT OR DELETE ON assessment_questions
FOR EACH STATEMENT EXECUTE FUNCTION update_question_stats();

-- Insert comprehensive assessment questions (75 total - can be expanded anytime)
INSERT INTO assessment_questions (question, options, correct_answer, category) 
VALUES
-- VERBAL (15 questions)
('rapid = ?', '["slow", "fast", "weak", "late"]', 1, 'Verbal'),
('assist = ?', '["help", "ignore", "stop", "delay"]', 0, 'Verbal'),
('She _ to school', '["go", "goes", "going", "gone"]', 1, 'Verbal'),
('Correct sentence', '["He don''t like math", "He doesn''t likes math", "He doesn''t like math", "He not like math"]', 2, 'Verbal'),
('"Technology helps students learn faster" - Main idea?', '["dislike", "improves learning", "difficult", "lazy"]', 1, 'Verbal'),
('Teacher : School :: Doctor : _', '["medicine", "hospital", "patient", "clinic"]', 1, 'Verbal'),
('Opposite of increase', '["reduce", "expand", "grow", "rise"]', 0, 'Verbal'),
('They _ dinner', '["eat", "eats", "ate", "eating"]', 2, 'Verbal'),
('Incorrect sentence', '["She sings well", "They plays outside", "We study", "I read"]', 1, 'Verbal'),
('manageable = ?', '["impossible", "easy", "controllable", "useless"]', 2, 'Verbal'),
('Which word is spelled correctly?', '["accomodate", "accommodate", "acommodate", "acomodate"]', 1, 'Verbal'),
('What does "ambiguous" mean?', '["clear", "unclear", "definite", "obvious"]', 1, 'Verbal'),
('Find the synonym of "fortunate"', '["lucky", "unlucky", "smart", "rich"]', 0, 'Verbal'),
('Complete: "The cake taste__"', '["good", "goods", "goodly", "goodness"]', 0, 'Verbal'),
('Which is a complete sentence?', '["Running fast", "The dog runs", "Because of rain", "Such a beautiful"]', 1, 'Verbal'),

-- MATH (15 questions)
('2 + 2 = ?', '["3", "4", "5", "6"]', 1, 'Math'),
('5 × 6 = ?', '["25", "30", "35", "40"]', 1, 'Math'),
('100 ÷ 5 = ?', '["15", "20", "25", "30"]', 1, 'Math'),
('What is 15% of 80?', '["10", "12", "15", "20"]', 1, 'Math'),
('If x + 3 = 10, then x = ?', '["5", "7", "10", "13"]', 1, 'Math'),
('What is the square of 7?', '["42", "49", "56", "63"]', 1, 'Math'),
('3² + 4² = ?', '["12", "19", "25", "34"]', 2, 'Math'),
('What is 25% of 200?', '["25", "50", "75", "100"]', 1, 'Math'),
('If 2x = 16, then x = ?', '["6", "8", "10", "12"]', 1, 'Math'),
('What is the mean of 2, 4, 6, 8?', '["4", "5", "6", "7"]', 1, 'Math'),
('12 × 11 = ?', '["120", "121", "132", "144"]', 2, 'Math'),
('What is 10% of 500?', '["25", "50", "100", "250"]', 2, 'Math'),
('If 3x - 2 = 7, then x = ?', '["2", "3", "4", "5"]', 2, 'Math'),
('What is 1/2 + 1/4?', '["1/6", "3/4", "1/3", "2/3"]', 1, 'Math'),
('99 + 1 = ?', '["98", "99", "100", "101"]', 2, 'Math'),

-- SCIENCE (15 questions)
('What is H2O?', '["Hydrogen", "Water", "Salt", "Sugar"]', 1, 'Science'),
('How many bones in human body?', '["186", "206", "226", "246"]', 1, 'Science'),
('What is photosynthesis?', '["Plant respiration", "Light energy to food", "Water absorption", "Root growth"]', 1, 'Science'),
('What is the powerhouse of the cell?', '["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"]', 1, 'Science'),
('Which planet is closest to the sun?', '["Venus", "Mercury", "Earth", "Mars"]', 1, 'Science'),
('What is the speed of light?', '["100,000 km/s", "300,000 km/s", "500,000 km/s", "1,000,000 km/s"]', 1, 'Science'),
('What is gravity?', '["Light force", "Attractive force", "Repulsive force", "Magnetic force"]', 1, 'Science'),
('How many chambers in heart?', '["2", "3", "4", "5"]', 2, 'Science'),
('What does DNA stand for?', '["Dynamic Nucleic Acid", "Deoxyribonucleic Acid", "Distributed Network Area", "Direct Nuclear Acids"]', 1, 'Science'),
('What is the largest organ?', '["Brain", "Heart", "Liver", "Skin"]', 3, 'Science'),
('Which is a renewable resource?', '["Coal", "Oil", "Solar energy", "Natural gas"]', 2, 'Science'),
('What is temperature measured in?', '["Watts", "Celsius", "Joules", "Volts"]', 1, 'Science'),
('What gas do plants absorb?', '["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"]', 2, 'Science'),
('What is an atom?', '["Smallest particle of element", "Water droplet", "Light particle", "Energy unit"]', 0, 'Science'),
('What do lungs do?', '["digest food", "help breathing", "pump blood", "filter toxins"]', 1, 'Science'),

-- LOGICAL (15 questions)
('If A > B and B > C, then?', '["A > C", "A < C", "A = C", "Cannot determine"]', 0, 'Logical'),
('Pattern: 2, 4, 6, 8, ?', '["9", "10", "11", "12"]', 1, 'Logical'),
('What comes next: A, B, C, D, ?', '["E", "F", "G", "H"]', 0, 'Logical'),
('Pattern: 1, 1, 2, 3, 5, 8, ?', '["11", "12", "13", "14"]', 2, 'Logical'),
('If all dogs are animals, and Fido is a dog, then?', '["Fido is an animal", "Fido is not an animal", "Some animals are dogs", "Cannot determine"]', 0, 'Logical'),
('Which number is odd?', '["2", "4", "6", "7"]', 3, 'Logical'),
('What is the next prime number after 7?', '["8", "9", "10", "11"]', 3, 'Logical'),
('If X = 5 and Y = 3, what is X + Y?', '["6", "8", "10", "12"]', 1, 'Logical'),
('Which shape has 4 equal sides?', '["Triangle", "Circle", "Square", "Pentagon"]', 2, 'Logical'),
('What is logical reasoning used for?', '["Solving problems", "Entertainment", "Exercise", "All of above"]', 0, 'Logical'),
('Pattern: Z, Y, X, W, ?', '["V", "U", "T", "S"]', 0, 'Logical'),
('If 3 cats catch 3 mice in 3 days, how many mice do 9 cats catch in 9 days?', '["3", "9", "27", "81"]', 2, 'Logical'),
('Which number comes next: 5, 10, 20, 40, ?', '["60", "70", "80", "90"]', 2, 'Logical'),
('If today is Monday, what day is it in 10 days?', '["Monday", "Tuesday", "Wednesday", "Thursday"]', 3, 'Logical'),
('What is 2^5?', '["16", "32", "64", "128"]', 1, 'Logical'),

-- Interest questions are checklist-based, so correct_answer stays NULL.
('Which subjects would you like to study in depth? Select all that apply.', '["Physics", "Computer Science", "Biology", "Literature"]', NULL, 'Interests'),
('What motivations matter most to you? Select all that apply.', '["Understanding theories", "Creating solutions", "Expressing ideas", "Helping communities"]', NULL, 'Interests'),
('Which environments do you enjoy most? Select all that apply.', '["Laboratory", "Workshop", "Library", "Office"]', NULL, 'Interests'),
('What types of projects interest you? Select all that apply.', '["Research projects", "Building prototypes", "Writing essays", "Organizing events"]', NULL, 'Interests'),
('Which academic areas interest you? Select all that apply.', '["STEM", "Humanities", "Business", "Arts"]', NULL, 'Interests'),
('Which themes interest you most? Select all that apply.', '["Science discovery", "Technology innovation", "Social services", "Creative expression"]', NULL, 'Interests'),
('Which career directions appeal to you? Select all that apply.', '["Researcher", "Engineer", "Doctor", "Entrepreneur"]', NULL, 'Interests'),
('Which skills would you like to strengthen? Select all that apply.', '["Technical", "Leadership", "Communication", "Problem-solving"]', NULL, 'Interests'),
('Which learning styles work best for you? Select all that apply.', '["Visual", "Auditory", "Kinesthetic", "Reading/writing"]', NULL, 'Interests'),
('Which activities excite you? Select all that apply.', '["Coding", "Designing", "Teaching", "Managing"]', NULL, 'Interests'),
('What drives your passion? Select all that apply.', '["Innovation", "Impact", "Excellence", "Security"]', NULL, 'Interests'),
('Which work environments fit you best? Select all that apply.', '["Team", "Independent", "Flexible", "Structured"]', NULL, 'Interests'),
('What kinds of problems do you enjoy? Select all that apply.', '["Mathematical", "Creative", "Practical", "Ethical"]', NULL, 'Interests'),
('Which industries interest you? Select all that apply.', '["Technology", "Healthcare", "Education", "Finance"]', NULL, 'Interests'),
('Which roles sound most like you? Select all that apply.', '["Specialist", "Generalist", "Leader", "Innovator"]', NULL, 'Interests')
ON CONFLICT DO NOTHING;

-- Initialize question stats
INSERT INTO assessment_question_stats (category, question_count)
SELECT category, COUNT(*) FROM assessment_questions GROUP BY category
ON CONFLICT (category) DO UPDATE SET question_count = EXCLUDED.question_count;

-- ============================================================================
-- 6. PAYMENTS
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank', 'gcash', 'cash')),
  amount DECIMAL(10, 2) NOT NULL,
  reference_number VARCHAR(100),
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'approved', 'rejected', 'paid')),
  
  -- For online payments (bank/gcash)
  receipt_file_path VARCHAR(500),
  receipt_file_url VARCHAR(500),
  
  -- For cash payments
  queue_number VARCHAR(50),
  queue_schedule_date DATE,
  queue_schedule_time TIME,
  
  submitted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_submitted_at ON payments(submitted_at);
CREATE UNIQUE INDEX idx_payments_student_enrollment ON payments(student_id, enrollment_id) WHERE enrollment_id IS NOT NULL AND status != 'rejected';

-- ============================================================================
-- 7. PAYMENT QUEUE (FOR IN-PERSON CASH PAYMENTS)
-- ============================================================================

CREATE TABLE payment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  queue_number VARCHAR(50) UNIQUE NOT NULL,
  queue_date DATE NOT NULL,
  queue_time TIME NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'called', 'processing', 'paid', 'no_show', 'cancelled')),
  
  amount DECIMAL(10, 2) NOT NULL DEFAULT 15000.00,
  paid_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_queue_student_id ON payment_queue(student_id);
CREATE INDEX idx_payment_queue_status ON payment_queue(status);
CREATE INDEX idx_payment_queue_date ON payment_queue(queue_date);

-- ============================================================================
-- 8. ENROLLMENTS SECTIONS (FOR SECTION MANAGEMENT)
-- ============================================================================

CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_code VARCHAR(50) UNIQUE NOT NULL,
  grade_level VARCHAR(50) NOT NULL,
  track VARCHAR(100) NOT NULL,
  adviser_id UUID REFERENCES users(id) ON DELETE SET NULL,
  capacity SMALLINT DEFAULT 50,
  
  school_year VARCHAR(9), -- e.g., "2024-2025"
  semester SMALLINT CHECK (semester IN (1, 2)),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sections_track ON sections(track);
CREATE INDEX idx_sections_grade_level ON sections(grade_level);

-- ============================================================================
-- 9. SECTION ASSIGNMENTS
-- ============================================================================

CREATE TABLE section_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'dropped')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_section_assignments_enrollment_id ON section_assignments(enrollment_id);
CREATE INDEX idx_section_assignments_section_id ON section_assignments(section_id);

-- ============================================================================
-- 10. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB, -- Additional contextual data
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- 11. AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  
  changes JSONB, -- Before/after values
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 12. ENROLLMENT DRAFTS (AUTOSAVE)
-- ============================================================================

CREATE TABLE enrollment_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  form_data JSONB NOT NULL, -- Complete form data
  current_page SMALLINT DEFAULT 1,
  
  last_saved TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_enrollment_drafts_student_id ON enrollment_drafts(student_id);
CREATE INDEX idx_enrollment_drafts_last_saved ON enrollment_drafts(last_saved);

-- ============================================================================
-- 13. TRANSCRIPT & ACADEMIC RECORDS
-- ============================================================================

CREATE TABLE academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  
  school_year VARCHAR(9) NOT NULL, -- e.g., "2024-2025"
  semester SMALLINT NOT NULL,
  
  track VARCHAR(100),
  general_average DECIMAL(5, 2),
  status VARCHAR(50) CHECK (status IN ('enrolled', 'completed', 'dropped', 'transferred')),
  
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_academic_records_student_id ON academic_records(student_id);
CREATE INDEX idx_academic_records_school_year ON academic_records(school_year);

-- ============================================================================
-- 14. SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  setting_type VARCHAR(50) CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_drafts ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid()::uuid = id);

-- Admins can view all users
CREATE POLICY users_select_admin ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
      AND u.role IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin')
    )
  );

-- Admins can update users
CREATE POLICY users_update_admin ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
      AND u.role IN ('branchcoordinator', 'superadmin')
    )
  );

-- Admins can insert users
CREATE POLICY users_insert_admin ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
      AND u.role IN ('branchcoordinator', 'superadmin')
    )
  );

-- Admins can delete users
CREATE POLICY users_delete_admin ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
      AND u.role IN ('branchcoordinator', 'superadmin')
    )
  );

-- Students can only see their own enrollment
CREATE POLICY enrollments_select_own ON enrollments FOR SELECT
  USING (auth.uid()::uuid = student_id);

-- Admins can see all enrollments
CREATE POLICY enrollments_select_admin ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid 
      AND role IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin')
    )
  );

-- Students can only insert their own enrollment
CREATE POLICY enrollments_insert_own ON enrollments FOR INSERT
  WITH CHECK (auth.uid()::uuid = student_id);

-- Admins can update enrollments
CREATE POLICY enrollments_update_admin ON enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid 
      AND role IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin')
    )
  );

-- Students can only see their own notifications
CREATE POLICY notifications_select_own ON notifications FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Students can mark their own notifications as read
CREATE POLICY notifications_update_own ON notifications FOR UPDATE
  USING (auth.uid()::uuid = user_id);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Current enrollment status for each student
CREATE VIEW student_enrollment_status AS
SELECT 
  e.id,
  e.student_id,
  u.email,
  u.full_name,
  e.status,
  e.first_name,
  e.last_name,
  e.submitted_at,
  e.approved_at,
  CASE 
    WHEN p.status = 'approved' THEN 'payment_approved'
    WHEN p.status = 'verified' THEN 'payment_verified'
    WHEN e.status = 'approved' THEN 'awaiting_payment'
    WHEN e.status = 'enrolled' THEN 'enrolled'
    ELSE 'pending_approval'
  END as overall_status
FROM enrollments e
JOIN users u ON e.student_id = u.id
LEFT JOIN payments p ON e.id = p.enrollment_id AND p.status != 'rejected';

-- Payment statistics
CREATE VIEW payment_statistics AS
SELECT 
  DATE(submitted_at) as payment_date,
  payment_method,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM payments
WHERE submitted_at IS NOT NULL
GROUP BY DATE(submitted_at), payment_method;

-- Enrollment dashboard statistics
CREATE VIEW enrollment_statistics AS
SELECT 
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'enrolled' THEN 1 END) as enrolled,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM enrollments
WHERE submitted_at >= CURRENT_DATE - INTERVAL '1 year';

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER enrollments_update_timestamp BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER enrollment_progress_update_timestamp BEFORE UPDATE ON enrollment_progress
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER assessment_results_update_timestamp BEFORE UPDATE ON assessment_results
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER payments_update_timestamp BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER payment_queue_update_timestamp BEFORE UPDATE ON payment_queue
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER enrollment_drafts_update_timestamp BEFORE UPDATE ON enrollment_drafts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- SAMPLE INITIAL DATA
-- ============================================================================

-- Insert test users (passwords should be hashed in production)
INSERT INTO users (email, password_hash, full_name, role, admin_type) VALUES
('joshua@gmail.com', 'hashed_root_password', 'Joshua Student', 'student', NULL),
('electronregistrar@gmail.com', 'hashed_registrar_password', 'Jane Registrar', 'registrar', 'registrar'),
('cashier@electron.edu.ph', 'hashed_cashier_password', 'Maria Cashier', 'cashier', 'cashier'),
('branchcoord@electron.edu.ph', 'hashed_coordinator_password', 'John Coordinator', 'branchcoordinator', 'branchcoordinator'),
('admin@electron.edu.ph', 'hashed_admin_password', 'Admin User', 'superadmin', NULL)
ON CONFLICT (email) DO NOTHING;

-- Insert sample sections
INSERT INTO sections (section_code, grade_level, track, capacity, school_year, semester) VALUES
('11A-STEM-01', '11', 'STEM', 50, '2024-2025', 1),
('11A-ABM-01', '11', 'ABM', 45, '2024-2025', 1),
('11A-HUMSS-01', '11', 'HUMSS', 48, '2024-2025', 1),
('12A-STEM-01', '12', 'STEM', 50, '2024-2025', 1)
ON CONFLICT (section_code) DO NOTHING;
