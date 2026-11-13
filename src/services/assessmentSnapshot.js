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

const DEFAULT_APTITUDE_QUESTIONS = [
  ['Synonym of assist', 'Verbal', 0], ['Opposite of ancient', 'Verbal', 1], ['Book : Read = Spoon : ___', 'Verbal', 1],
  ['Correct spelling', 'Verbal', 1], ['Which does not belong?', 'Verbal', 2], ['Teacher works in a ___', 'Verbal', 1],
  ['Opposite of increase', 'Verbal', 1], ['Correct sentence', 'Verbal', 1], ['Brave means', 'Verbal', 1],
  ['Pen : Write = Knife : ___', 'Verbal', 0], ['Select noun', 'Verbal', 1], ['Observe means', 'Verbal', 0],
  ['Flowers need water. Roses are flowers. Roses need ___', 'Verbal', 1], ['12 + 8 = ?', 'Math', 1],
  ['15 x 3 = ?', 'Math', 2], ['81 / 9 = ?', 'Math', 2], ['25% of 200 = ?', 'Math', 1], ['Solve: 2x = 10', 'Math', 2],
  ['2, 4, 6, 8, __', 'Math', 1], ['7 squared = ?', 'Math', 3], ['100 - 37 = ?', 'Math', 1],
  ['3/4 of 20 = ?', 'Math', 2], ['0.5 + 0.5 = ?', 'Math', 1], ['Area of rectangle 4 x 6 = ?', 'Math', 2],
  ['9 + 6 / 3 = ?', 'Math', 2], ['5 pens cost PHP 50. One pen costs ___', 'Math', 1], ['5, 10, 15, 20, __', 'Math', 2],
  ['Perimeter of square with side 5 = ?', 'Math', 2], ['Planet we live on', 'Science', 1], ['Plants make food by', 'Science', 1],
  ['H2O is', 'Science', 2], ['Force that pulls objects down', 'Science', 0], ['Center of solar system', 'Science', 2],
  ['Organ used for breathing', 'Science', 1], ['Gas plants need', 'Science', 2], ['Boiling point of water', 'Science', 2],
  ['Largest human organ', 'Science', 2], ['Example of mammal', 'Science', 1], ['Energy from sun', 'Science', 0],
  ['Solid to liquid is called', 'Science', 1], ['Renewable resource', 'Science', 2], ['Skeleton gives', 'Science', 0],
  ['Nearest star to Earth', 'Science', 1], ['2, 4, 8, 16, __', 'Logical', 2], ['Circle, Square, Triangle, Banana. Which does not belong?', 'Logical', 3],
  ['All cats are animals. Cats ___', 'Logical', 1], ['A, C, E, G, __', 'Logical', 1], ['If today is Monday, after 3 days is', 'Logical', 2],
  ['1, 1, 2, 3, 5, __', 'Logical', 2], ['Red, Blue, Green, Dog. Which does not belong?', 'Logical', 3],
  ['Mirror pair of LEFT', 'Logical', 2], ['If 5 > 3 and 3 > 1, then 5 > 1', 'Logical', 0], ['10, 9, 8, 7, __', 'Logical', 1],
  ['Eagle is a bird. Eagle has', 'Logical', 0], ['Shape with 4 equal sides', 'Logical', 2], ['Alphabetically first', 'Logical', 0],
  ['Sun : Day = Moon :', 'Logical', 1], ['3, 6, 9, 12, __', 'Logical', 2],
];

const asInteger = (value) => {
  if (Number.isInteger(value)) return value;
  return typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : null;
};

export function resolveAssessmentCorrectAnswer(question = {}) {
  const options = Array.isArray(question.options) ? question.options : [];
  const supplied = asInteger(question.correctAnswer ?? question.correct_answer);
  if (supplied !== null && supplied >= 0 && supplied < options.length) return supplied;

  const fallback = DEFAULT_APTITUDE_QUESTIONS.find(([text, category]) =>
    text === String(question.question ?? question.questionText ?? '').trim() &&
    category === String(question.category ?? '').trim()
  );
  return fallback && fallback[2] < options.length ? fallback[2] : null;
}

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
  return asInteger(value);
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
      const correctAnswer = isInterestQuestion ? null : resolveAssessmentCorrectAnswer(question);
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

/** Repairs older snapshots using their saved choice text and the built-in answer key. */
export function normalizeAssessmentAnswerSnapshots(value) {
  if (!Array.isArray(value)) return [];

  return value.map((snapshot) => {
    const choices = Array.isArray(snapshot?.choices) ? snapshot.choices : [];
    const isInterest = isInterestAnswerSnapshot(snapshot);
    const selectedIndex = asInteger(snapshot?.selectedChoiceIndex) ?? choices.findIndex(
      (choice) => choice.id === snapshot?.selectedChoiceId || choice.text === snapshot?.selectedChoiceText
    );
    const selectedChoice = selectedIndex >= 0 ? choices[selectedIndex] : null;
    const correctAnswer = isInterest ? null : resolveAssessmentCorrectAnswer({
      questionText: snapshot?.questionText,
      category: snapshot?.category,
      options: choices.map((choice) => choice.text),
      correctAnswer: snapshot?.correctAnswer,
    });
    const correctChoice = correctAnswer !== null ? choices[correctAnswer] : null;

    return {
      ...snapshot,
      selectedChoiceId: selectedChoice?.id ?? snapshot?.selectedChoiceId ?? null,
      selectedChoiceText: selectedChoice?.text ?? snapshot?.selectedChoiceText ?? null,
      selectedChoiceIndex: selectedIndex >= 0 ? selectedIndex : null,
      correctAnswer,
      correctChoiceId: correctChoice?.id ?? snapshot?.correctChoiceId ?? null,
      correctAnswerText: correctChoice?.text ?? snapshot?.correctAnswerText ?? null,
      isCorrect: !isInterest && selectedIndex >= 0 && correctAnswer !== null
        ? selectedIndex === correctAnswer
        : isInterest ? null : snapshot?.isCorrect ?? null,
    };
  });
}
