import electives from "../src/data/electives.js";

console.log(
  "ENV:",
  process.env.GROQ_API_KEY ? "GROQ_API_KEY is set" : "GROQ_API_KEY is missing"
);

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sendJson(response, status, payload) {
  Object.entries(jsonHeaders).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  return response.status(status).json(payload);
}

function parseAiJson(text = "") {
  const cleanedText = String(text)
    .trim()
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    return {
      raw: cleanedText,
    };
  }
}

function toScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

function calculateElectiveScore(elective, data) {
  const weights = elective.weights || {};

  return (
    toScore(data.academicInterest) * (weights.academic || 0) +
    toScore(data.communicationInterest) * (weights.communication || 0) +
    toScore(data.creativeInterest) * (weights.creative || 0) +
    toScore(data.leadershipInterest) * (weights.leadership || 0) +
    toScore(data.technicalInterest) * (weights.technical || 0) +
    toScore(data.socialInterest) * (weights.social || 0) +
    toScore(data.VA) * (weights.verbal || 0) +
    toScore(data.MA) * (weights.math || 0) +
    toScore(data.SA) * (weights.science || 0) +
    toScore(data.LRA) * (weights.logical || 0)
  );
}

function rankElectivesForAssessment(data) {
  const trackElectives = electives.filter((elective) => elective.track === data.track);
  const sourceElectives = trackElectives.length ? trackElectives : electives;

  return sourceElectives
    .map((elective) => ({
      ...elective,
      compatibilityScore: Number(calculateElectiveScore(elective, data).toFixed(2)),
    }))
    .sort((first, second) => second.compatibilityScore - first.compatibilityScore)
    .slice(0, 10);
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  if (!process.env.GROQ_API_KEY) {
    return sendJson(response, 500, { error: "GROQ_API_KEY is not configured" });
  }

  try {
    const data = request.body || {};
    const rankedElectives = rankElectivesForAssessment(data);
    const prompt = `

You are an AI assessment recommendation system.

The student's track is already determined.

Your tasks:
1. Recommend ONLY the BEST 2 electives.
2. Explain why those electives fit the student.
3. Suggest possible college courses.
4. Match recommendations using:
   - aptitude scores
   - interest scores
   - strengths
   - compatibility
5. Ensure recommendations align with the student's determined track.

Track:
${data.track}

APTITUDE SCORES:
VA: ${data.VA}
MA: ${data.MA}
SA: ${data.SA}
LRA: ${data.LRA}

INTEREST SCORES:
Academic: ${data.academicInterest}
Communication: ${data.communicationInterest}
Creative: ${data.creativeInterest}
Leadership: ${data.leadershipInterest}
Technical: ${data.technicalInterest}
Social: ${data.socialInterest}

TOP MATCHING ELECTIVES:
${JSON.stringify(rankedElectives)}

Choose electives based on:
- strongest aptitude scores
- strongest interest scores
- compatibilityScore
- elective weights
- elective idealFor fields
- elective strengths
- related college courses and career pathways

IMPORTANT:
Electives must strongly align with the student's dominant interests and aptitude scores.
Do not recommend broad or unrelated electives.
Prioritize electives with the highest compatibility scores.
Use ONLY electives from TOP MATCHING ELECTIVES.
Ensure the chosen electives match the student's determined track.

Return ONLY VALID JSON using this exact format:

IMPORTANT:
Return ONLY raw JSON.
Do not use markdown.
Do not wrap in triple backticks.
Do not add explanations outside JSON.

{
  "recommendedTrack": "",

  "trackExplanation": "",

  "elective1": "",

  "elective1Explanation": "",

  "elective2": "",

  "elective2Explanation": "",

  "overallAnalysis": "",

  "suggestedCollegeCourses": [],

  "careerPathways": [
    {
      "category": "",
      "careers": [
        "",
        ""
      ]
    }
  ]
}

Requirements:
- Choose ONLY the BEST 2 electives.
- Use ONLY electives from TOP MATCHING ELECTIVES.
- Match electives based on strongest aptitude and interest scores.
- Prioritize electives with highest compatibility scores.
- Avoid unrelated or weak recommendations.
- Keep explanations concise and personalized.
- trackExplanation must explain WHY the track fits the student based on aptitude and interests.
- elective1Explanation must explain WHY elective 1 matches the student's strengths and interests.
- elective2Explanation must explain WHY elective 2 matches the student's strengths and interests.
- overallAnalysis must provide a career/academic assessment summary.
- suggestedCollegeCourses must list college programs aligned with the track and electives.
- careerPathways must be grouped by specialization/category.
- Each careerPathways category should contain related career opportunities.
- Avoid duplicate careerPathways categories.
- Make explanations professional, student-friendly, and guidance-oriented.
- Use the student's aptitude scores and interest scores in the reasoning.
- Ensure explanations are not generic.
- Speak directly to the student using second-person perspective.
- Use "you" instead of "the student".
- Make the explanation sound like a guidance counselor talking personally to the student.
- Keep the tone supportive, professional, and personalized.
- Avoid robotic or repetitive wording.
- Keep explanations natural and conversational.
- Avoid overly technical or AI-sounding phrases.

`;
    const input = prompt.trim();

    if (!input) {
      return sendJson(response, 400, {
        error: "Assessment prompt or assessment data is required",
      });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are Electron Hub's AI assessment assistant. Return only valid JSON with no markdown formatting.",
          },
          {
            role: "user",
            content: input,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    const completion = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq API error:", completion);
      return sendJson(response, groqResponse.status, {
        success: false,
        error: completion?.error?.message || "Groq API request failed",
      });
    }

    const reply = String(completion.choices?.[0]?.message?.content || "")
      .trim()
      .replace(/```json/g, "")
      .replace(/```/g, "");

    const parsedResult = parseAiJson(reply);

    return sendJson(response, 200, {
      success: true,
      result: parsedResult,
    });
  } catch (error) {
    console.error("Assessment AI error:", error);
    return sendJson(response, 500, {
      success: false,
      error: "Unable to generate assessment recommendation",
    });
  }
}
