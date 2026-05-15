-- Public assessment saves now reuse assessment_results.
-- Run this against existing Supabase projects that were created before this update.

ALTER TABLE assessment_results
  ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS public_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS public_full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS public_linked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE assessment_results
  DROP CONSTRAINT IF EXISTS assessment_results_source_check;

ALTER TABLE assessment_results
  ADD CONSTRAINT assessment_results_source_check
  CHECK (source IN ('student', 'public'));

ALTER TABLE assessment_results
  DROP CONSTRAINT IF EXISTS assessment_results_owner_check;

ALTER TABLE assessment_results
  ADD CONSTRAINT assessment_results_owner_check
  CHECK (student_id IS NOT NULL OR public_email IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_assessment_results_public_email
  ON assessment_results(public_email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_results_pending_public_email
  ON assessment_results(public_email)
  WHERE public_email IS NOT NULL AND student_id IS NULL;
