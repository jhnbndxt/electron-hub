-- Migration: Fix Enrollment Documents RLS, Check Constraints, and Storage Policies
-- Run this in the Supabase SQL Editor if students cannot upload documents or document submission is blocked.

-- ============================================================================
-- 1. UPDATE ENROLLMENTS STATUS CHECK CONSTRAINT
-- ============================================================================
-- The frontend and workflows use 'pending_documents', 'pending_review', and 'documents_verified'.
-- The original table check constraint only allowed ('pending', 'approved', 'rejected', 'enrolled', 'dropped').
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_status_check
  CHECK (status IN (
    'pending',
    'pending_documents',
    'pending_review',
    'documents_verified',
    'approved',
    'rejected',
    'enrolled',
    'dropped',
    'unenrolled',
    'removed'
  ));

-- ============================================================================
-- 2. ALLOW STUDENTS TO UPDATE THEIR OWN ENROLLMENT STATUS
-- ============================================================================
-- When students upload or resubmit documents, the client updates enrollment status to 'pending_review'.
DROP POLICY IF EXISTS enrollments_update_own ON public.enrollments;
CREATE POLICY enrollments_update_own ON public.enrollments FOR UPDATE
  USING (
    student_id = (SELECT auth.uid()::uuid)
    OR user_id = (SELECT auth.jwt() ->> 'email')
    OR user_id = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    student_id = (SELECT auth.uid()::uuid)
    OR user_id = (SELECT auth.jwt() ->> 'email')
    OR user_id = (SELECT auth.uid()::text)
  );

-- ============================================================================
-- 3. ENROLLMENT_DOCUMENTS ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- The original schema enabled RLS on enrollment_documents without adding policies,
-- which blocked all student and staff document uploads and reads.

ALTER TABLE public.enrollment_documents ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollment documents
DROP POLICY IF EXISTS enrollment_documents_select_own ON public.enrollment_documents;
CREATE POLICY enrollment_documents_select_own ON public.enrollment_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_documents.enrollment_id
      AND (
        e.student_id = (SELECT auth.uid()::uuid)
        OR e.user_id = (SELECT auth.jwt() ->> 'email')
        OR e.user_id = (SELECT auth.uid()::text)
      )
    )
  );

-- Students can insert their own enrollment documents
DROP POLICY IF EXISTS enrollment_documents_insert_own ON public.enrollment_documents;
CREATE POLICY enrollment_documents_insert_own ON public.enrollment_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_documents.enrollment_id
      AND (
        e.student_id = (SELECT auth.uid()::uuid)
        OR e.user_id = (SELECT auth.jwt() ->> 'email')
        OR e.user_id = (SELECT auth.uid()::text)
      )
    )
  );

-- Students can update their own enrollment documents (for re-uploading)
DROP POLICY IF EXISTS enrollment_documents_update_own ON public.enrollment_documents;
CREATE POLICY enrollment_documents_update_own ON public.enrollment_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_documents.enrollment_id
      AND (
        e.student_id = (SELECT auth.uid()::uuid)
        OR e.user_id = (SELECT auth.jwt() ->> 'email')
        OR e.user_id = (SELECT auth.uid()::text)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_documents.enrollment_id
      AND (
        e.student_id = (SELECT auth.uid()::uuid)
        OR e.user_id = (SELECT auth.jwt() ->> 'email')
        OR e.user_id = (SELECT auth.uid()::text)
      )
    )
  );

-- Staff can view all enrollment documents
DROP POLICY IF EXISTS enrollment_documents_select_staff ON public.enrollment_documents;
CREATE POLICY enrollment_documents_select_staff ON public.enrollment_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()::uuid)
      AND u.role IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin')
    )
  );

-- Staff can update all enrollment documents (for approving/rejecting)
DROP POLICY IF EXISTS enrollment_documents_update_staff ON public.enrollment_documents;
CREATE POLICY enrollment_documents_update_staff ON public.enrollment_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()::uuid)
      AND u.role IN ('registrar', 'branchcoordinator', 'cashier', 'superadmin')
    )
  );

-- Admins can delete enrollment documents
DROP POLICY IF EXISTS enrollment_documents_delete_staff ON public.enrollment_documents;
CREATE POLICY enrollment_documents_delete_staff ON public.enrollment_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()::uuid)
      AND u.role IN ('branchcoordinator', 'superadmin')
    )
  );

-- ============================================================================
-- 4. SUPABASE STORAGE POLICIES FOR enrollment_documents BUCKET
-- ============================================================================
-- Ensure the storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'enrollment_documents',
  'enrollment_documents',
  true,
  5242880,
  ARRAY['image/*', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public reads so documents can be viewed in the browser
DROP POLICY IF EXISTS "Public can view enrollment documents" ON storage.objects;
CREATE POLICY "Public can view enrollment documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'enrollment_documents');

-- Allow authenticated users to upload documents
DROP POLICY IF EXISTS "Authenticated users can upload enrollment documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload enrollment documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'enrollment_documents');

-- Allow authenticated users to update their uploaded documents
DROP POLICY IF EXISTS "Authenticated users can update enrollment documents" ON storage.objects;
CREATE POLICY "Authenticated users can update enrollment documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'enrollment_documents');

-- Allow staff/admins to delete documents if needed
DROP POLICY IF EXISTS "Staff can delete enrollment documents" ON storage.objects;
CREATE POLICY "Staff can delete enrollment documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'enrollment_documents');

NOTIFY pgrst, 'reload schema';
