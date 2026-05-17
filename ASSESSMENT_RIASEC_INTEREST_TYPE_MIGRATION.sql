-- Adds a RIASEC type to Interest questions so Assessment Management can drive
-- the recommendation formula instead of relying only on fixed question order.

ALTER TABLE assessment_questions
  ADD COLUMN IF NOT EXISTS interest_type VARCHAR(20);

ALTER TABLE assessment_questions
  DROP CONSTRAINT IF EXISTS assessment_questions_interest_type_check;

ALTER TABLE assessment_questions
  ADD CONSTRAINT assessment_questions_interest_type_check
  CHECK (
    interest_type IS NULL OR interest_type IN (
      'Realistic',
      'Investigative',
      'Artistic',
      'Social',
      'Enterprising',
      'Conventional'
    )
  );

WITH ordered_interests AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY id) AS interest_position
  FROM assessment_questions
  WHERE category = 'Interests'
)
UPDATE assessment_questions AS question
SET
  question = CASE ordered_interests.interest_position
    WHEN 1 THEN 'I enjoy working with numbers and solving mathematical problems.'
    WHEN 2 THEN 'I am interested in conducting scientific activities or experiments.'
    WHEN 3 THEN 'I feel confident when speaking or presenting in front of other people.'
    WHEN 4 THEN 'I enjoy creating designs, illustrations, or artistic outputs.'
    WHEN 5 THEN 'I like helping, assisting, or supporting other people.'
    WHEN 6 THEN 'I am interested in business-related tasks and entrepreneurship activities.'
    WHEN 7 THEN 'I enjoy working with computers, technology, or programming tasks.'
    WHEN 8 THEN 'I like repairing, assembling, or troubleshooting objects or equipment.'
    WHEN 9 THEN 'I enjoy expressing ideas through writing or communication activities.'
    WHEN 10 THEN 'I prefer organizing files, schedules, or structured information.'
    WHEN 11 THEN 'I enjoy leading teams or managing group activities.'
    WHEN 12 THEN 'I am interested in nature, environmental topics, or scientific discoveries.'
    WHEN 13 THEN 'I enjoy sharing knowledge or teaching others.'
    WHEN 14 THEN 'I am interested in multimedia, music, video editing, or creative production.'
    WHEN 15 THEN 'I enjoy building, designing, or developing practical projects.'
    ELSE question.question
  END,
  options = '[
    "5 - Strongly Agree",
    "4 - Agree",
    "3 - Neutral",
    "2 - Disagree",
    "1 - Strongly Disagree"
  ]'::jsonb,
  correct_answer = NULL,
  interest_type = CASE ordered_interests.interest_position
    WHEN 1 THEN 'Investigative'
    WHEN 2 THEN 'Investigative'
    WHEN 3 THEN 'Enterprising'
    WHEN 4 THEN 'Artistic'
    WHEN 5 THEN 'Social'
    WHEN 6 THEN 'Enterprising'
    WHEN 7 THEN 'Investigative'
    WHEN 8 THEN 'Realistic'
    WHEN 9 THEN 'Artistic'
    WHEN 10 THEN 'Conventional'
    WHEN 11 THEN 'Enterprising'
    WHEN 12 THEN 'Investigative'
    WHEN 13 THEN 'Social'
    WHEN 14 THEN 'Artistic'
    WHEN 15 THEN 'Realistic'
    ELSE question.interest_type
  END,
  updated_at = CURRENT_TIMESTAMP
FROM ordered_interests
WHERE question.id = ordered_interests.id
  AND ordered_interests.interest_position <= 15;
