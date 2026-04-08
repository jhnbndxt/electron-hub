/**
 * Dynamic Assessment Scoring Service
 * 
 * Flexible scoring system that works with ANY number of questions
 * Automatically scales based on database question counts
 * 
 * Features:
 * - Dynamically fetch question counts per category
 * - Calculate scores normalized to 0-100
 * - Support for future question additions without code changes
 * - Handle variable question counts per category
 */

import { supabase } from '../supabase';

/**
 * Get question count stats for all categories
 * Used to normalize scoring
 */
export async function getQuestionStats() {
  try {
    const { data, error } = await supabase
      .from('assessment_question_stats')
      .select('*');

    if (error) throw error;

    // Convert to object for easy lookup
    const stats = {};
    data?.forEach(row => {
      stats[row.category] = row.question_count;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching question stats:', error);
    return null;
  }
}

/**
 * Get all questions grouped by category
 */
export async function getQuestionsByCategory() {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('id, question, options, correct_answer, category')
      .order('category');

    if (error) throw error;

    // Group by category
    const grouped = {
      Verbal: [],
      Math: [],
      Science: [],
      Logical: [],
      Interests: []
    };

    data?.forEach(q => {
      if (grouped[q.category]) {
        grouped[q.category].push(q);
      }
    });

    return grouped;
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    return null;
  }
}

/**
 * Calculate scores dynamically based on:
 * - Student's answers
 * - Actual question counts in database
 * - Question-to-score mapping
 * 
 * Returns normalized scores (0-100 scale)
 */
export async function calculateDynamicScores(answers) {
  try {
    // Get question stats from database
    const stats = await getQuestionStats();
    if (!stats) {
      console.error('Could not fetch question statistics');
      return null;
    }

    // Get questions grouped by category
    const questionsByCategory = await getQuestionsByCategory();
    if (!questionsByCategory) {
      console.error('Could not fetch questions');
      return null;
    }

    console.log('📊 Question Stats:', stats);
    console.log('🎯 Student Answers:', answers);

    // Calculate correct answers per category
    const categoryScores = {};
    const categories = ['Verbal', 'Math', 'Science', 'Logical', 'Interests'];

    categories.forEach(category => {
      const questions = questionsByCategory[category];
      const totalQuestions = questions.length;

      if (totalQuestions === 0) {
        categoryScores[category] = 0;
        return;
      }

      // Count correct answers for this category
      let correctCount = 0;
      questions.forEach(q => {
        // Check if answer matches correct_answer
        if (answers[q.id] === q.correct_answer) {
          correctCount++;
        }
      });

      // Normalize to 0-100 scale
      const score = Math.round((correctCount / totalQuestions) * 100);
      categoryScores[category] = score;

      console.log(`${category}: ${correctCount}/${totalQuestions} = ${score}/100`);
    });

    // Calculate overall score (average of all domains)
    const allScores = Object.values(categoryScores);
    const overallScore = Math.round(
      allScores.reduce((a, b) => a + b, 0) / allScores.length
    );

    // Calculate domain scores for Supabase storage
    const scores = {
      verbal_ability_score: categoryScores.Verbal,
      mathematical_ability_score: categoryScores.Math,
      spatial_ability_score: categoryScores.Science,
      logical_reasoning_score: categoryScores.Logical,
      overall_score: overallScore
    };

    console.log('✅ Final Scores:', scores);
    return scores;
  } catch (error) {
    console.error('Error calculating dynamic scores:', error);
    return null;
  }
}

/**
 * Determine recommended track based on scores
 * Can be customized as needed
 */
export function determineTrack(scores) {
  if (!scores) return 'General';

  const { verbal_ability_score, mathematical_ability_score, logical_reasoning_score } = scores;
  const stemScore = (mathematical_ability_score + logical_reasoning_score) / 2;
  const humanitiesScore = verbal_ability_score;

  return stemScore > humanitiesScore ? 'STEM' : 'Humanities';
}

/**
 * Recommend electives based on top scores
 */
export function recommendElectives(scores) {
  if (!scores) return ['General Studies I', 'General Studies II'];

  const scoreArray = [
    { name: 'Verbal', score: scores.verbal_ability_score },
    { name: 'Mathematics', score: scores.mathematical_ability_score },
    { name: 'Science', score: scores.spatial_ability_score },
    { name: 'Logical Reasoning', score: scores.logical_reasoning_score }
  ];

  scoreArray.sort((a, b) => b.score - a.score);
  return scoreArray.slice(0, 2).map(s => s.name);
}

/**
 * Get top 2 domains from scores
 */
export function getTopDomains(scores) {
  if (!scores) return [];

  const domains = [
    { name: 'Verbal', score: scores.verbal_ability_score },
    { name: 'Math', score: scores.mathematical_ability_score },
    { name: 'Science', score: scores.spatial_ability_score },
    { name: 'Logical', score: scores.logical_reasoning_score }
  ];

  domains.sort((a, b) => b.score - a.score);
  return domains.slice(0, 2).map(d => d.name);
}

/**
 * Get student's top interest areas
 */
export function getTopInterests(answers, questionsByCategory) {
  if (!questionsByCategory?.Interests) return [];

  // For Interests category, just return the most selected options
  const interestQuestions = questionsByCategory.Interests;
  const selectedInterests = {};

  interestQuestions.forEach(q => {
    const selectedOption = answers[q.id];
    if (selectedOption !== undefined && q.options) {
      const interest = q.options[selectedOption];
      selectedInterests[interest] = (selectedInterests[interest] || 0) + 1;
    }
  });

  const sorted = Object.entries(selectedInterests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([interest]) => interest);

  return sorted.length > 0 ? sorted : ['General Interest'];
}

/**
 * Format assessment result for Supabase storage
 */
export async function formatAssessmentResult(answers, userEmail) {
  try {
    const scores = await calculateDynamicScores(answers);
    if (!scores) return null;

    const questionsByCategory = await getQuestionsByCategory();
    const track = determineTrack(scores);
    const electives = recommendElectives(scores);
    const topDomains = getTopDomains(scores);
    const topInterests = getTopInterests(answers, questionsByCategory);

    return {
      scores,
      recommended_track: track,
      elective_1: electives[0],
      elective_2: electives[1],
      top_domains: topDomains,
      top_interests: topInterests,
      // Legacy compatibility
      track,
      electives
    };
  } catch (error) {
    console.error('Error formatting assessment result:', error);
    return null;
  }
}
