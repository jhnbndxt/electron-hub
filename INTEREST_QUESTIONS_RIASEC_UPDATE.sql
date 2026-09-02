-- ============================================================================
-- RIASEC Interest Questions Migration
-- ============================================================================
-- This migration updates the interest questions to use explicit RIASEC types
-- ============================================================================

-- First, delete existing generic interest questions to make room for new ones
DELETE FROM assessment_questions WHERE category = 'Interests';

-- Insert new RIASEC-based interest questions
-- Each question is a Likert-scale statement (1-5 agreement) with interest_type
-- correct_answer is NULL because these are interest/preference questions, not knowledge-based

-- REALISTIC (R) - Questions 1-3
INSERT INTO assessment_questions (question, options, correct_answer, category, interest_type)
VALUES
('I enjoy repairing, assembling, or troubleshooting objects or equipment.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Realistic'),
('I enjoy building, creating, or working on practical projects.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Realistic'),
('I prefer activities that involve using tools, equipment, or technology to complete a task.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Realistic'),

-- INVESTIGATIVE (I) - Questions 4-6
('I enjoy solving problems that require research, analysis, or critical thinking.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Investigative'),
('I am interested in conducting scientific activities, experiments, or investigations.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Investigative'),
('I enjoy working with computers, technology, programming, or understanding how systems work.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Investigative'),

-- ARTISTIC (A) - Questions 7-9
('I enjoy creating designs, illustrations, or other visual outputs.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Artistic'),
('I enjoy expressing my ideas through writing, storytelling, or other creative activities.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Artistic'),
('I am interested in multimedia, music, video editing, or creative production.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Artistic'),

-- SOCIAL (S) - Questions 10-12
('I enjoy helping, assisting, or supporting other people.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Social'),
('I enjoy sharing knowledge, teaching, or explaining things to others.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Social'),
('I enjoy working with people and helping them solve their problems.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Social'),

-- ENTERPRISING (E) - Questions 13-15
('I feel confident leading teams or managing group activities.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Enterprising'),
('I am interested in business, entrepreneurship, or starting my own project.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Enterprising'),
('I enjoy persuading, motivating, or influencing others to achieve a goal.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Enterprising'),

-- CONVENTIONAL (C) - Questions 16-18
('I enjoy organizing files, schedules, or structured information.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Conventional'),
('I prefer tasks that involve following clear procedures and organized steps.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Conventional'),
('I enjoy working with records, data, or information that needs to be arranged accurately.', '["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]', NULL, 'Interests', 'Conventional')
ON CONFLICT DO NOTHING;

-- Verify the update
SELECT interest_type, COUNT(*) as question_count 
FROM assessment_questions 
WHERE category = 'Interests' 
GROUP BY interest_type 
ORDER BY interest_type;
