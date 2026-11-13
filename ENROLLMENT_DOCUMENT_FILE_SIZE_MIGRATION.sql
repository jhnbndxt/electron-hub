-- Fix deployed databases created before enrollment_documents.file_size existed.
-- Safe to run more than once in the Supabase SQL Editor.

ALTER TABLE public.enrollment_documents
  ADD COLUMN IF NOT EXISTS file_size bigint;

NOTIFY pgrst, 'reload schema';
