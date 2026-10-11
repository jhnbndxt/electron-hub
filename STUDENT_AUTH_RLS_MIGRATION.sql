-- Run after SUPABASE_SCHEMA.sql and PUBLIC_ASSESSMENT_SCHEMA_UPDATE.sql.
-- This migration only changes users and assessment_results; it does not assume
-- that other deployed tables have the same columns as the base schema.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_picture_url text;

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

NOTIFY pgrst, 'reload schema';
