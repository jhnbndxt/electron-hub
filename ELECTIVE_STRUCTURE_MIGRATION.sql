-- Run once on existing Electron Hub databases before deploying this revision.
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS preferred_cluster VARCHAR(150);
ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS recommended_cluster VARCHAR(150);

NOTIFY pgrst, 'reload schema';

-- Existing elective values are retained for historical records. New submissions
-- must use the canonical Track -> Cluster -> Elective structure in the app.
