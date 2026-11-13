export function canViewAssessmentAnswers(settingsResult) {
  return (
    settingsResult?.source === 'supabase' &&
    settingsResult.data?.assessment_answers_visible === true
  );
}

export function getAssessmentResultTable(includeAnswerDetails) {
  return includeAnswerDetails
    ? 'assessment_results'
    : 'student_assessment_result_summary';
}
