/**
 * Dynamic Assessment Scoring Service
 *
 * Objective sections are normalized from the live question counts in Supabase.
 * RIASEC dimensions are scored independently from their live 5-point Likert
 * question counts.
 */

import { supabase } from '../supabase';
import electivesCatalog, { getElectivesForCluster } from '../data/electives.js';
import {
  RIASEC_TYPES,
  calculateAptitudeScores,
  calculateClusterScores,
  calculateRiasecScores,
  getRiasecResponseScore,
  calculateTrackRecommendation,
  determineRecommendedCluster,
} from '../utils/electiveRecommendationScoring.js';

const EMPTY_GROUPED_QUESTIONS = {
  Verbal: [],
  Math: [],
  Science: [],
  Logical: [],
  ...RIASEC_TYPES.reduce((categories, type) => {
    categories[type] = [];
    return categories;
  }, {}),
};

const INTEREST_CATEGORIES = ['Interests', ...RIASEC_TYPES];

function normalizeGroupedQuestions(questionsByCategory = {}) {
  const grouped = {
    Verbal: [],
    Math: [],
    Science: [],
    Logical: [],
    Interests: [],
    ...RIASEC_TYPES.reduce((categories, type) => {
      categories[type] = [];
      return categories;
    }, {}),
  };

  Object.entries(questionsByCategory).forEach(([category, questions]) => {
    const normalizedCategory = category === 'R' ? 'Realistic' :
      category === 'I' ? 'Investigative' :
      category === 'A' ? 'Artistic' :
      category === 'S' ? 'Social' :
      category === 'E' ? 'Enterprising' :
      category === 'C' ? 'Conventional' :
      category;
    if (!grouped[normalizedCategory] || !Array.isArray(questions)) {
      return;
    }

    grouped[normalizedCategory] = [...questions].sort(
      (first, second) => Number(first?.id ?? 0) - Number(second?.id ?? 0)
    );
  });

  RIASEC_TYPES.forEach((type) => {
    grouped.Interests.push(...grouped[type]);
    grouped[type] = [];
  });
  grouped.Interests.sort((first, second) => Number(first?.id ?? 0) - Number(second?.id ?? 0));

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

function getInterestType(question) {
  const interestType = question?.interest_type || question?.interestType;
  if (RIASEC_TYPES.includes(interestType)) {
    return interestType;
  }
  if (RIASEC_TYPES.includes(question?.category)) {
    return question.category;
  }
  const typeByCode = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional',
  };
  if (typeByCode[question?.category]) {
    return typeByCode[question.category];
  }
}

export function calculateRiasecInterestScores(answers, questionsByCategory) {
  const grouped = normalizeGroupedQuestions(questionsByCategory);
  const riasecQuestions = INTEREST_CATEGORIES.flatMap((category) => grouped[category] || []);
  return calculateRiasecScores(answers, riasecQuestions.map((question) => ({
    ...question,
    interestType: getInterestType(question),
  })));
}

export function determineTrack(scores, riasecScores = {}) {
  if (!scores) return 'Academic Track';

  return calculateTrackRecommendation(scores, riasecScores).track;
}

/** Return the assigned electives for the recommended cluster; never shuffle or rank individual electives. */
export function recommendElectives(trackOrScores, scoresOrRiasecScores = {}, maybeRiasecScores = {}) {
  let track = trackOrScores;
  let scores = scoresOrRiasecScores;
  let riasecScores = maybeRiasecScores;

  if (typeof trackOrScores !== 'string') {
    scores = trackOrScores;
    riasecScores = scoresOrRiasecScores || {};
    track = determineTrack(scores, riasecScores);
  }

  if (!scores || typeof track !== 'string') {
    return [];
  }

  const cluster = determineRecommendedCluster(track, scores, riasecScores);
  return getElectivesForCluster(track, cluster);
}

export function recommendElectiveDetails(track, scores, riasecScores = {}) {
  if (!scores || typeof track !== 'string') {
    return [];
  }

  const cluster = determineRecommendedCluster(track, scores, riasecScores);
  const assignedElectives = getElectivesForCluster(track, cluster);
  return assignedElectives.map((name) => {
    const elective = electivesCatalog.find((entry) =>
      entry.name === name && entry.track === track && entry.cluster === cluster
    );

    return {
      name,
      track,
      category: cluster,
      reason: elective?.description || `Assigned to the ${cluster} cluster.`,
    };
  });
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
 * Get the two strongest independently scored RIASEC areas.
 */
export function getTopInterests(answers, questionsByCategory) {
  const grouped = normalizeGroupedQuestions(questionsByCategory);
  if (!grouped.Interests.length) {
    return [];
  }

  const riasecScores = calculateRiasecInterestScores(answers, grouped);

  return RIASEC_TYPES
    .map((type) => ({
      name: type,
      score: riasecScores[type] || 0,
    }))
    .filter((cluster) => cluster.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 2)
    .map((interest) => `${interest.name} (${Math.round(interest.score)}%)`);
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

    let questions = data || [];
    if (!questions.length) {
      const { data: typedQuestions, error: typedError } = await supabase
        .from('assessment_questions')
        .select('id, question, options, correct_answer, category, interest_type')
        .in('category', RIASEC_TYPES)
        .order('id', { ascending: true });

      if (typedError) throw typedError;
      questions = typedQuestions || [];
    }

    return normalizeGroupedQuestions(questions.reduce((grouped, question) => {
      const category = question.category === 'Interests'
        ? question.interest_type || question.category
        : question.category;
      grouped[category] ||= [];
      grouped[category].push(question);
      return grouped;
    }, {}));
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

    return calculateAptitudeScores(answers, groupedQuestions);
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

    const riasecScores = calculateRiasecInterestScores(answers, groupedQuestions);
    const track = determineTrack(scores, riasecScores);
    const recommendedCluster = determineRecommendedCluster(track, scores, riasecScores);
    const clusterScores = calculateClusterScores(track, scores, riasecScores);
    const trackRecommendation = calculateTrackRecommendation(scores, riasecScores);
    const electiveRecommendations = recommendElectiveDetails(track, scores, riasecScores);
    const electives = electiveRecommendations.map((elective) => elective.name);
    const topDomains = getTopDomains(scores);
    const topInterests = getTopInterests(answers, groupedQuestions);

    return {
      scores,
      riasecScores,
      academicAptitudeScore: trackRecommendation.academicAptitudeScore,
      trackScores: trackRecommendation.trackScores,
      clusterScores,
      recommended_track: track,
      recommended_cluster: recommendedCluster,
      elective_1: electives[0] || null,
      ...(electives[1] ? { elective_2: electives[1] } : {}),
      top_domains: topDomains,
      top_interests: topInterests,
      track,
      cluster: recommendedCluster,
      recommendedCluster,
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
