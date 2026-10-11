import { getClustersForTrack } from '../data/electives.js';

export const RIASEC_TYPES = [
  'Realistic',
  'Investigative',
  'Artistic',
  'Social',
  'Enterprising',
  'Conventional',
];

const EMPTY_RIASEC_SCORES = () => RIASEC_TYPES.reduce((scores, type) => {
  scores[type] = 0;
  return scores;
}, {});

export function calculateAptitudeScores(answers = {}, questionsByCategory = {}) {
  const categoryScoreKeys = {
    Verbal: 'verbal_ability_score',
    Math: 'mathematical_ability_score',
    Science: 'spatial_ability_score',
    Logical: 'logical_reasoning_score',
  };
  const categoryScores = Object.entries(categoryScoreKeys).map(([category, scoreKey]) => {
    const questions = Array.isArray(questionsByCategory[category]) ? questionsByCategory[category] : [];
    const correctCount = questions.reduce((count, question) => {
      const response = answers[question.id];
      const correctAnswer = question.correct_answer ?? question.correctAnswer;
      if (response === undefined || response === null || correctAnswer === undefined || correctAnswer === null) {
        return count;
      }

      return Number(response) === Number(correctAnswer) ? count + 1 : count;
    }, 0);

    return {
      scoreKey,
      score: questions.length
        ? Number(((correctCount / questions.length) * 100).toFixed(2))
        : 0,
    };
  });
  const scoreValues = categoryScores.map(({ score }) => score);

  return {
    ...categoryScores.reduce((scores, { scoreKey, score }) => {
      scores[scoreKey] = score;
      return scores;
    }, {}),
    overall_score: Number((scoreValues.reduce((total, score) => total + score, 0) / scoreValues.length).toFixed(2)),
  };
}

const CLUSTER_FORMULAS = {
  'Business and Entrepreneurship': {
    math: 0.3,
    logical: 0.25,
    verbal: 0.1,
    science: 0.05,
    Enterprising: 0.15,
    Conventional: 0.15,
  },
  'Arts, Social Sciences, and Humanities': {
    verbal: 0.35,
    math: 0.05,
    science: 0.05,
    logical: 0.05,
    Artistic: 0.25,
    Social: 0.25,
  },
  'Science, Technology, Engineering, and Mathematics (STEM)': {
    math: 0.3,
    science: 0.3,
    logical: 0.25,
    verbal: 0.05,
    Investigative: 0.07,
    Realistic: 0.03,
  },
  'ICT Support and Computer Programming Technologies': {
    math: 0.25,
    science: 0.15,
    logical: 0.3,
    verbal: 0.05,
    Investigative: 0.1,
    Realistic: 0.1,
    Conventional: 0.05,
  },
};

const TRACK_TIE_TOLERANCE = 0.01;

function toPercentage(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
}

function getAptitudePercentages(scores = {}) {
  return {
    verbal: toPercentage(scores.verbal_ability_score ?? scores.VA ?? scores.verbal),
    math: toPercentage(scores.mathematical_ability_score ?? scores.MA ?? scores.math),
    science: toPercentage(scores.spatial_ability_score ?? scores.SA ?? scores.science),
    logical: toPercentage(scores.logical_reasoning_score ?? scores.LRA ?? scores.logical),
  };
}

function getRiasecPercentages(riasecScores = {}) {
  return RIASEC_TYPES.reduce((scores, type) => {
    scores[type] = toPercentage(riasecScores[type]);
    return scores;
  }, {});
}

export function getRiasecResponseScore(answer, question) {
  const response = Number(answer);
  if (!Number.isInteger(response)) {
    return 0;
  }

  const options = Array.isArray(question?.options) ? question.options : [];
  const selectedOption = options[response];
  if (selectedOption !== undefined) {
    const optionText = String(selectedOption).trim();
    const numericScore = optionText.match(/^\s*([1-5])\b/);
    if (numericScore) {
      return Number(numericScore[1]);
    }

    const normalizedOption = optionText.toLowerCase();
    if (normalizedOption.includes('strongly disagree')) return 1;
    if (normalizedOption.includes('strongly agree')) return 5;
    if (normalizedOption.includes('disagree')) return 2;
    if (normalizedOption.includes('neutral')) return 3;
    if (normalizedOption.includes('agree')) return 4;
  }

  return response >= 1 && response <= 5 ? response : 0;
}

export function calculateRiasecScores(answers = {}, interestQuestions = []) {
  const totals = EMPTY_RIASEC_SCORES();
  const questionCounts = EMPTY_RIASEC_SCORES();

  interestQuestions.forEach((question) => {
    const interestType = question?.interest_type || question?.interestType;
    if (!RIASEC_TYPES.includes(interestType)) {
      return;
    }

    questionCounts[interestType] += 1;
    totals[interestType] += getRiasecResponseScore(answers[question.id], question);
  });

  return RIASEC_TYPES.reduce((scores, type) => {
    const maximumPoints = questionCounts[type] * 5;
    scores[type] = maximumPoints
      ? Number(((totals[type] / maximumPoints) * 100).toFixed(2))
      : 0;
    return scores;
  }, {});
}

export function calculateTrackRecommendation(scores = {}, riasecScores = {}) {
  const aptitude = getAptitudePercentages(scores);
  const interests = getRiasecPercentages(riasecScores);
  const academicScore =
    aptitude.verbal * 0.3333 +
    aptitude.math * 0.3333 +
    aptitude.science * 0.3334;
  const technicalProfessionalScore = (aptitude.math + aptitude.logical) * 0.5;
  let track;

  if (Math.abs(academicScore - technicalProfessionalScore) > TRACK_TIE_TOLERANCE) {
    track = academicScore > technicalProfessionalScore
      ? 'Academic Track'
      : 'Technical-Professional Electives';
  } else {
    const academicInterestFit = (
      interests.Investigative +
      interests.Artistic +
      interests.Social +
      interests.Enterprising +
      interests.Conventional
    ) / 5;
    const technicalInterestFit = (
      interests.Realistic +
      interests.Investigative +
      interests.Conventional
    ) / 3;

    if (Math.abs(academicInterestFit - technicalInterestFit) > TRACK_TIE_TOLERANCE) {
      track = academicInterestFit > technicalInterestFit
        ? 'Academic Track'
        : 'Technical-Professional Electives';
    } else {
      const academicSpecificAptitude = (aptitude.verbal + aptitude.science) / 2;
      track = academicSpecificAptitude >= aptitude.logical
        ? 'Academic Track'
        : 'Technical-Professional Electives';
    }
  }

  return {
    track,
    academicAptitudeScore: (aptitude.verbal + aptitude.math + aptitude.science + aptitude.logical) / 4,
    trackScores: {
      academic: Number(academicScore.toFixed(2)),
      technicalProfessional: Number(technicalProfessionalScore.toFixed(2)),
    },
  };
}

export function calculateClusterScores(track, scores = {}, riasecScores = {}) {
  const aptitude = getAptitudePercentages(scores);
  const interests = getRiasecPercentages(riasecScores);
  const clusters = getClustersForTrack(track);

  return clusters.reduce((result, cluster) => {
    const formula = CLUSTER_FORMULAS[cluster.name];
    if (!formula) {
      return result;
    }

    const score = Object.entries(formula).reduce((total, [dimension, weight]) => {
      const value = dimension in aptitude ? aptitude[dimension] : interests[dimension];
      return total + value * weight;
    }, 0);

    result[cluster.name] = Number(score.toFixed(2));
    return result;
  }, {});
}

export function determineRecommendedCluster(track, scores = {}, riasecScores = {}) {
  const clusterScores = calculateClusterScores(track, scores, riasecScores);
  const clusters = getClustersForTrack(track);

  if (!clusters.length) {
    return null;
  }

  return clusters.reduce((best, cluster) => {
    const score = clusterScores[cluster.name] ?? -1;
    return !best || score > best.score
      ? { name: cluster.name, score }
      : best;
  }, null)?.name || null;
}
