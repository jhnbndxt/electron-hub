-- Run after SUPABASE_SCHEMA.sql and PUBLIC_ASSESSMENT_SCHEMA_UPDATE.sql.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
  ON public.users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

UPDATE public.users AS app_user
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE app_user.auth_user_id IS NULL
  AND auth_user.email_confirmed_at IS NOT NULL
  AND lower(app_user.email) = lower(auth_user.email);

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
  SELECT app_user.id
  FROM public.users AS app_user
  WHERE app_user.auth_user_id = (SELECT auth.uid())
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
  SELECT app_user.role::text
  FROM public.users AS app_user
  WHERE app_user.auth_user_id = (SELECT auth.uid())
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_role() TO authenticated;

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT
  USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS users_select_admin ON public.users;
CREATE POLICY users_select_admin ON public.users FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS users_insert_admin ON public.users;
CREATE POLICY users_insert_admin ON public.users FOR INSERT
  WITH CHECK (public.current_app_user_role() IN ('branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS users_insert_auth_linked_student ON public.users;
CREATE POLICY users_insert_auth_linked_student ON public.users FOR INSERT
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND role = 'student'
    AND lower(email) = lower((SELECT auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS users_update_admin ON public.users;
CREATE POLICY users_update_admin ON public.users FOR UPDATE
  USING (public.current_app_user_role() IN ('branchcoordinator', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS users_delete_admin ON public.users;
CREATE POLICY users_delete_admin ON public.users FOR DELETE
  USING (public.current_app_user_role() IN ('branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS system_settings_select_admin ON public.system_settings;
CREATE POLICY system_settings_select_admin ON public.system_settings FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS system_settings_insert_admin ON public.system_settings;
CREATE POLICY system_settings_insert_admin ON public.system_settings FOR INSERT
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS system_settings_update_admin ON public.system_settings;
CREATE POLICY system_settings_update_admin ON public.system_settings FOR UPDATE
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS system_settings_delete_admin ON public.system_settings;
CREATE POLICY system_settings_delete_admin ON public.system_settings FOR DELETE
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS enrollments_select_own ON public.enrollments;
CREATE POLICY enrollments_select_own ON public.enrollments FOR SELECT
  USING (student_id = public.current_app_user_id());

DROP POLICY IF EXISTS enrollments_select_admin ON public.enrollments;
CREATE POLICY enrollments_select_admin ON public.enrollments FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS enrollments_insert_own ON public.enrollments;
CREATE POLICY enrollments_insert_own ON public.enrollments FOR INSERT
  WITH CHECK (student_id = public.current_app_user_id());

DROP POLICY IF EXISTS enrollments_update_admin ON public.enrollments;
CREATE POLICY enrollments_update_admin ON public.enrollments FOR UPDATE
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS enrollment_documents_select_own ON public.enrollment_documents;
CREATE POLICY enrollment_documents_select_own ON public.enrollment_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = enrollment_documents.enrollment_id
        AND enrollments.student_id = public.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS enrollment_documents_insert_own ON public.enrollment_documents;
CREATE POLICY enrollment_documents_insert_own ON public.enrollment_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = enrollment_documents.enrollment_id
        AND enrollments.student_id = public.current_app_user_id()
    )
    AND coalesce(verified, false) = false
    AND verified_by IS NULL
    AND status IN ('pending_review', 'reuploaded')
  );

DROP POLICY IF EXISTS enrollment_documents_update_own ON public.enrollment_documents;
CREATE POLICY enrollment_documents_update_own ON public.enrollment_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = enrollment_documents.enrollment_id
        AND enrollments.student_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = enrollment_documents.enrollment_id
        AND enrollments.student_id = public.current_app_user_id()
    )
    AND coalesce(verified, false) = false
    AND verified_by IS NULL
    AND status IN ('pending_review', 'reuploaded')
  );

DROP POLICY IF EXISTS enrollment_documents_select_staff ON public.enrollment_documents;
CREATE POLICY enrollment_documents_select_staff ON public.enrollment_documents FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS enrollment_documents_update_staff ON public.enrollment_documents;
CREATE POLICY enrollment_documents_update_staff ON public.enrollment_documents FOR UPDATE
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS enrollment_progress_select_own ON public.enrollment_progress;
CREATE POLICY enrollment_progress_select_own ON public.enrollment_progress FOR SELECT
  USING (student_id = public.current_app_user_id());

DROP POLICY IF EXISTS enrollment_progress_write_own ON public.enrollment_progress;
CREATE POLICY enrollment_progress_write_own ON public.enrollment_progress FOR ALL
  USING (student_id = public.current_app_user_id())
  WITH CHECK (student_id = public.current_app_user_id());

DROP POLICY IF EXISTS enrollment_progress_select_staff ON public.enrollment_progress;
CREATE POLICY enrollment_progress_select_staff ON public.enrollment_progress FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS enrollment_progress_update_staff ON public.enrollment_progress;
CREATE POLICY enrollment_progress_update_staff ON public.enrollment_progress FOR UPDATE
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS enrollment_progress_insert_staff ON public.enrollment_progress;
CREATE POLICY enrollment_progress_insert_staff ON public.enrollment_progress FOR INSERT
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS notifications_insert_staff ON public.notifications;
CREATE POLICY notifications_insert_staff ON public.notifications FOR INSERT
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own ON public.payments FOR SELECT
  USING (student_id = public.current_app_user_id());

DROP POLICY IF EXISTS payments_insert_own ON public.payments;
CREATE POLICY payments_insert_own ON public.payments FOR INSERT
  WITH CHECK (student_id = public.current_app_user_id());

DROP POLICY IF EXISTS payments_select_staff ON public.payments;
CREATE POLICY payments_select_staff ON public.payments FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS payments_update_staff ON public.payments;
CREATE POLICY payments_update_staff ON public.payments FOR UPDATE
  USING (public.current_app_user_role() IN ('branchcoordinator', 'cashier', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS audit_logs_select_staff ON public.audit_logs;
CREATE POLICY audit_logs_select_staff ON public.audit_logs FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS audit_logs_insert_staff ON public.audit_logs;
CREATE POLICY audit_logs_insert_staff ON public.audit_logs FOR INSERT
  WITH CHECK (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS assessment_results_insert_student_own ON public.assessment_results;
CREATE POLICY assessment_results_insert_student_own ON public.assessment_results FOR INSERT
  WITH CHECK (
    student_id = public.current_app_user_id()
    AND source = 'student'
  );

DROP POLICY IF EXISTS assessment_results_select_student_own ON public.assessment_results;
CREATE POLICY assessment_results_select_student_own ON public.assessment_results FOR SELECT
  USING (student_id = public.current_app_user_id());

DROP POLICY IF EXISTS assessment_results_select_staff ON public.assessment_results;
CREATE POLICY assessment_results_select_staff ON public.assessment_results FOR SELECT
  USING (public.current_app_user_role() IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS assessment_results_update_staff ON public.assessment_results;
CREATE POLICY assessment_results_update_staff ON public.assessment_results FOR UPDATE
  USING (public.current_app_user_role() IN ('branchcoordinator', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS assessment_results_link_public_registration ON public.assessment_results;
CREATE POLICY assessment_results_link_public_registration ON public.assessment_results FOR UPDATE
  USING (
    source = 'public'
    AND student_id IS NULL
    AND lower(public_email) = lower((SELECT auth.jwt() ->> 'email'))
  )
  WITH CHECK (
    source = 'public'
    AND student_id = public.current_app_user_id()
    AND lower(public_email) = lower((SELECT auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS assessment_results_delete_staff ON public.assessment_results;
CREATE POLICY assessment_results_delete_staff ON public.assessment_results FOR DELETE
  USING (public.current_app_user_role() IN ('branchcoordinator', 'superadmin'));

DROP POLICY IF EXISTS payment_queue_select_staff ON public.payment_queue;
CREATE POLICY payment_queue_select_staff ON public.payment_queue FOR SELECT
  USING (public.current_app_user_role() IN ('branchcoordinator', 'cashier', 'superadmin'));

DROP POLICY IF EXISTS payment_queue_update_staff ON public.payment_queue;
CREATE POLICY payment_queue_update_staff ON public.payment_queue FOR UPDATE
  USING (public.current_app_user_role() IN ('branchcoordinator', 'cashier', 'superadmin'))
  WITH CHECK (public.current_app_user_role() IN ('branchcoordinator', 'cashier', 'superadmin'));
