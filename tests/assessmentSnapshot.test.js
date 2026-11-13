import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAssessmentAnswerSnapshots,
  isInterestAnswerSnapshot,
} from '../src/services/assessmentSnapshot.js';
import {
  canViewAssessmentAnswers,
  getAssessmentResultTable,
} from '../src/services/assessmentAnswersVisibility.js';
import { calculateRiasecScores } from '../src/utils/electiveRecommendationScoring.js';

test('freezes the submitted choice when a question is edited repeatedly', () => {
  const originalQuestion = {
    id: 16,
    question: 'Original Q16',
    options: ['A', 'B', 'C'],
    correctAnswer: 0,
    category: 'Logical',
  };
  const snapshot = buildAssessmentAnswerSnapshots({ 16: 0 }, { Logical: [originalQuestion] })[0];

  const editedQuestion = {
    ...originalQuestion,
    question: 'Edited Q16',
    options: ['B', 'C', 'A'],
    correctAnswer: 1,
  };
  const editedAgain = { ...editedQuestion, correctAnswer: 2, options: ['C', 'A', 'B'] };

  assert.equal(snapshot.selectedChoiceId, 'question-16-choice-2p-0');
  assert.equal(snapshot.selectedChoiceText, 'A');
  assert.equal(snapshot.selectedChoiceLetter, 'A');
  assert.equal(snapshot.questionText, 'Original Q16');
  assert.equal(snapshot.correctAnswerText, 'A');
  assert.equal(snapshot.isCorrect, true);
  assert.notEqual(editedQuestion.correctAnswer, snapshot.correctAnswer);
  assert.notEqual(editedAgain.options[editedAgain.correctAnswer], snapshot.selectedChoiceText);
});

test('includes unanswered questions without inventing a response', () => {
  const [snapshot] = buildAssessmentAnswerSnapshots({}, {
    Verbal: [{ id: 1, question: 'Q1', options: ['A', 'B'], correctAnswer: 0, category: 'Verbal' }],
  });

  assert.equal(snapshot.selectedChoiceId, null);
  assert.equal(snapshot.selectedChoiceText, null);
  assert.equal(snapshot.isCorrect, null);
});

test('preserves selected interest options and normalizes RIASEC category aliases', () => {
  const snapshots = buildAssessmentAnswerSnapshots(
    { 101: 4, 202: 1 },
    {
      R: [{
        id: 101,
        question: 'I enjoy hands-on work.',
        options: [
          '1 - Strongly Disagree',
          '2 - Disagree',
          '3 - Neutral',
          '4 - Agree',
          '5 - Strongly Agree',
        ],
        category: 'R',
      }],
      Interests: [{
        id: 202,
        question: 'I enjoy solving problems.',
        options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
        category: 'Interests',
        interest_type: 'Investigative',
      }],
    }
  );

  assert.equal(snapshots.length, 2);
  assert.deepEqual(snapshots.map(({ category }) => category), ['Interests', 'Interests']);
  assert.deepEqual(snapshots.map(({ interestType }) => interestType), ['Realistic', 'Investigative']);
  assert.deepEqual(snapshots.map(({ selectedChoiceIndex }) => selectedChoiceIndex), [4, 1]);
  assert.deepEqual(
    snapshots.map(({ selectedChoiceText }) => selectedChoiceText),
    ['5 - Strongly Agree', '2 - Disagree']
  );
  assert.ok(snapshots.every(isInterestAnswerSnapshot));
});

test('does not record an out-of-range answer as a selected option', () => {
  const [snapshot] = buildAssessmentAnswerSnapshots({ 7: 5 }, {
    Interests: [{
      id: 7,
      question: 'Interest question',
      options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
      category: 'Interests',
      interestType: 'Artistic',
    }],
  });

  assert.equal(snapshot.selectedChoiceIndex, null);
  assert.equal(snapshot.selectedChoiceId, null);
  assert.equal(snapshot.selectedChoiceText, null);
});

test('recognizes typed legacy interest snapshots', () => {
  assert.equal(isInterestAnswerSnapshot({ category: 'Realistic' }), true);
  assert.equal(isInterestAnswerSnapshot({ category: 'R' }), true);
});

test('keeps saved interest choices aligned with the existing RIASEC scoring inputs', () => {
  const questions = [
    {
      id: 11,
      question: 'Hands-on work',
      options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
      category: 'Interests',
      interest_type: 'Realistic',
    },
    {
      id: 22,
      question: 'Research',
      options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
      category: 'Interests',
      interest_type: 'Investigative',
    },
  ];
  const answers = { 11: 0, 22: 4 };
  const snapshots = buildAssessmentAnswerSnapshots(answers, { Interests: questions });
  const scores = calculateRiasecScores(answers, questions);

  assert.deepEqual(
    snapshots.map(({ selectedChoiceText }) => selectedChoiceText),
    ['1 - Strongly Disagree', '5 - Strongly Agree']
  );
  assert.equal(scores.Realistic, 20);
  assert.equal(scores.Investigative, 100);
});

test('assessment answer visibility follows only the persisted admin setting', () => {
  assert.equal(
    canViewAssessmentAnswers({ source: 'supabase', data: { assessment_answers_visible: true } }),
    true
  );
  assert.equal(
    canViewAssessmentAnswers({ source: 'supabase', data: { assessment_answers_visible: false } }),
    false
  );
  assert.equal(
    canViewAssessmentAnswers({ source: 'local', data: { assessment_answers_visible: true } }),
    false
  );
  assert.equal(canViewAssessmentAnswers(null), false);
  assert.equal(getAssessmentResultTable(true), 'assessment_results');
  assert.equal(getAssessmentResultTable(false), 'student_assessment_result_summary');
});