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
      const selectedChoiceIndex = normalizeAnswer(answers, question.id);
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
        category: question.category,
        interestType: question.interestType || question.interest_type || null,
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