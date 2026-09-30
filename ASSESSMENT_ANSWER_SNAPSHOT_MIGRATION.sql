-- Adds immutable answer snapshots for newly submitted assessments.
-- Existing answer values were not persisted in assessment_results, so historical
-- student choices cannot be reconstructed reliably after question edits.
ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS answer_snapshots JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Safe/idempotent backfill: preserve rows as explicitly unbackfillable rather
-- than inventing answers from current questions or aggregate scores.
UPDATE assessment_results
SET answer_snapshots = '[]'::jsonb
WHERE answer_snapshots IS NULL;