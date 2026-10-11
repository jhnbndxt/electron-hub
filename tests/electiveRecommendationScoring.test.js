import assert from 'node:assert/strict';
import test from 'node:test';
import { getElectivesForCluster } from '../src/data/electives.js';
import {
  calculateAptitudeScores,
  calculateClusterScores,
  calculateRiasecScores,
  getRiasecResponseScore,
  calculateTrackRecommendation,
  determineRecommendedCluster,
} from '../src/utils/electiveRecommendationScoring.js';

const allAptitudeScores = {
  verbal: 100,
  math: 100,
  science: 100,
  logical: 100,
};

const allRiasecScores = {
  Realistic: 100,
  Investigative: 100,
  Artistic: 100,
  Social: 100,
  Enterprising: 100,
  Conventional: 100,
};

test('calculates aptitude scores from the active question count in each category', () => {
  const scores = calculateAptitudeScores(
    { 1: 0, 2: 1, 3: 0, 4: 0, 5: 1, 6: 0, 7: 1, 8: 0, 9: 1, 10: 0 },
    {
      Verbal: [{ id: 1, correct_answer: 0 }, { id: 2, correct_answer: 1 }, { id: 3, correct_answer: 2 }],
      Math: [{ id: 4, correct_answer: 0 }, { id: 5, correct_answer: 0 }],
      Science: [
        { id: 6, correct_answer: 0 },
        { id: 7, correct_answer: 1 },
        { id: 8, correct_answer: 2 },
        { id: 9, correct_answer: 3 },
      ],
      Logical: [{ id: 10, correct_answer: 0 }],
    }
  );

  assert.equal(scores.verbal_ability_score, 66.67);
  assert.equal(scores.mathematical_ability_score, 50);
  assert.equal(scores.spatial_ability_score, 50);
  assert.equal(scores.logical_reasoning_score, 100);
  assert.equal(scores.overall_score, 66.67);
});

test('calculates each RIASEC percentage with its own active-question denominator', () => {
  const questions = [
    { id: 1, interest_type: 'Realistic', options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'] },
    { id: 2, interest_type: 'Realistic', options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'] },
    { id: 3, interest_type: 'Investigative', options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'] },
    { id: 4, interest_type: 'Artistic', options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'] },
  ];

  const scores = calculateRiasecScores({ 1: 4, 2: 3, 3: 2 }, questions);

  assert.equal(scores.Realistic, 90);
  assert.equal(scores.Investigative, 60);
  assert.equal(scores.Artistic, 0);
  assert.equal(scores.Social, 0);
  assert.equal(scores.Enterprising, 0);
  assert.equal(scores.Conventional, 0);
  assert.equal(getRiasecResponseScore(0, questions[0]), 1);
  assert.equal(getRiasecResponseScore(4, questions[0]), 5);
});

test('compares the specified academic and technical-professional aptitude formulas', () => {
  const result = calculateTrackRecommendation({
    verbal: 80,
    math: 60,
    science: 40,
    logical: 100,
  });

  assert.equal(result.academicAptitudeScore, 70);
  assert.equal(result.trackScores.academic, 60);
  assert.equal(result.trackScores.technicalProfessional, 80);
  assert.equal(result.track, 'Technical-Professional Electives');
});

test('uses relevant interests and aptitude as deterministic track tie-breakers', () => {
  const tiedAptitudes = { verbal: 50, math: 50, science: 50, logical: 50 };
  const technicalInterests = {
    Realistic: 100,
    Investigative: 100,
    Conventional: 100,
  };

  assert.equal(calculateTrackRecommendation(tiedAptitudes, technicalInterests).track, 'Technical-Professional Electives');
  assert.equal(calculateTrackRecommendation(tiedAptitudes, allRiasecScores).track, 'Academic Track');
});

test('scores only clusters in the selected track using the configured weighted dimensions', () => {
  const academicScores = calculateClusterScores('Academic Track', allAptitudeScores, allRiasecScores);
  const technicalScores = calculateClusterScores(
    'Technical-Professional Electives',
    allAptitudeScores,
    allRiasecScores
  );

  assert.deepEqual(Object.keys(academicScores), [
    'Business and Entrepreneurship',
    'Arts, Social Sciences, and Humanities',
    'Science, Technology, Engineering, and Mathematics (STEM)',
  ]);
  assert.deepEqual(Object.values(academicScores), [100, 100, 100]);
  assert.deepEqual(Object.keys(technicalScores), [
    'ICT Support and Computer Programming Technologies',
  ]);
  assert.equal(technicalScores['ICT Support and Computer Programming Technologies'], 100);
  assert.equal(
    determineRecommendedCluster('Technical-Professional Electives', allAptitudeScores, allRiasecScores),
    'ICT Support and Computer Programming Technologies'
  );
});

test('applies each cluster formula to its named aptitude and RIASEC dimensions', () => {
  const aptitude = { verbal: 10, math: 20, science: 30, logical: 40 };
  const interests = {
    Realistic: 50,
    Investigative: 60,
    Artistic: 70,
    Social: 80,
    Enterprising: 90,
    Conventional: 100,
  };

  assert.deepEqual(
    calculateClusterScores('Academic Track', aptitude, interests),
    {
      'Business and Entrepreneurship': 47,
      'Arts, Social Sciences, and Humanities': 45.5,
      'Science, Technology, Engineering, and Mathematics (STEM)': 31.2,
    }
  );
  assert.deepEqual(
    calculateClusterScores('Technical-Professional Electives', aptitude, interests),
    { 'ICT Support and Computer Programming Technologies': 38 }
  );
});

test('derives electives only from the selected cluster and omits ICT elective two', () => {
  assert.deepEqual(
    getElectivesForCluster('Academic Track', 'Science, Technology, Engineering, and Mathematics (STEM)'),
    ['Biology 1', 'Chemistry 1']
  );
  assert.deepEqual(
    getElectivesForCluster(
      'Technical-Professional Electives',
      'ICT Support and Computer Programming Technologies'
    ),
    ['Computer Programming']
  );
});
