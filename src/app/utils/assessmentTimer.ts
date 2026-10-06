export const SECONDS_PER_ASSESSMENT_QUESTION = 30;
export const FIVE_MINUTES_IN_SECONDS = 5 * 60;

export function getAssessmentDurationSeconds(questionCount: number): number {
  return Math.max(0, questionCount) * SECONDS_PER_ASSESSMENT_QUESTION;
}

export function getRemainingAssessmentSeconds(startedAt: number, questionCount: number, now = Date.now()): number {
  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  return Math.max(0, getAssessmentDurationSeconds(questionCount) - elapsedSeconds);
}

export function formatAssessmentDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
