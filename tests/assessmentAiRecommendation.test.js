import assert from 'node:assert/strict';
import test from 'node:test';
import assessmentAiHandler from '../api/assessment-ai.js';

test('keeps ICT recommendation to its single cluster-assigned elective', async () => {
  const previousGroqKey = process.env.GROQ_API_KEY;
  const previousOpenRouterKey = process.env.OPENROUTER_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  const response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return payload;
    },
  };

  try {
    await assessmentAiHandler({
      method: 'POST',
      body: {
        track: 'Technical-Professional Electives',
        cluster: 'ICT Support and Computer Programming Technologies',
        electives: ['Computer Programming'],
        VA: 50,
        MA: 70,
        SA: 60,
        LRA: 80,
        trackScores: { academic: 60, technicalProfessional: 75 },
        clusterScores: { 'ICT Support and Computer Programming Technologies': 70 },
        riasecScores: {},
      },
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.result.elective1, 'Computer Programming');
    assert.equal(Object.hasOwn(response.payload.result, 'elective2'), false);
    assert.equal(Object.hasOwn(response.payload.result, 'elective2Explanation'), false);
  } finally {
    if (previousGroqKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousGroqKey;
    if (previousOpenRouterKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousOpenRouterKey;
  }
});
