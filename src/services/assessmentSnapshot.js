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
      const selectedChoiceIndex = submittedChoiceIndex !== null &&
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
        category: isInterestAnswerSnapshot(question) ? 'Interests' : question.category,
        interestType: getInterestType(question),
        choices,
        selectedChoiceId: selectedChoice?.id || null,
        selectedChoiceText: selectedChoice?.text || null,
        selectedChoiceLetter: selectedChoice?.letter || null,
        selectedChoiceIndex,
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