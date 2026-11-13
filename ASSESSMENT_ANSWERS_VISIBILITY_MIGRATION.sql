-- Run after STUDENT_AUTH_RLS_MIGRATION.sql and PUBLIC_ASSESSMENT_SCHEMA_UPDATE.sql.
-- The view is owned by the migration role so it can return only the safe summary
-- columns while the underlying assessment_results table remains policy-protected.

DROP POLICY IF EXISTS system_settings_select_student_assessment_visibility
  ON public.system_settings;
CREATE POLICY system_settings_select_student_assessment_visibility
  ON public.system_settings FOR SELECT
  USING (
    setting_key = 'assessment_answers_visible'
    AND public.current_app_user_role() = 'student'
  );

DROP POLICY IF EXISTS assessment_results_select_student_own
  ON public.assessmen t_results;
CREATE POLICY assessment_results_select_student_own
  ON public.assessment_results FOR SELECT
  USING (
    student_id = public.current_app_user_id()
    AND COALESCE(
      (
        SELECT lower(btrim(setting_value)) IN ('true', '1', 'yes', 'enabled', 'on')
        FROM public.system_settings
        WHERE setting_key = 'assessment_answers_visible'
        LIMIT 1
      ),
      true
    )
  );

CREATE OR REPLACE VIEW public.student_assessment_result_summary
WITH (security_barrier = true)
AS
SELECT
  id,
  student_id,
  assessment_date,
  recommended_track,
  recommended_cluster,
  elective_1,
  elective_2,
  created_at
FROM public.assessment_results
WHERE student_id = public.current_app_user_id();

REVOKE ALL ON public.student_assessment_result_summary FROM PUBLIC;
GRANT SELECT ON public.student_assessment_result_summary TO authenticated;

NOTIFY pgrst, 'reload schema';
