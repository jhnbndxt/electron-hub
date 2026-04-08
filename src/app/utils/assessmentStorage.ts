export interface AssessmentResult {
  id: string;
  date: string; // ISO date string
  track: string;
  electives: string[];
  scores: {
    VA: number;
    MA: number;
    SA: number;
    LRA: number;
  };
  topDomains: string[];
  topInterests: string[];
  overallScore: number; // Overall percentage score
}

export interface AssessmentHistory {
  results: AssessmentResult[];
}

/**
 * Get assessment history for a specific user
 */
export function getAssessmentHistory(userEmail: string): AssessmentHistory {
  const historyKey = `assessmentHistory_${userEmail}`;
  const historyData = localStorage.getItem(historyKey);
  
  if (historyData) {
    return JSON.parse(historyData);
  }
  
  return { results: [] };
}

/**
 * Save a new assessment result to history
 */
export function saveAssessmentResult(
  userEmail: string,
  result: Omit<AssessmentResult, 'id' | 'date'>
): void {
  const history = getAssessmentHistory(userEmail);
  
  const newResult: AssessmentResult = {
    ...result,
    id: generateId(),
    date: new Date().toISOString(),
  };
  
  // Add to beginning of array (most recent first)
  history.results.unshift(newResult);
  
  // Save to localStorage
  const historyKey = `assessmentHistory_${userEmail}`;
  localStorage.setItem(historyKey, JSON.stringify(history));
  
  // Also save as current assessment result (for backward compatibility)
  const assessmentKey = `assessmentResults_${userEmail}`;
  localStorage.setItem(
    assessmentKey,
    JSON.stringify({
      track: result.track,
      electives: result.electives,
      scores: result.scores,
      topDomains: result.topDomains,
      topInterests: result.topInterests,
    })
  );
}

/**
 * Get the most recent assessment result
 */
export function getLatestAssessmentResult(userEmail: string): AssessmentResult | null {
  const history = getAssessmentHistory(userEmail);
  return history.results.length > 0 ? history.results[0] : null;
}

/**
 * Generate a unique ID for assessment results
 */
function generateId(): string {
  return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for display
 */
export function formatAssessmentDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Clear all assessment history (utility for testing)
 */
export function clearAssessmentHistory(userEmail: string): void {
  const historyKey = `assessmentHistory_${userEmail}`;
  localStorage.removeItem(historyKey);
}