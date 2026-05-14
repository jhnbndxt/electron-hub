export interface AssessmentAiPayload {
  track: string;
  VA: number;
  MA: number;
  SA: number;
  LRA: number;
  academicInterest: number;
  communicationInterest: number;
  creativeInterest: number;
  leadershipInterest: number;
  technicalInterest: number;
  socialInterest: number;
  electives?: string[];
}

export interface AssessmentAiRecommendation {
  recommendedTrack?: string;
  trackExplanation?: string;
  elective1?: string;
  elective1Explanation?: string;
  elective2?: string;
  elective2Explanation?: string;
  overallAnalysis?: string;
  suggestedCollegeCourses?: string[];
  careerPathways?: Array<{ category: string; careers: string[] }>;
  raw?: string;
}

async function postAssessmentAi(url: string, payload: AssessmentAiPayload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Assessment AI request failed");
  }

  return data?.result || null;
}

export async function requestAssessmentAiRecommendation(
  payload: AssessmentAiPayload
): Promise<AssessmentAiRecommendation | null> {
  const urls = ["/api/assessment-ai", "http://localhost:3001/api/assessment-ai"];

  for (const url of urls) {
    try {
      const recommendation = await postAssessmentAi(url, payload);

      if (recommendation && !recommendation.raw) {
        return recommendation;
      }
    } catch (error) {
      console.warn(`Assessment AI request failed for ${url}:`, error);
    }
  }

  return null;
}
