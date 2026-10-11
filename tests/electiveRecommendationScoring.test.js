import assert from 'node:assert/strict';
import test from 'node:test';
import electives, { ELECTIVE_STRUCTURE } from '../src/data/electives.js';
import { scoreElectiveRecommendation } from '../src/utils/electiveRecommendationScoring.js';

test('every configured elective has a profile and produces finite recommendation scores', () => {
  const scores = {
    verbal_ability_score: 80,
    mathematical_ability_score: 75,
    spatial_ability_score: 70,
    logical_reasoning_score: 85,
  };
  const interestClusters = {
    academic: 80,
    tech: 70,
    business: 60,
    helping: 65,
    creative: 75,
    practical: 50,
    home: 40,
    outdoor: 35,
    physical: 45,
  };

  for (const track of ELECTIVE_STRUCTURE) {
    for (const cluster of track.clusters) {
      for (const name of cluster.electives) {
        const elective = electives.find(
          (entry) => entry.name === name && entry.track === track.track && entry.cluster === cluster.name
        );

        assert.ok(elective, `Expected ${name} to exist in ${track.track} / ${cluster.name}`);

        const recommendation = scoreElectiveRecommendation(elective, { scores, interestClusters });
        assert.ok(Number.isFinite(recommendation.finalScore), `${name} compatibility score should be finite`);
        assert.ok(Number.isFinite(recommendation.aptitudeFit), `${name} aptitude score should be finite`);
        assert.ok(Number.isFinite(recommendation.riasecFit), `${name} RIASEC score should be finite`);
      }
    }
  }
});
