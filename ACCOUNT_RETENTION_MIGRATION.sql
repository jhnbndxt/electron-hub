-- Record when accounts are deactivated and permanently purge accounts after 30 days.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

UPDATE public.users
SET deactivated_at = NOW()
WHERE status = 'inactive'
  AND deactivated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_expired_deactivations
  ON public.users (deactivated_at)
  WHERE status = 'inactive';

CREATE OR REPLACE FUNCTION public.delete_expired_deactivated_accounts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expired_account RECORD;
  deleted_count INTEGER := 0;
  deleted_user_count INTEGER;
BEGIN
  FOR expired_account IN
    SELECT id, email
    FROM public.users
    WHERE status = 'inactive'
      AND deactivated_at <= NOW() - INTERVAL '30 days'
  LOOP
    IF expired_account.email IS NOT NULL THEN
      DELETE FROM auth.users
      WHERE LOWER(email) = LOWER(expired_account.email);
    END IF;

    DELETE FROM public.users
    WHERE id = expired_account.id
      AND status = 'inactive'
      AND deactivated_at <= NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_user_count = ROW_COUNT;
    deleted_count := deleted_count + deleted_user_count;
  END LOOP;

  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_expired_deactivated_accounts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_expired_deactivated_accounts() FROM anon;
REVOKE ALL ON FUNCTION public.delete_expired_deactivated_accounts() FROM authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'delete-expired-deactivated-accounts';

SELECT cron.schedule(
  'delete-expired-deactivated-accounts',
  '15 3 * * *',
  'SELECT public.delete_expired_deactivated_accounts();'
);
