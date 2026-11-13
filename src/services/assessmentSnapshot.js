const RIASEC_TYPES = [
  'Realistic',
  'Investigative',
  'Artistic',
  'Social',
  'Enterprising',
  'Conventional',
];

const RIASEC_TYPE_BY_CODE = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

function getInterestType(question = {}) {
  const type = question.interestType || question.interest_type || question.category;
  return RIASEC_TYPES.includes(type) ? type : RIASEC_TYPE_BY_CODE[type] || null;
}

export function isInterestAnswerSnapshot(snapshot = {}) {
  return snapshot.category === 'Interests' ||
    snapshot.category === 'Interest' ||
    Boolean(getInterestType(snapshot));
}

const normalizeAnswer = (answers, questionId) => {
  const value = answers?.[questionId] ?? answers?.[String(questionId)];
  return Number.isInteger(value) ? value : null;
};

const getLikertRating = (answer) => (
  Number.isInteger(answer) && answer >= 1 && answer <= 5 ? answer : null
);

const getLikertChoiceIndex = (options, rating) => {
  if (rating === null) return null;

  // The persisted answer for an interest question is its 1–5 rating, not an
  // options-array index. Prefer the label's explicit value so this continues
  // to work if labels are reordered in the question editor.
  const labelledIndex = options.findIndex((option) =>
    new RegExp(`^\\s*${rating}\\s*(?:-|\\.|:|\\))?\\s*`).test(String(option))
  );

  return labelledIndex >= 0
    ? labelledIndex
    : rating - 1 < options.length
      ? rating - 1
      : null;
};

const createChoiceId = (questionId, option, occurrence) => {
  const normalizedOption = String(option || '').trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalizedOption.length; index += 1) {
    hash = (hash * 31 + normalizedOption.charCodeAt(index)) >>> 0;
  }

  return `question-${questionId}-choice-${hash.toString(36)}-${occurrence}`;
};

export function buildAssessmentAnswerSnapshots(answers = {}, questionsByCategory = {}) {
  return Object.values(questionsByCategory)
    .flat()
    .map((question, questionIndex) => {
      const options = Array.isArray(question.options) ? question.options : [];
      const submittedChoiceIndex = normalizeAnswer(answers, question.id);
      const isInterestQuestion = isInterestAnswerSnapshot(question);
      const selectedRating = isInterestQuestion ? getLikertRating(submittedChoiceIndex) : null;
      const selectedChoiceIndex = isInterestQuestion
        ? getLikertChoiceIndex(options, selectedRating)
        : submittedChoiceIndex !== null &&
            submittedChoiceIndex >= 0 &&
            submittedChoiceIndex < options.length
          ? submittedChoiceIndex
          : null;
      const choiceOccurrences = new Map();
      const choices = options.map((text, optionIndex) => {
        const normalizedText = String(text || '');
        const occurrence = choiceOccurrences.get(normalizedText) || 0;
        choiceOccurrences.set(normalizedText, occurrence + 1);

        return {
          id: createChoiceId(question.id, normalizedText, occurrence),
          text: normalizedText,
          letter: String.fromCharCode(65 + optionIndex),
        };
      });
      const selectedChoice = selectedChoiceIndex !== null ? choices[selectedChoiceIndex] : null;
      const correctAnswer = Number.isInteger(question.correctAnswer)
        ? question.correctAnswer
        : Number.isInteger(question.correct_answer)
          ? question.correct_answer
          : null;
      const correctChoice = correctAnswer !== null ? choices[correctAnswer] : null;

      return {
        questionId: question.id,
        questionNumber: questionIndex + 1,
        questionText: question.question,
        category: isInterestQuestion ? 'Interests' : question.category,
        interestType: getInterestType(question),
        choices,
        selectedChoiceId: selectedChoice?.id || null,
        selectedChoiceText: selectedChoice?.text || null,
        selectedChoiceLetter: selectedChoice?.letter || null,
        selectedChoiceIndex,
        selectedRating,
        correctAnswer,
        correctChoiceId: correctChoice?.id || null,
        correctAnswerText: correctChoice?.text || null,
        correctAnswerLetter: correctChoice?.letter || null,
        isCorrect: selectedChoiceIndex !== null && correctAnswer !== null
          ? selectedChoiceIndex === correctAnswer
          : null,
      };
    });
}
