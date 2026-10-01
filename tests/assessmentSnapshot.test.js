import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAssessmentAnswerSnapshots } from '../src/services/assessmentSnapshot.js';

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