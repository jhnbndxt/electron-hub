/**
 * Dynamic Assessment Scoring Service
 *
 * Objective sections are normalized from the live question counts in Supabase.
 * Interest clusters support the live 5-point Likert Interests question bank
 * and older checklist-based saved assessments.
 */

import { supabase } from '../supabase';
import electivesCatalog from '../data/electives.js';
import { validateElectiveWeightProfiles } from '../data/electiveWeightProfiles.js';
import { selectElectivesWithPrerequisites } from '../utils/electivePrerequisites.js';
import { RIASEC_TYPES, scoreElectiveRecommendation } from '../utils/electiveRecommendationScoring.js';

const EMPTY_GROUPED_QUESTIONS = {
  Verbal: [],
  Math: [],
  Science: [],
  Logical: [],
  Interests: [],
};

const DYNAMIC_SCORE_CATEGORIES = ['Verbal', 'Math', 'Science', 'Logical'];

const INTEREST_CLUSTER_CONFIG = {
  academic: { label: 'Academic Subjects', slots: [1, 2, 3, 12] },
  tech: { label: 'Technology', slots: [4, 6, 14] },
  business: { label: 'Business', slots: [5] },
  helping: { label: 'Helping Others', slots: [7, 13] },
  home: { label: 'Home Economics', slots: [8] },
  creative: { label: 'Creative Work', slots: [9] },
  outdoor: { label: 'Outdoor Activities', slots: [10] },
  practical: { label: 'Practical Tasks', slots: [11] },
  physical: { label: 'Physical Activities', slots: [15] },
};

const RIASEC_CLUSTER_WEIGHTS = {
  Realistic: { practical: 0.45, tech: 0.25, outdoor: 0.15, physical: 0.15 },
  Investigative: { academic: 0.7, tech: 0.2, practical: 0.1 },
  Artistic: { creative: 0.75, academic: 0.15, helping: 0.1 },
  Social: { helping: 0.8, academic: 0.1, creative: 0.1 },
  Enterprising: { business: 0.75, helping: 0.15, creative: 0.1 },
  Conventional: { home: 0.45, practical: 0.35, business: 0.2 },
};

function buildEmptyRiasecScores() {
  return RIASEC_TYPES.reduce((scores, type) => {
    scores[type] = 0;
    return scores;
  }, {});
}

const LEGACY_INTEREST_TYPE_BY_SLOT = {
  1: 'Investigative',
  2: 'Investigative',
  3: 'Enterprising',
  4: 'Artistic',
  5: 'Social',
  6: 'Enterprising',
  7: 'Investigative',
  8: 'Realistic',
  9: 'Artistic',
  10: 'Conventional',
  11: 'Enterprising',
  12: 'Investigative',
  13: 'Social',
  14: 'Artistic',
  15: 'Realistic',
};

const INTEREST_OPTION_CLUSTER_WEIGHTS = {
  physics: { academic: 1 },
  'computer science': { tech: 1 },
  biology: { academic: 0.7, helping: 0.3 },
  literature: { creative: 0.6, academic: 0.4 },
  'understanding theories': { academic: 1 },
  'creating solutions': { tech: 0.7, practical: 0.3 },
  'expressing ideas': { creative: 1 },
  'helping communities': { helping: 1 },
  laboratory: { academic: 1 },
  workshop: { practical: 0.6, tech: 0.4 },
  library: { academic: 0.5, creative: 0.5 },
  office: { business: 1 },
  'research projects': { academic: 1 },
  'building prototypes': { tech: 0.6, practical: 0.4 },
  'writing essays': { creative: 0.7, academic: 0.3 },
  'organizing events': { business: 0.6, helping: 0.4 },
  stem: { academic: 1 },
  humanities: { helping: 0.6, creative: 0.4 },
  business: { business: 1 },
  arts: { creative: 1 },
  'science discovery': { academic: 1 },
  'technology innovation': { tech: 1 },
  'social services': { helping: 1 },
  'creative expression': { creative: 1 },
  researcher: { academic: 1 },
  engineer: { tech: 0.6, practical: 0.4 },
  doctor: { helping: 0.6, academic: 0.4 },
  entrepreneur: { business: 1 },
  technical: { tech: 0.6, practical: 0.4 },
  leadership: { business: 0.7, helping: 0.3 },
  communication: { creative: 0.6, helping: 0.4 },
  'problem-solving': { practical: 1 },
  visual: { creative: 1 },
  auditory: { helping: 0.5, creative: 0.5 },
  kinesthetic: { physical: 0.7, practical: 0.3 },
  'reading/writing': { academic: 0.6, creative: 0.4 },
  coding: { tech: 1 },
  designing: { creative: 1 },
  teaching: { helping: 1 },
  managing: { business: 1 },
  innovation: { tech: 1 },
  impact: { helping: 1 },
  excellence: { academic: 1 },
  security: { home: 0.4, practical: 0.6 },
  team: { helping: 0.6, physical: 0.4 },
  independent: { academic: 0.6, practical: 0.4 },
  flexible: { creative: 0.5, outdoor: 0.5 },
  structured: { home: 0.5, practical: 0.5 },
  mathematical: { academic: 1 },
  creative: { creative: 1 },
  practical: { practical: 1 },
  ethical: { helping: 1 },
  technology: { tech: 1 },
  healthcare: { helping: 0.7, academic: 0.3 },
  education: { helping: 0.5, academic: 0.5 },
  finance: { business: 1 },
  specialist: { academic: 0.5, tech: 0.5 },
  generalist: { academic: 0.6, creative: 0.4 },
  leader: { business: 1 },
  innovator: { tech: 0.6, creative: 0.4 },
};

const ELECTIVE_GROUPS = {
  Academic: [
    {
      key: 'STEM',
      electives: ['Biology', 'Physics'],
      score: ({ scores }) =>
        scores.mathematical_ability_score * 0.4 +
        scores.spatial_ability_score * 0.4 +
        scores.logical_reasoning_score * 0.2,
    },
    {
      key: 'BUSINESS',
      electives: ['Entrepreneurship', 'Marketing'],
      score: ({ scores, interestClusters }) =>
        scores.mathematical_ability_score * 0.4 +
        interestClusters.business * 0.4 +
        scores.verbal_ability_score * 0.2,
    },
    {
      key: 'HUMANITIES',
      electives: ['Psychology', 'Creative Writing'],
      score: ({ scores, interestClusters }) =>
        scores.verbal_ability_score * 0.5 +
        interestClusters.helping * 0.3 +
        scores.logical_reasoning_score * 0.2,
    },
    {
      key: 'CREATIVE',
      electives: ['Media Arts', 'Visual Arts'],
      score: ({ scores, interestClusters }) =>
        interestClusters.creative * 0.6 +
        scores.verbal_ability_score * 0.2 +
        scores.logical_reasoning_score * 0.2,
    },
    {
      key: 'SPORTS',
      electives: ['Coaching', 'Fitness'],
      score: ({ scores, interestClusters }) =>
        interestClusters.physical * 0.6 +
        scores.spatial_ability_score * 0.2 +
        scores.logical_reasoning_score * 0.2,
    },
  ],
  'Technical-Professional': [
    {
      key: 'ICT',
      electives: ['ICT', 'Programming'],
      score: ({ scores, interestClusters }) =>
        interestClusters.tech * 0.5 +
        scores.logical_reasoning_score * 0.3 +
        scores.mathematical_ability_score * 0.2,
    },
    {
      key: 'HOME',
      electives: ['Cookery', 'Bread & Pastry'],
      score: ({ interestClusters }) =>
        interestClusters.home * 0.6 + interestClusters.practical * 0.4,
    },
    {
      key: 'INDUSTRIAL',
      electives: ['Automotive', 'Electrical'],
      score: ({ scores, interestClusters }) =>
        interestClusters.tech * 0.4 +
        interestClusters.practical * 0.4 +
        scores.mathematical_ability_score * 0.2,
    },
    {
      key: 'AGRI',
      electives: ['Agriculture', 'Fishery'],
      score: ({ interestClusters }) =>
        interestClusters.outdoor * 0.6 + interestClusters.practical * 0.4,
    },
    {
      key: 'PHYSICAL',
      electives: ['Fitness Training', 'Coaching'],
      score: ({ interestClusters }) =>
        interestClusters.physical * 0.7 + interestClusters.practical * 0.3,
    },
  ],
};

function normalizeGroupedQuestions(questionsByCategory = {}) {
  const grouped = {
    Verbal: [],
    Math: [],
    Science: [],
    Logical: [],
    Interests: [],
  };

  Object.entries(questionsByCategory).forEach(([category, questions]) => {
    if (!grouped[category] || !Array.isArray(questions)) {
      return;
    }

    grouped[category] = [...questions].sort(
      (first, second) => Number(first?.id ?? 0) - Number(second?.id ?? 0)
    );
  });

  return grouped;
}

async function resolveQuestionsByCategory(questionsByCategory = null) {
  if (questionsByCategory) {
    return normalizeGroupedQuestions(questionsByCategory);
  }

  return getQuestionsByCategory();
}

function buildQuestionStats(questionsByCategory) {
  return Object.keys(EMPTY_GROUPED_QUESTIONS).reduce((stats, category) => {
    stats[category] = questionsByCategory?.[category]?.length || 0;
    return stats;
  }, {});
}

function getCorrectAnswer(question) {
  if (typeof question?.correct_answer === 'number') {
    return question.correct_answer;
  }

  if (typeof question?.correctAnswer === 'number') {
    return question.correctAnswer;
  }

  return null;
}

function buildEmptyInterestClusters() {
  return Object.keys(INTEREST_CLUSTER_CONFIG).reduce((clusters, key) => {
    clusters[key] = 0;
    return clusters;
  }, {});
}

function getLegacyInterestResponse(interestQuestions, answers, slot) {
  const question = interestQuestions?.[slot - 1];
  if (!question) {
    return 0;
  }

  const response = Number(answers?.[question.id]);
  return Number.isFinite(response) && response >= 1 && response <= 5 ? response : 0;
}

function hasLegacyLikertInterestAnswers(answers, interestQuestions = []) {
  return interestQuestions.some((question) => {
    const response = Number(answers?.[question.id]);
    const optionCount = Array.isArray(question?.options) ? question.options.length : 0;
    const usesLikertOptions = Array.isArray(question?.options) && question.options.some((option) =>
      String(option || '').toLowerCase().includes('strongly agree')
    );

    return Number.isFinite(response) && optionCount > 0 && (response > optionCount - 1 || usesLikertOptions);
  });
}

function getSelectedInterestOptions(question, answers) {
  const response = answers?.[question?.id];
  const options = Array.isArray(question?.options) ? question.options : [];

  if (Array.isArray(response)) {
    return response
      .filter((value) => Number.isInteger(value) && options[value])
      .map((value) => options[value]);
  }

  const normalizedResponse = Number(response);
  if (!Number.isInteger(normalizedResponse)) {
    return [];
  }

  return options[normalizedResponse] ? [options[normalizedResponse]] : [];
}

function calculateLegacyInterestClusterScores(answers, interestQuestions) {
  if (interestQuestions.some((question) => question?.interest_type || question?.interestType)) {
    return calculateRiasecInterestClusterScores(answers, interestQuestions);
  }

  return Object.entries(INTEREST_CLUSTER_CONFIG).reduce((clusters, [key, config]) => {
    const total = config.slots.reduce(
      (sum, slot) => sum + getLegacyInterestResponse(interestQuestions, answers, slot),
      0
    );

    clusters[key] = Math.round((total / config.slots.length) * 20);
    return clusters;
  }, buildEmptyInterestClusters());
}

function addRiasecRatingToClusters(clusterTotals, riasecType, rating) {
  const weights = RIASEC_CLUSTER_WEIGHTS[riasecType];

  if (!weights || rating <= 0) {
    return;
  }

  Object.entries(weights).forEach(([clusterKey, weight]) => {
    clusterTotals[clusterKey] += rating * weight;
  });
}

function calculateRiasecInterestClusterScores(answers, interestQuestions) {
  const clusterTotals = buildEmptyInterestClusters();
  let maxRatingTotal = 0;

  interestQuestions.forEach((question, index) => {
    const response = Number(answers?.[question.id]);
    const rating = Number.isFinite(response) && response >= 1 && response <= 5 ? response : 0;
    const interestType = question?.interest_type || question?.interestType || LEGACY_INTEREST_TYPE_BY_SLOT[index + 1];

    if (!interestType || rating <= 0) {
      return;
    }

    addRiasecRatingToClusters(clusterTotals, interestType, rating);
    maxRatingTotal += 5;
  });

  if (maxRatingTotal === 0) {
    return clusterTotals;
  }

  Object.keys(clusterTotals).forEach((clusterKey) => {
    clusterTotals[clusterKey] = Math.round((clusterTotals[clusterKey] / maxRatingTotal) * 100);
  });

  return clusterTotals;
}

export function calculateInterestClusterScores(answers, questionsByCategory) {
  const grouped = normalizeGroupedQuestions(questionsByCategory);
  const interestQuestions = grouped.Interests;

  if (!interestQuestions.length) {
    return buildEmptyInterestClusters();
  }

  if (hasLegacyLikertInterestAnswers(answers, interestQuestions)) {
    return calculateLegacyInterestClusterScores(answers, interestQuestions);
  }

  return calculateOptionBasedInterestClusterScores(answers, interestQuestions);
}

export function calculateRiasecInterestScores(answers, questionsByCategory) {
  const grouped = normalizeGroupedQuestions(questionsByCategory);
  const interestQuestions = grouped.Interests;
  const typeTotals = buildEmptyRiasecScores();
  const typeQuestionCounts = buildEmptyRiasecScores();

  // Sum up ratings for each RIASEC type
  interestQuestions.forEach((question, index) => {
    const interestType = question?.interest_type || question?.interestType || LEGACY_INTEREST_TYPE_BY_SLOT[index + 1];

    if (!RIASEC_TYPES.includes(interestType)) {
      return;
    }

    const response = Number(answers?.[question.id]);
    const rating = Number.isFinite(response) && response >= 1 && response <= 5 ? response : 0;

    typeTotals[interestType] += rating;
    typeQuestionCounts[interestType] += 1;
  });

  // Calculate average for each RIASEC type (returns 1-5 scale)
  RIASEC_TYPES.forEach((type) => {
    typeTotals[type] = typeQuestionCounts[type] > 0
      ? Number((typeTotals[type] / typeQuestionCounts[type]).toFixed(2))
      : 0;
  });

  return typeTotals;
}

function calculateOptionBasedInterestClusterScores(answers, interestQuestions) {
  const clusterTotals = buildEmptyInterestClusters();
  const selectedOptions = interestQuestions.flatMap((question) => getSelectedInterestOptions(question, answers));

  if (!selectedOptions.length) {
    return clusterTotals;
  }

  selectedOptions.forEach((selectedOption) => {
    const normalizedOption = String(selectedOption || '').trim().toLowerCase();
    const weights = INTEREST_OPTION_CLUSTER_WEIGHTS[normalizedOption];

    if (!weights) {
      return;
    }

    Object.entries(weights).forEach(([clusterKey, weight]) => {
      clusterTotals[clusterKey] += weight;
    });
  });

  const totalSelections = selectedOptions.length;
  Object.keys(clusterTotals).forEach((clusterKey) => {
    clusterTotals[clusterKey] = Math.round((clusterTotals[clusterKey] / totalSelections) * 100);
  });

  return clusterTotals;
}

function rankElectiveGroups(track, scores, interestClusters = {}) {
  const groups = ELECTIVE_GROUPS[track] || [];

  return groups
    .map((group) => ({
      key: group.key,
      electives: group.electives,
      score: group.score({ scores, interestClusters }),
    }))
    .sort((first, second) => second.score - first.score);
}

function toScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

function buildElectiveScoringProfile(scores, interestClusters = {}, riasecScores = {}) {
  return {
    academic: toScore(interestClusters.academic),
    communication: Math.round((toScore(interestClusters.creative) + toScore(interestClusters.helping)) / 2),
    creative: toScore(interestClusters.creative),
    leadership: toScore(interestClusters.business),
    technical: toScore(interestClusters.tech),
    social: toScore(interestClusters.helping),
    verbal: toScore(scores?.verbal_ability_score),
    math: toScore(scores?.mathematical_ability_score),
    science: toScore(scores?.spatial_ability_score),
    logical: toScore(scores?.logical_reasoning_score),
    ...riasecScores,
  };
}

function buildElectiveRecommendationReason(elective, scoring) {
  const strongestSignals = [
    { label: 'aptitude fit', score: scoring.aptitudeFit },
    { label: 'RIASEC interest fit', score: scoring.riasecFit },
  ]
    .sort((first, second) => second.score - first.score)
    .map((signal) => `${signal.label} (${signal.score}%)`)
    .join(' and ');

  return `${elective.name} is recommended based on assessment compatibility. Its competency profile matches your ${strongestSignals}.`;
}

function buildResponseTieBreaker(elective, profile) {
  const seed = [
    elective?.name,
    profile.academic,
    profile.communication,
    profile.creative,
    profile.leadership,
    profile.technical,
    profile.social,
    profile.verbal,
    profile.math,
    profile.science,
    profile.logical,
  ].join('|');

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }

  return hash / 1000003;
}

function rankCatalogElectives(track, scores, interestClusters = {}, riasecScores = {}) {
  const profile = buildElectiveScoringProfile(scores, interestClusters, riasecScores);

  return electivesCatalog
    .map((elective) => {
      const scoring = scoreElectiveRecommendation(elective, {
        scores,
        interestClusters,
        riasecScores,
      });

      return {
        ...elective,
        score: scoring.finalScore,
        aptitudeFit: scoring.aptitudeFit,
        riasecFit: scoring.riasecFit,
        tieBreaker: buildResponseTieBreaker(elective, profile),
      };
    })
    .sort((first, second) => {
      const scoreDifference = second.score - first.score;

      if (Math.abs(scoreDifference) > 0.0001) {
        return scoreDifference;
      }

      return second.tieBreaker - first.tieBreaker;
    });
}

function calculateTrackScores(scores, interestClusters = {}, riasecScores = {}) {
  const APTITUDE_THRESHOLD = 70;
  const INTEREST_THRESHOLD = 3.5;

  // Get all aptitude scores
  const verbal = scores.verbal_ability_score ?? 0;
  const math = scores.mathematical_ability_score ?? 0;
  const spatial = scores.spatial_ability_score ?? 0; // Science
  const logical = scores.logical_reasoning_score ?? 0;

  // Get all RIASEC scores (1-5 scale)
  const realistic = riasecScores.Realistic ?? 0;
  const investigative = riasecScores.Investigative ?? 0;
  const artistic = riasecScores.Artistic ?? 0;
  const social = riasecScores.Social ?? 0;
  const enterprising = riasecScores.Enterprising ?? 0;
  const conventional = riasecScores.Conventional ?? 0;

  // CONDITION 1: If ALL four aptitudes are >= 70%, recommend Academic Track
  if (verbal >= APTITUDE_THRESHOLD && math >= APTITUDE_THRESHOLD && spatial >= APTITUDE_THRESHOLD && logical >= APTITUDE_THRESHOLD) {
    return {
      academicScore: 100,
      techProScore: 0,
      recommendedTrack: 'Academic',
    };
  }

  // CONDITION 2: Verbal >= 70% AND Science >= 70% AND Logical >= 70%
  // AND (I >= 3.5 OR A >= 3.5 OR E >= 3.5)
  const academicAptitudesOk = (verbal >= APTITUDE_THRESHOLD) && (spatial >= APTITUDE_THRESHOLD) && (logical >= APTITUDE_THRESHOLD);
  const academicInterestsOk = (investigative >= INTEREST_THRESHOLD) || (artistic >= INTEREST_THRESHOLD) || (enterprising >= INTEREST_THRESHOLD);

  if (academicAptitudesOk && academicInterestsOk) {
    return {
      academicScore: 100,
      techProScore: 0,
      recommendedTrack: 'Academic',
    };
  }

  // CONDITION 3: Mathematical >= 70% AND Logical >= 70%
  // AND (R >= 3.5 OR S >= 3.5 OR C >= 3.5)
  const techAptitudesOk = (math >= APTITUDE_THRESHOLD) && (logical >= APTITUDE_THRESHOLD);
  const techInterestsOk = (realistic >= INTEREST_THRESHOLD) || (social >= INTEREST_THRESHOLD) || (conventional >= INTEREST_THRESHOLD);

  if (techAptitudesOk && techInterestsOk) {
    return {
      academicScore: 0,
      techProScore: 100,
      recommendedTrack: 'Technical-Professional',
    };
  }

  // FALLBACK: Always recommend one of the supported tracks.
  const academicFit = (verbal + math + spatial + logical) / 4;
  const technicalFit = (math + logical) / 2;
  const academicInterestFit = investigative + artistic + enterprising;
  const technicalInterestFit = realistic + social + conventional;
  const academicScore = academicFit + academicInterestFit * 5;
  const technicalScore = technicalFit + technicalInterestFit * 5;

  return {
    academicScore,
    techProScore: technicalScore,
    recommendedTrack: academicScore >= technicalScore ? 'Academic' : 'Technical-Professional',
  };
}

function buildElectiveRecommendationDetails(selectedElectives = []) {
  return selectedElectives.map((elective) => ({
    name: elective.name,
    track: elective.track,
    category: elective.category || elective.group,
    compatibilityScore: elective.score,
    aptitudeScore: elective.aptitudeFit,
    riasecScore: elective.riasecFit,
    reason: buildElectiveRecommendationReason(elective, {
      aptitudeFit: elective.aptitudeFit,
      riasecFit: elective.riasecFit,
    }),
  }));
}

export function determineTrack(scores, interestClusters = {}, riasecScores = {}) {
  if (!scores) return 'General';

  const { recommendedTrack } = calculateTrackScores(scores, interestClusters, riasecScores);

  return recommendedTrack;
}

/**
 * Recommend the top two individual electives.
 *
 * Each elective competes independently using its own configured weights. This
 * avoids the old family-level behavior where the same first two options in a
 * group were always selected, even when other electives were equally strong.
 */
export function recommendElectives(trackOrScores, scoresOrInterestClusters = {}, maybeInterestClusters = {}, maybeRiasecScores = {}) {
  let track = trackOrScores;
  let scores = scoresOrInterestClusters;
  let interestClusters = maybeInterestClusters;
  let riasecScores = maybeRiasecScores;

  if (typeof trackOrScores !== 'string') {
    scores = trackOrScores;
    interestClusters = scoresOrInterestClusters || {};
    riasecScores = maybeInterestClusters || {};
    track = determineTrack(scores, interestClusters, riasecScores);
  }

  if (!scores || typeof track !== 'string') {
    return [];
  }

  const rankedCatalogElectives = rankCatalogElectives(track, scores, interestClusters, riasecScores);

  if (rankedCatalogElectives.length > 0) {
    return selectElectivesWithPrerequisites(rankedCatalogElectives, 2).map((elective) => elective.name);
  }

  const rankedGroups = rankElectiveGroups(track, scores, interestClusters);
  return rankedGroups.flatMap((group) => group.electives).slice(0, 2);
}

export function recommendElectiveDetails(track, scores, interestClusters = {}, riasecScores = {}) {
  if (!scores || typeof track !== 'string') {
    return [];
  }

  const rankedCatalogElectives = rankCatalogElectives(track, scores, interestClusters, riasecScores);
  const selectedElectives = selectElectivesWithPrerequisites(rankedCatalogElectives, 2);

  return buildElectiveRecommendationDetails(selectedElectives);
}

/**
 * Get top 2 academic domains from scores.
 */
export function getTopDomains(scores) {
  if (!scores) return [];

  return [
    { name: 'Verbal', score: scores.verbal_ability_score },
    { name: 'Math', score: scores.mathematical_ability_score },
    { name: 'Science', score: scores.spatial_ability_score },
    { name: 'Logical', score: scores.logical_reasoning_score },
  ]
    .sort((first, second) => second.score - first.score)
    .slice(0, 2)
    .map((domain) => domain.name);
}

/**
 * Get top 2 fixed interest clusters from the ordered Interests section.
 */
export function getTopInterests(answers, questionsByCategory) {
  const grouped = normalizeGroupedQuestions(questionsByCategory);
  if (!grouped.Interests.length) {
    return [];
  }

  const interestClusters = calculateInterestClusterScores(answers, grouped);

  return Object.entries(INTEREST_CLUSTER_CONFIG)
    .map(([key, config]) => ({
      name: config.label,
      score: interestClusters[key] || 0,
    }))
    .filter((cluster) => cluster.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 2)
    .map((cluster) => cluster.name);
}

/**
 * Get all questions grouped by category.
 */
export async function getQuestionsByCategory() {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('id, question, options, correct_answer, category, interest_type')
      .order('id', { ascending: true });

    if (error) throw error;

    const grouped = normalizeGroupedQuestions(EMPTY_GROUPED_QUESTIONS);

    data?.forEach((question) => {
      if (grouped[question.category]) {
        grouped[question.category].push(question);
      }
    });

    return normalizeGroupedQuestions(grouped);
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    return null;
  }
}

/**
 * Calculate VA, MA, SA, and LRA dynamically from the live question counts.
 */
export async function calculateDynamicScores(answers, questionsByCategory = null) {
  try {
    const groupedQuestions = await resolveQuestionsByCategory(questionsByCategory);
    if (!groupedQuestions) {
      console.error('Could not fetch questions');
      return null;
    }

    const categoryScores = {};

    DYNAMIC_SCORE_CATEGORIES.forEach((category) => {
      const questions = groupedQuestions[category] || [];
      const totalQuestions = questions.length;

      if (!totalQuestions) {
        categoryScores[category] = 0;
        return;
      }

      const correctCount = questions.reduce((count, question) => {
        const correctAnswer = getCorrectAnswer(question);
        return answers?.[question.id] === correctAnswer ? count + 1 : count;
      }, 0);

      categoryScores[category] = Math.round((correctCount / totalQuestions) * 100);
    });

    const overallScore = Math.round(
      DYNAMIC_SCORE_CATEGORIES.reduce(
        (sum, category) => sum + (categoryScores[category] || 0),
        0
      ) / DYNAMIC_SCORE_CATEGORIES.length
    );

    return {
      verbal_ability_score: categoryScores.Verbal || 0,
      mathematical_ability_score: categoryScores.Math || 0,
      spatial_ability_score: categoryScores.Science || 0,
      logical_reasoning_score: categoryScores.Logical || 0,
      overall_score: overallScore,
    };
  } catch (error) {
    console.error('Error calculating dynamic scores:', error);
    return null;
  }
}

/**
 * Get question count stats for all categories.
 */
export async function getQuestionStats() {
  try {
    const { data, error } = await supabase
      .from('assessment_question_stats')
      .select('*');

    if (!error && data?.length) {
      const stats = buildQuestionStats(EMPTY_GROUPED_QUESTIONS);

      data.forEach((row) => {
        stats[row.category] = row.question_count;
      });

      return stats;
    }
  } catch (error) {
    console.error('Error fetching question stats:', error);
  }

  const questionsByCategory = await getQuestionsByCategory();
  return questionsByCategory ? buildQuestionStats(questionsByCategory) : null;
}

/**
 * Format a complete assessment result payload for storage and UI consumption.
 */
export async function formatAssessmentResult(answers, questionsByCategory = null) {
  try {
    const groupedQuestions = await resolveQuestionsByCategory(questionsByCategory);
    if (!groupedQuestions) {
      return null;
    }

    const scores = await calculateDynamicScores(answers, groupedQuestions);
    if (!scores) return null;

    const interestClusters = calculateInterestClusterScores(answers, groupedQuestions);
    const riasecScores = calculateRiasecInterestScores(answers, groupedQuestions);
    const electiveWeightErrors = validateElectiveWeightProfiles(electivesCatalog.map((elective) => elective.name));

    if (electiveWeightErrors.length > 0) {
      console.error('Elective weight validation errors:', electiveWeightErrors);
    }

    const track = determineTrack(scores, interestClusters, riasecScores);
    const electiveRecommendations = recommendElectiveDetails(track, scores, interestClusters, riasecScores);
    const electives = electiveRecommendations.map((elective) => elective.name);
    const topDomains = getTopDomains(scores);
    const topInterests = getTopInterests(answers, groupedQuestions);

    return {
      scores,
      interestClusters,
      riasecScores,
      recommended_track: track,
      elective_1: electives[0] || null,
      elective_2: electives[1] || null,
      top_domains: topDomains,
      top_interests: topInterests,
      track,
      electives,
      electiveRecommendations,
      topDomains,
      topInterests,
      overallScore: scores.overall_score,
    };
  } catch (error) {
    console.error('Error formatting assessment result:', error);
    return null;
  }
}
