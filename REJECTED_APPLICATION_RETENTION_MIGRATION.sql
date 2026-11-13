-- Rejected application retention and safe deletion controls.
-- Run this migration in the Supabase SQL editor after STUDENT_AUTH_RLS_MIGRATION.sql.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- Existing rejected records start their retention period from their latest
-- known change. Future rejections receive an exact timestamp from the trigger.
UPDATE public.enrollments
SET rejected_at = COALESCE(updated_at, created_at, now())
WHERE lower(COALESCE(status, '')) = 'rejected'
  AND rejected_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_enrollment_rejected_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF lower(COALESCE(NEW.status, '')) = 'rejected'
     AND lower(COALESCE(OLD.status, '')) IS DISTINCT FROM 'rejected' THEN
    NEW.rejected_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollments_set_rejected_at ON public.enrollments;
CREATE TRIGGER enrollments_set_rejected_at
BEFORE UPDATE OF status ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.set_enrollment_rejected_at();

CREATE INDEX IF NOT EXISTS enrollments_rejected_retention_idx
  ON public.enrollments (rejected_at)
  WHERE lower(COALESCE(status, '')) = 'rejected';

-- Staff may manually delete only already-rejected applications. The function
-- performs the status condition in SQL, so it remains safe if the UI is stale.
CREATE OR REPLACE FUNCTION public.delete_rejected_enrollment(p_enrollment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF public.current_app_user_role() NOT IN ('registrar', 'branchcoordinator', 'superadmin') THEN
    RAISE EXCEPTION 'Only authorized staff can delete rejected applications';
  END IF;

  DELETE FROM public.enrollments
  WHERE id = p_enrollment_id
    AND lower(COALESCE(status, '')) = 'rejected';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count = 1;
END;
$$;

-- Called automatically when either Pending Applications dashboard loads. It
-- never matches pending, approved, or processing records.
CREATE OR REPLACE FUNCTION public.cleanup_expired_rejected_enrollments(p_retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
DECLARE
  deleted_count integer;
  safe_retention_days integer := GREATEST(1, LEAST(COALESCE(p_retention_days, 90), 3650));
BEGIN
  IF public.current_app_user_role() NOT IN ('registrar', 'branchcoordinator', 'superadmin') THEN
    RAISE EXCEPTION 'Only authorized staff can expire rejected applications';
  END IF;

  DELETE FROM public.enrollments
  WHERE lower(COALESCE(status, '')) = 'rejected'
    AND COALESCE(rejected_at, updated_at, created_at) < now() - make_interval(days => safe_retention_days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_rejected_enrollment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_rejected_enrollments(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_rejected_enrollment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rejected_enrollments(integer) TO authenticated;

INSERT INTO public.system_settings (setting_key, setting_value, description, setting_type)
VALUES (
  'rejected_application_retention_days',
  '90',
  'Number of days rejected applications are retained before they are permanently removed.',
  'number'
)
ON CONFLICT (setting_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
