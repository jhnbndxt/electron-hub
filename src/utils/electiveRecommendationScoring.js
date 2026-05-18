export const RIASEC_TYPES = [
  'Realistic',
  'Investigative',
  'Artistic',
  'Social',
  'Enterprising',
  'Conventional',
];

const APTITUDE_DIMENSIONS = {
  verbal: 'verbal',
  math: 'math',
  science: 'science',
  logical: 'logical',
};

const INTEREST_TO_RIASEC_WEIGHTS = {
  academic: { Investigative: 0.75, Conventional: 0.1, Social: 0.05, Artistic: 0.05, Enterprising: 0.05 },
  communication: { Social: 0.35, Enterprising: 0.3, Artistic: 0.25, Conventional: 0.1 },
  creative: { Artistic: 0.75, Enterprising: 0.1, Social: 0.1, Investigative: 0.05 },
  leadership: { Enterprising: 0.75, Social: 0.15, Conventional: 0.1 },
  technical: { Realistic: 0.4, Investigative: 0.35, Conventional: 0.15, Artistic: 0.1 },
  social: { Social: 0.8, Enterprising: 0.1, Artistic: 0.05, Investigative: 0.05 },
  practical: { Realistic: 0.65, Conventional: 0.2, Investigative: 0.15 },
  home: { Conventional: 0.4, Realistic: 0.35, Social: 0.15, Enterprising: 0.1 },
  outdoor: { Realistic: 0.75, Investigative: 0.15, Conventional: 0.1 },
  physical: { Realistic: 0.75, Social: 0.15, Enterprising: 0.1 },
};

function toScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
}

function sumValues(values) {
  return values.reduce((sum, value) => sum + toScore(value), 0);
}

function weightedAverage(values, weights) {
  const entries = Object.entries(weights || {}).filter(([, weight]) => Number(weight) > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + Number(weight), 0);

  if (totalWeight <= 0) {
    return null;
  }

  return entries.reduce((sum, [key, weight]) => sum + toScore(values[key]) * Number(weight), 0) / totalWeight;
}

function getAptitudeScores(scores = {}) {
  return {
    verbal: toScore(scores.verbal_ability_score ?? scores.VA ?? scores.verbal),
    math: toScore(scores.mathematical_ability_score ?? scores.MA ?? scores.math),
    science: toScore(scores.spatial_ability_score ?? scores.SA ?? scores.science),
    logical: toScore(scores.logical_reasoning_score ?? scores.LRA ?? scores.logical),
  };
}

function getInterestClusterScores(interestClusters = {}) {
  return {
    academic: toScore(interestClusters.academic),
    communication: Math.round((toScore(interestClusters.creative) + toScore(interestClusters.helping)) / 2),
    creative: toScore(interestClusters.creative),
    leadership: toScore(interestClusters.business),
    technical: toScore(interestClusters.tech),
    social: toScore(interestClusters.helping),
    practical: toScore(interestClusters.practical),
    home: toScore(interestClusters.home),
    outdoor: toScore(interestClusters.outdoor),
    physical: toScore(interestClusters.physical),
  };
}

function getRiasecScores(riasecScores = {}, interestClusters = {}) {
  const directScores = RIASEC_TYPES.reduce((scores, type) => {
    scores[type] = toScore(riasecScores[type]);
    return scores;
  }, {});

  if (sumValues(Object.values(directScores)) > 0) {
    return directScores;
  }

  return {
    Realistic: Math.round((toScore(interestClusters.practical) + toScore(interestClusters.tech) + toScore(interestClusters.outdoor) + toScore(interestClusters.physical)) / 4),
    Investigative: Math.round((toScore(interestClusters.academic) + toScore(interestClusters.tech) + toScore(interestClusters.practical)) / 3),
    Artistic: Math.round((toScore(interestClusters.creative) + toScore(interestClusters.academic) + toScore(interestClusters.helping)) / 3),
    Social: Math.round((toScore(interestClusters.helping) + toScore(interestClusters.academic) + toScore(interestClusters.creative)) / 3),
    Enterprising: Math.round((toScore(interestClusters.business) + toScore(interestClusters.helping) + toScore(interestClusters.creative)) / 3),
    Conventional: Math.round((toScore(interestClusters.home) + toScore(interestClusters.practical) + toScore(interestClusters.business)) / 3),
  };
}

function buildElectiveRiasecTarget(elective = {}) {
  const target = RIASEC_TYPES.reduce((scores, type) => {
    scores[type] = 0;
    return scores;
  }, {});

  Object.entries(elective.weights || {}).forEach(([dimension, dimensionWeight]) => {
    const riasecWeights = INTEREST_TO_RIASEC_WEIGHTS[dimension];

    if (!riasecWeights || Number(dimensionWeight) <= 0) {
      return;
    }

    Object.entries(riasecWeights).forEach(([type, weight]) => {
      target[type] += Number(dimensionWeight) * Number(weight);
    });
  });

  return target;
}

export function scoreElectiveRecommendation(elective, { scores = {}, interestClusters = {}, riasecScores = {} } = {}) {
  const electiveWeights = elective?.weights || {};
  const aptitudeWeights = Object.keys(APTITUDE_DIMENSIONS).reduce((weights, dimension) => {
    if (Number(electiveWeights[dimension]) > 0) {
      weights[dimension] = Number(electiveWeights[dimension]);
    }

    return weights;
  }, {});
  const aptitudeScores = getAptitudeScores(scores);
  const interestScores = getInterestClusterScores(interestClusters);
  const studentRiasecScores = getRiasecScores(riasecScores, interestClusters);
  const electiveRiasecTarget = buildElectiveRiasecTarget(elective);

  const aptitudeFit = weightedAverage(aptitudeScores, aptitudeWeights);
  const riasecFit = weightedAverage(studentRiasecScores, electiveRiasecTarget);
  const fallbackInterestFit = weightedAverage(interestScores, electiveWeights);
  const averageAptitude = sumValues(Object.values(aptitudeScores)) / Object.values(aptitudeScores).length;
  const averageInterest = sumValues(Object.values(studentRiasecScores)) / Object.values(studentRiasecScores).length;

  let finalScore = 0;

  if (aptitudeFit !== null && riasecFit !== null) {
    finalScore = aptitudeFit * 0.55 + riasecFit * 0.45;
  } else if (aptitudeFit !== null) {
    finalScore = aptitudeFit * 0.75 + averageInterest * 0.25;
  } else if (riasecFit !== null) {
    finalScore = averageAptitude * 0.25 + riasecFit * 0.75;
  } else {
    finalScore = fallbackInterestFit ?? averageAptitude * 0.5 + averageInterest * 0.5;
  }

  return {
    finalScore: Number(finalScore.toFixed(2)),
    aptitudeFit: Number((aptitudeFit ?? averageAptitude).toFixed(2)),
    riasecFit: Number((riasecFit ?? fallbackInterestFit ?? averageInterest).toFixed(2)),
  };
}
