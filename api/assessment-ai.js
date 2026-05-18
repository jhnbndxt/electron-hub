import electives from "../src/data/electives.js";
import {
  selectElectivesWithPrerequisites,
  validateElectiveSequence,
} from "../src/utils/electivePrerequisites.js";

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

function buildElectiveTieBreaker(elective, data) {
  const seed = [
    elective?.name,
    data.track,
    toScore(data.academicInterest),
    toScore(data.communicationInterest),
    toScore(data.creativeInterest),
    toScore(data.leadershipInterest),
    toScore(data.technicalInterest),
    toScore(data.socialInterest),
    toScore(data.VA),
    toScore(data.MA),
    toScore(data.SA),
    toScore(data.LRA),
  ].join("|");

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }

  return hash / 1000003;
}

function rankElectivesForAssessment(data) {
  const trackElectives = electives.filter((elective) => elective.track === data.track);
  const sourceElectives = trackElectives.length ? trackElectives : electives;

  return sourceElectives
    .map((elective) => ({
      ...elective,
      compatibilityScore: Number(calculateElectiveScore(elective, data).toFixed(2)),
      tieBreaker: buildElectiveTieBreaker(elective, data),
    }))
    .sort((first, second) => {
      const scoreDifference = second.compatibilityScore - first.compatibilityScore;

      if (Math.abs(scoreDifference) > 0.0001) {
        return scoreDifference;
      }

      return second.tieBreaker - first.tieBreaker;
    })
    .slice(0, 20);
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

function getStrongestInterests(data) {
  return [
    { label: "academic interests", score: toScore(data.academicInterest) },
    { label: "communication and people-oriented interests", score: toScore(data.communicationInterest) },
    { label: "creative interests", score: toScore(data.creativeInterest) },
    { label: "leadership and business interests", score: toScore(data.leadershipInterest) },
    { label: "technical interests", score: toScore(data.technicalInterest) },
    { label: "social and helping interests", score: toScore(data.socialInterest) },
  ]
    .filter((interest) => interest.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 2);
}

function formatList(items = [], fallback = "related fields") {
  const values = Array.from(new Set(items.filter(Boolean)));

  if (!values.length) {
    return fallback;
  }

  if (values.length === 1) {
    return values[0];
  }

  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function buildElectiveExplanation(elective, data, positionLabel) {
  const strongestDomain = getStrongestDomain(data);
  const strongestInterests = getStrongestInterests(data);
  const interestSummary = formatList(
    strongestInterests.map((interest) => `${interest.label} (${interest.score}%)`),
    "your interest profile"
  );
  const strengths = formatList(elective?.strengths || [], "the skills used in this subject");
  const idealFor = formatList(elective?.idealFor || [], "your assessment profile");
  const courses = formatList(elective?.relatedCourses || [], "related college programs");
  const careers = formatList(elective?.careerPathways || [], "future career opportunities");

  return `${positionLabel} is recommended because your ${strongestDomain.label} score (${strongestDomain.score}%) and ${interestSummary} connect well with ${idealFor}. This elective is about ${elective?.group || elective?.category || "a specialized learning area"} and builds strengths such as ${strengths}. You can expect learning activities that develop subject knowledge, applied skills, problem solving, and career awareness connected to this field. Possible future pathways include college courses such as ${courses}, as well as opportunities like ${careers}.`;
}

function buildFallbackRecommendation(data, rankedElectives) {
  const savedElectives = Array.isArray(data.electives)
    ? data.electives.map((elective) => String(elective || "").trim()).filter(Boolean)
    : [];
  const validSavedSequence =
    savedElectives.length === 2 &&
    validateElectiveSequence(savedElectives[0], savedElectives[1], electives.map((elective) => elective.name)).valid;
  const selectedElectives = validSavedSequence
    ? savedElectives.map((name) => ({
        ...(findElectiveByName(name, rankedElectives) || {}),
        name,
      }))
    : selectElectivesWithPrerequisites(rankedElectives, 2);
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
    elective1Explanation: buildElectiveExplanation(firstElective, data, firstElective?.name || "Elective 1"),
    elective2: secondElective?.name || "",
    elective2Explanation: buildElectiveExplanation(secondElective, data, secondElective?.name || "Elective 2"),
    overallAnalysis: `Your result points toward the ${data.track} Track with electives that can help you turn your strengths into clearer college and career options.`,
    suggestedCollegeCourses: courses,
    careerPathways,
  };
}

function removeFinalizedWording(text = "") {
  return String(text)
    .replace(/you have already saved/gi, "this recommendation includes")
    .replace(/you already saved/gi, "this recommendation includes")
    .replace(/saved as one of your electives/gi, "recommended as one of your electives")
    .replace(/saved elective/gi, "recommended elective")
    .trim();
}

function normalizeRecommendationResult(result, fallbackRecommendation, rankedElectives) {
  if (!result || result.raw) {
    return result;
  }

  const availableElectives = electives.map((elective) => elective.name);
  const elective1 = String(result.elective1 || "").trim();
  const elective2 = String(result.elective2 || "").trim();
  const sequenceValidation = validateElectiveSequence(elective1, elective2, availableElectives);
  const firstElective = findElectiveByName(elective1, rankedElectives);
  const secondElective = findElectiveByName(elective2, rankedElectives);
  const useFallbackElectives = !sequenceValidation.valid || !firstElective || !secondElective;

  return {
    ...result,
    elective1: useFallbackElectives ? fallbackRecommendation.elective1 : elective1,
    elective2: useFallbackElectives ? fallbackRecommendation.elective2 : elective2,
    elective1Explanation: removeFinalizedWording(
      useFallbackElectives ? fallbackRecommendation.elective1Explanation : result.elective1Explanation
    ),
    elective2Explanation: removeFinalizedWording(
      useFallbackElectives ? fallbackRecommendation.elective2Explanation : result.elective2Explanation
    ),
    trackExplanation: removeFinalizedWording(result.trackExplanation || fallbackRecommendation.trackExplanation),
    overallAnalysis: removeFinalizedWording(result.overallAnalysis || fallbackRecommendation.overallAnalysis),
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
      ? process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
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
1. Recommend ONLY the BEST 2 electives, unless saved electives are provided.
2. Explain why those electives fit the student in detail.
3. Suggest possible college courses.
4. Match recommendations using:
   - aptitude scores
   - interest scores
   - strengths
   - compatibility
5. Ensure recommendations align with the student's determined track.

Track:
${data.track}

LOCAL SCORING ELECTIVES TO EXPLAIN, IF PROVIDED:
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
Prioritize electives with the highest compatibility scores, but treat all valid electives as eligible and do not favor any elective because of list order, popularity, or familiarity.
Use ONLY electives from TOP MATCHING ELECTIVES.
Ensure the chosen electives match the student's determined track.
If local scoring electives are provided and they are valid for the determined track and prerequisite sequence, explain those recommendations instead of replacing them.
Never say the student has already saved, finalized, chosen, or enrolled in an elective. Use recommendation-based wording such as "This elective is recommended..." or "This option fits your results...".
Prerequisite rule: any Level 2 elective, including names ending in " 2" or using a pattern like "Subject 2: Topic", must only appear as elective2 when the matching Level 1 elective is elective1. Examples: Chemistry 2 requires Chemistry 1 first; Biology 2 requires Biology 1 first; Human Movement 2: Motor Skills Development requires Human Movement 1: Basic Anatomy in Sports and Exercise first. Do not return Programming + Chemistry 2 or any unrelated Level 1 + Level 2 pair.

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
- Do not bias recommendations toward specific elective names, groups, or earlier list positions.
- Follow prerequisite order: elective1 must be the Level 1 prerequisite if elective2 is the matching Level 2 subject.
- Do not recommend any Level 2 elective unless its matching Level 1 elective is also recommended first.
- Avoid unrelated or weak recommendations.
- trackExplanation must explain WHY the track fits the student based on aptitude and interests.
- elective1Explanation must be detailed and include: why elective 1 was recommended from the assessment results, what the elective is about, what students can expect to learn or do, and possible career pathways, college courses, or future opportunities related to that elective.
- elective2Explanation must be detailed and include: why elective 2 was recommended from the assessment results, what the elective is about, what students can expect to learn or do, and possible career pathways, college courses, or future opportunities related to that elective.
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

Example output for tone and structure only:
Do not copy these elective names unless they are valid TOP MATCHING ELECTIVES for the actual student.

{
  "recommendedTrack": "Academic",
  "trackExplanation": "The Academic Track is recommended because your assessment shows strong science, mathematics, and logical reasoning results, with interests that connect well to structured academic and laboratory-based learning.",
  "elective1": "Chemistry 1",
  "elective1Explanation": "Chemistry 1 is recommended because your science, math, and logical reasoning results show that you may do well in a subject that uses analysis, precision, and laboratory thinking. This elective introduces important chemistry concepts such as matter, chemical reactions, measurement, laboratory safety, and scientific problem solving. You can expect to work with experiments, interpret data, practice careful observation, and build a foundation for science-related study. This elective can support college courses such as BS Chemistry, BS Chemical Engineering, BS Pharmacy, BS Medical Technology, and BS Nursing, with future pathways such as chemist, pharmacist, laboratory analyst, medical technologist, chemical engineer, or science researcher.",
  "elective2": "Chemistry 2",
  "elective2Explanation": "Chemistry 2 is recommended as the next step after Chemistry 1 because your results suggest readiness for deeper scientific analysis and more advanced laboratory work. This elective builds on foundational chemistry by exploring more complex chemical concepts, laboratory procedures, and applied problem-solving tasks. You can expect to strengthen your analytical thinking, handle more detailed experiments, and connect chemistry learning to health, engineering, and research fields. Related college courses include BS Chemistry, BS Chemical Engineering, BS Medical Technology, BS Pharmacy, and other science or health programs, with career pathways such as laboratory analyst, chemist, chemical engineer, pharmacist, medical technologist, researcher, or science educator.",
  "overallAnalysis": "Your results suggest that science-focused electives can help you build a strong pathway toward college programs and careers that use analysis, precision, laboratory skills, and problem solving.",
  "suggestedCollegeCourses": [
    "BS Chemistry",
    "BS Chemical Engineering",
    "BS Pharmacy",
    "BS Medical Technology",
    "BS Nursing"
  ],
  "careerPathways": [
    {
      "category": "Chemistry and Laboratory Science",
      "careers": [
        "Chemist",
        "Laboratory Analyst",
        "Research Assistant",
        "Science Educator"
      ]
    },
    {
      "category": "Health and Applied Science",
      "careers": [
        "Pharmacist",
        "Medical Technologist",
        "Healthcare Professional"
      ]
    }
  ]
}

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

    const parsedResult = normalizeRecommendationResult(
      parseAiJson(reply),
      fallbackRecommendation,
      rankedElectives
    );

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
