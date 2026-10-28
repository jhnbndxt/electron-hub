-- Remove a student's account-owned records, including legacy rows keyed by email.
-- Run this migration before deploying the matching user-management API.

CREATE OR REPLACE FUNCTION public.purge_student_account_data(
  p_student_id UUID,
  p_email TEXT,
  p_auth_user_id UUID DEFAULT NULL
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  enrollment_ids UUID[] := ARRAY[]::UUID[];
  account_table RECORD;
  delete_predicate TEXT;
BEGIN
  IF p_student_id IS NULL OR NULLIF(BTRIM(p_email), '') IS NULL THEN
    RAISE EXCEPTION 'A student ID and email are required to purge account data.';
  END IF;

  IF to_regclass('public.enrollments') IS NOT NULL THEN
    SELECT COALESCE(
      ARRAY_AGG((to_jsonb(enrollment_row) ->> 'id')::UUID),
      ARRAY[]::UUID[]
    )
    INTO enrollment_ids
    FROM public.enrollments AS enrollment_row
    WHERE LOWER(COALESCE(to_jsonb(enrollment_row) ->> 'student_id', '')) IN (
        LOWER(p_student_id::TEXT),
        LOWER(COALESCE(p_auth_user_id::TEXT, ''))
      )
      OR LOWER(COALESCE(to_jsonb(enrollment_row) ->> 'user_id', '')) IN (
        LOWER(p_student_id::TEXT),
        LOWER(COALESCE(p_auth_user_id::TEXT, '')),
        LOWER(p_email)
      )
      OR LOWER(COALESCE(to_jsonb(enrollment_row) ->> 'auth_user_id', '')) =
        LOWER(COALESCE(p_auth_user_id::TEXT, ''))
      OR LOWER(COALESCE(to_jsonb(enrollment_row) ->> 'firebase_uid', '')) =
        LOWER(COALESCE(p_auth_user_id::TEXT, ''))
      OR LOWER(COALESCE(to_jsonb(enrollment_row) ->> 'student_uid', '')) IN (
        LOWER(p_student_id::TEXT),
        LOWER(COALESCE(p_auth_user_id::TEXT, ''))
      )
      OR LOWER(COALESCE(to_jsonb(enrollment_row) ->> 'user_uid', '')) IN (
        LOWER(p_student_id::TEXT),
        LOWER(COALESCE(p_auth_user_id::TEXT, ''))
      );
  END IF;

  FOR account_table IN
    SELECT table_schema, table_name,
      BOOL_OR(column_name IN ('student_id', 'user_id', 'auth_user_id', 'firebase_uid', 'student_uid', 'user_uid')) AS has_account_id,
      BOOL_OR(column_name IN ('email', 'public_email', 'student_email')) AS has_account_email
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name <> 'users'
      AND table_name IN (
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
      )
      AND column_name IN (
        'student_id', 'user_id', 'auth_user_id', 'firebase_uid', 'student_uid', 'user_uid',
        'email', 'public_email', 'student_email'
      )
    GROUP BY table_schema, table_name
  LOOP
    delete_predicate := '';

    IF account_table.has_account_id THEN
      delete_predicate :=
        '(LOWER(COALESCE(to_jsonb(account_row) ->> ''student_id'', '''')) IN (LOWER($1::TEXT), LOWER(COALESCE($3::TEXT, '''')), LOWER($2)) ' ||
        'OR LOWER(COALESCE(to_jsonb(account_row) ->> ''user_id'', '''')) IN (LOWER($1::TEXT), LOWER(COALESCE($3::TEXT, '''')), LOWER($2)) ' ||
        'OR LOWER(COALESCE(to_jsonb(account_row) ->> ''auth_user_id'', '''')) = LOWER(COALESCE($3::TEXT, '''')) ' ||
        'OR LOWER(COALESCE(to_jsonb(account_row) ->> ''firebase_uid'', '''')) = LOWER(COALESCE($3::TEXT, '''')) ' ||
        'OR LOWER(COALESCE(to_jsonb(account_row) ->> ''student_uid'', '''')) IN (LOWER($1::TEXT), LOWER(COALESCE($3::TEXT, ''''))) ' ||
        'OR LOWER(COALESCE(to_jsonb(account_row) ->> ''user_uid'', '''')) IN (LOWER($1::TEXT), LOWER(COALESCE($3::TEXT, ''''))))';
    END IF;

    IF account_table.has_account_email THEN
      IF delete_predicate <> '' THEN
        delete_predicate := delete_predicate || ' OR ';
      END IF;
      delete_predicate := delete_predicate ||
        'LOWER(COALESCE(to_jsonb(account_row) ->> ''email'', '''')) = LOWER($2) ' ||
        'OR LOWER(COALESCE(to_jsonb(account_row) ->> ''public_email'', '''')) = LOWER($2) ' ||
        'OR LOWER(COALESCE(to_jsonb(account_row) ->> ''student_email'', '''')) = LOWER($2)';
    END IF;

    EXECUTE FORMAT(
      'DELETE FROM %I.%I AS account_row WHERE %s',
      account_table.table_schema,
      account_table.table_name,
      delete_predicate
    )
    USING p_student_id, p_email, p_auth_user_id;
  END LOOP;

  RETURN enrollment_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_student_account_data(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_student_account_data(UUID, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.purge_student_account_data(UUID, TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_student_account_data(UUID, TEXT, UUID) TO service_role;
