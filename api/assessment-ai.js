import electives from "../src/data/electives.js";

console.log(
  "ENV:",
  process.env.GROQ_API_KEY
    ? "GROQ_API_KEY is set"
    : process.env.OPENROUTER_API_KEY
    ? "OPENROUTER_API_KEY is set"
    : "Assessment AI key is missing"
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

function findElectiveByName(name, rankedElectives) {
  const normalizedName = String(name || "").toLowerCase().trim();

  return (
    rankedElectives.find((elective) => elective.name.toLowerCase() === normalizedName) ||
    rankedElectives.find((elective) => elective.name.toLowerCase().includes(normalizedName)) ||
    rankedElectives.find((elective) => normalizedName.includes(elective.name.toLowerCase()))
  );
}

function getStrongestDomain(data) {
  const domains = [
    { label: "verbal and communication skills", score: toScore(data.VA) },
    { label: "mathematical ability", score: toScore(data.MA) },
    { label: "scientific and technical aptitude", score: toScore(data.SA) },
    { label: "logical reasoning", score: toScore(data.LRA) },
  ];

  return domains.sort((first, second) => second.score - first.score)[0];
}

function buildFallbackRecommendation(data, rankedElectives) {
  const savedElectives = Array.isArray(data.electives)
    ? data.electives.map((elective) => String(elective || "").trim()).filter(Boolean)
    : [];
  const selectedElectives = savedElectives.length
    ? savedElectives.map((name) => ({
        ...(findElectiveByName(name, rankedElectives) || {}),
        name,
      }))
    : rankedElectives.slice(0, 2);
  const [firstElective = rankedElectives[0], secondElective = rankedElectives[1]] = selectedElectives;
  const strongestDomain = getStrongestDomain(data);
  const courses = Array.from(
    new Set(
      [firstElective, secondElective]
        .flatMap((elective) => elective?.relatedCourses || [])
        .filter(Boolean)
    )
  );
  const careerPathways = [firstElective, secondElective]
    .filter(Boolean)
    .map((elective) => ({
      category: elective.group || elective.category || elective.name,
      careers: (elective.careerPathways || []).slice(0, 4),
    }))
    .filter((pathway) => pathway.careers.length > 0);

  return {
    recommendedTrack: data.track,
    trackExplanation: `The ${data.track} Track fits you because your assessment shows strength in ${strongestDomain.label}, with a score of ${strongestDomain.score}%. This track gives you a learning path where those strengths can be used in both core subjects and specialized preparation.`,
    elective1: firstElective?.name || "",
    elective1Explanation: `${firstElective?.name || "This elective"} matches your profile because it connects with your strongest assessment areas and supports the direction of the ${data.track} Track.`,
    elective2: secondElective?.name || "",
    elective2Explanation: `${secondElective?.name || "This elective"} is a good second option because it adds another specialization that works with your interests, aptitude scores, and future study goals.`,
    overallAnalysis: `Your result points toward the ${data.track} Track with electives that can help you turn your strengths into clearer college and career options.`,
    suggestedCollegeCourses: courses,
    careerPathways,
  };
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const data = request.body || {};
  const rankedElectives = rankElectivesForAssessment(data);
  const fallbackRecommendation = buildFallbackRecommendation(data, rankedElectives);
  const provider = process.env.GROQ_API_KEY ? "groq" : "openrouter";
  const apiKey =
    provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY;
  const apiUrl =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";
  const model =
    provider === "groq"
      ? process.env.GROQ_MODEL || "llama-3.1-8b-instant"
      : process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free";

  if (!apiKey) {
    return sendJson(response, 200, {
      success: true,
      result: fallbackRecommendation,
      fallback: true,
    });
  }

  try {
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

SAVED ELECTIVES TO EXPLAIN, IF PROVIDED:
${Array.isArray(data.electives) && data.electives.length ? JSON.stringify(data.electives) : "None"}

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
If saved electives are provided and they are valid for the determined track, explain those saved electives instead of replacing them.

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

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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

    const completion = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("Assessment AI provider error:", completion);
      return sendJson(response, 200, {
        success: true,
        result: fallbackRecommendation,
        fallback: true,
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
    return sendJson(response, 200, {
      success: true,
      result: fallbackRecommendation,
      fallback: true,
    });
  }
}
