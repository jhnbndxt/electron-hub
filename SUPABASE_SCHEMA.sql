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
-- 5.5 ASSESSMENT QUESTIONS
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

CREATE INDEX idx_assessment_questions_category ON assessment_questions(category);

-- Insert default assessment questions
INSERT INTO assessment_questions (question, options, correct_answer, category) 
VALUES
('rapid = ?', '["slow", "fast", "weak", "late"]', 1, 'Verbal'),
('What type of activities do you enjoy most?', '["Solving problems", "Building things", "Reading/writing", "Helping others"]', 1, 'Math'),
('Which career path appeals to you?', '["Engineering", "Medicine", "Arts", "Business"]', 0, 'Verbal'),
('How do you prefer to learn?', '["Hands-on practice", "Reading/research", "Group discussions", "Visual demos"]', 0, 'Logical'),
('What is your strongest skill?', '["Analytical thinking", "Creativity", "Communication", "Technical skills"]', 3, 'Science'),
('Which subject would you like to study in depth?', '["Physics", "Computer Science", "Biology", "Literature"]', 1, 'Science'),
('What motivates you most?', '["Understanding theories", "Creating solutions", "Expressing ideas", "Helping communities"]', 1, 'Interests'),
('Which environment do you prefer?', '["Laboratory", "Workshop", "Library", "Office"]', 1, 'Science'),
('What type of projects interest you?', '["Research projects", "Building prototypes", "Writing essays", "Organizing events"]', 1, 'Interests'),
('Select your interest', '["STEM", "Humanities", "Business", "Arts"]', 0, 'Interests')
ON CONFLICT DO NOTHING;

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
