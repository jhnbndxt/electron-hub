import electives from "../src/data/electives.js";
import { DEFAULT_GROQ_MODEL, DEFAULT_OPENROUTER_MODEL } from "./ai-models.js";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sendJson(response, status, payload) {
  Object.entries(jsonHeaders).forEach(([key, value]) => response.setHeader(key, value));
  return response.status(status).json(payload);
}

function toScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
}

function formatList(items, fallback = "related fields") {
  const uniqueItems = Array.from(new Set(items.filter(Boolean)));
  if (!uniqueItems.length) return fallback;
  if (uniqueItems.length === 1) return uniqueItems[0];
  return `${uniqueItems.slice(0, -1).join(", ")} and ${uniqueItems.at(-1)}`;
}

function getAssignedElectives(data) {
  const requestedNames = Array.isArray(data.electives) ? data.electives : [];
  return requestedNames
    .map((name) => electives.find(
      (elective) =>
        elective.name === name &&
        elective.track === data.track &&
        elective.cluster === data.cluster
    ))
    .filter(Boolean);
}

function buildFallbackRecommendation(data) {
  const aptitude = [
    { name: "Verbal", score: toScore(data.VA) },
    { name: "Math", score: toScore(data.MA) },
    { name: "Science", score: toScore(data.SA) },
    { name: "Logical", score: toScore(data.LRA) },
  ];
  const strongestAptitudes = aptitude
    .sort((first, second) => second.score - first.score)
    .slice(0, 2)
    .map(({ name, score }) => `${name} (${Math.round(score)}%)`);
  const interests = Object.entries(data.riasecScores || {})
    .map(([name, score]) => ({ name, score: toScore(score) }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 2)
    .map(({ name, score }) => `${name} (${Math.round(score)}%)`);
  const assignedElectives = getAssignedElectives(data);
  const academicScore = toScore(data.trackScores?.academic);
  const technicalScore = toScore(data.trackScores?.technicalProfessional);
  const clusterScore = toScore(data.clusterScores?.[data.cluster]);
  const trackName = data.track === "Academic Track"
    ? "Academic Track"
    : "Technical-Professional Track";
  const trackExplanation =
    `Your ${trackName} recommendation follows your aptitude results. Its calculated track score is ${
      data.track === "Academic Track" ? academicScore : technicalScore
    }%, compared with ${
      data.track === "Academic Track" ? technicalScore : academicScore
    }% for the other track. Your strongest areas are ${formatList(strongestAptitudes)}.${
      interests.length ? ` Your strongest RIASEC interests are ${formatList(interests)}; these add context but do not override your aptitude-based track score.` : ""
    }`;
  const clusterExplanation = data.cluster
    ? `${data.cluster} is the highest-scoring cluster within your recommended track, with a calculated score of ${clusterScore}%. The cluster score combines its specified aptitude weights with the relevant RIASEC percentages${
        interests.length ? `, including your strongest interests in ${formatList(interests)}` : ""
      }.`
    : "A cluster could not be determined from the current track structure.";
  const electivesSummary = formatList(assignedElectives.map((elective) => elective.name));
  const overallAnalysis =
    `Your results point to ${trackName} and the ${data.cluster || "recommended"} cluster. ` +
    `${assignedElectives.length ? `${electivesSummary} are assigned by that cluster;` : "The cluster determines the elective assignment;"} ` +
    `they are not separately selected by AI. Consider how your strongest areas in ${formatList(strongestAptitudes)} connect with your interests and future study goals.`;
  const suggestedCollegeCourses = Array.from(new Set(
    assignedElectives.flatMap((elective) => elective.relatedCourses)
  ));
  const careerPathways = assignedElectives.map((elective) => ({
    category: elective.cluster,
    careers: elective.careerPathways,
  }));

  return {
    recommendedTrack: data.track,
    recommendedCluster: data.cluster || "",
    trackExplanation,
    clusterExplanation,
    elective1: assignedElectives[0]?.name || "",
    elective1Explanation: assignedElectives[0]?.description || "",
    ...(assignedElectives[1]
      ? {
          elective2: assignedElectives[1].name,
          elective2Explanation: assignedElectives[1].description,
        }
      : {}),
    overallAnalysis,
    suggestedCollegeCourses,
    careerPathways,
  };
}

function parseAiJson(content) {
  try {
    return JSON.parse(String(content || "").trim().replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

function mergeExplanation(result, fallback) {
  const safeText = (value, fallbackText) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, 3000) : fallbackText;

  return {
    ...fallback,
    trackExplanation: safeText(result?.trackExplanation, fallback.trackExplanation),
    clusterExplanation: safeText(result?.clusterExplanation, fallback.clusterExplanation),
    overallAnalysis: safeText(result?.overallAnalysis, fallback.overallAnalysis),
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
  if (!data.track || !data.cluster || !Array.isArray(data.electives)) {
    return sendJson(response, 400, {
      error: "A computed track, cluster, and cluster-assigned electives are required.",
    });
  }

  const fallbackRecommendation = buildFallbackRecommendation(data);
  const provider = process.env.GROQ_API_KEY ? "groq" : "openrouter";
  const apiKey = provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return sendJson(response, 200, {
      success: true,
      result: fallbackRecommendation,
      fallback: true,
    });
  }

  const apiUrl = provider === "groq"
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";
  const model = provider === "groq"
    ? process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL
    : process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;

  try {
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
            content: "You are a supportive, professional school guidance counselor. Return only valid JSON.",
          },
          {
            role: "user",
            content: `Explain this already-computed assessment in student-friendly, specific language.

Do not recalculate or change the track, cluster, scores, or electives. Do not recommend, remove, reorder, or invent electives. The assigned electives are determined only by the supplied cluster.

Computed recommendation:
${JSON.stringify({
              track: data.track,
              cluster: data.cluster,
              trackScores: data.trackScores,
              clusterScores: data.clusterScores,
              academicAptitudeScore: data.academicAptitudeScore,
              aptitudeScores: { verbal: data.VA, math: data.MA, science: data.SA, logical: data.LRA },
              riasecScores: data.riasecScores,
              assignedElectives: data.electives,
            })}

Write a helpful explanation of why the computed aptitude scores support this track, how the chosen cluster's aptitude and RIASEC strengths relate to the student, and what the assigned electives can help the student explore. RIASEC supports context and never overrides the computed track score. Do not claim scores or interests that are not in the input. Use "you" naturally and avoid promising career outcomes.

Return JSON with exactly these string keys: trackExplanation, clusterExplanation, overallAnalysis.`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    const completion = await aiResponse.json();
    if (!aiResponse.ok) {
      console.error("Assessment AI provider error:", completion);
      return sendJson(response, 200, { success: true, result: fallbackRecommendation, fallback: true });
    }

    const aiText = completion.choices?.[0]?.message?.content;
    const result = parseAiJson(aiText);
    if (!result || typeof result !== "object") {
      console.error("Assessment AI returned invalid explanation JSON");
      return sendJson(response, 200, { success: true, result: fallbackRecommendation, fallback: true });
    }

    return sendJson(response, 200, {
      success: true,
      result: mergeExplanation(result, fallbackRecommendation),
    });
  } catch (error) {
    console.error("Assessment AI explanation request failed:", error);
    return sendJson(response, 200, { success: true, result: fallbackRecommendation, fallback: true });
  }
}
