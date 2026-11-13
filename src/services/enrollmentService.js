import { supabase } from '../supabase';
import { validateDocumentFile } from '../utils/documentValidation';

/**
 * Enrollment Service
 * Handles all enrollment-related operations with Supabase
 */

// Save enrollment draft
export const saveDraft = async (userId, draftData) => {
  try {
    const { data, error } = await supabase
      .from('enrollment_drafts')
      .upsert(
        {
          user_id: userId,
          draft_data: draftData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select();

    if (error) {
      console.error('Save draft error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Save draft error:', error);
    return { error: error.message, data: null };
  }
};

// Load enrollment draft
export const loadDraft = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('enrollment_drafts')
      .select('draft_data')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No record found - this is okay for new users
      return { error: null, data: null };
    }

    if (error) {
      console.error('Load draft error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data: data?.draft_data || null };
  } catch (error) {
    console.error('Load draft error:', error);
    return { error: error.message, data: null };
  }
};

// Check if enrollment already submitted
export const checkExistingEnrollment = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error('Check enrollment error:', error);
      return { error: error.message, data: null };
    }

    const latestEnrollment = data?.[0] || null;
    const inactiveStatuses = new Set(['rejected', 'dropped', 'unenrolled', 'removed']);

    if (!latestEnrollment || inactiveStatuses.has(String(latestEnrollment.status || '').toLowerCase())) {
      return { error: null, data: null };
    }

    return { error: null, data: latestEnrollment };
  } catch (error) {
    console.error('Check enrollment error:', error);
    return { error: error.message, data: null };
  }
};

// Submit enrollment
export const submitEnrollment = async (
  userId,
  enrollmentData,
  documentFiles = {},
  existingEnrollmentId = null
) => {
  try {
    const currentYear = new Date().getFullYear();
    const hasValidGraduationYear = (year) => {
      const value = String(year || "");
      return /^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= currentYear;
    };

    if (!hasValidGraduationYear(enrollmentData?.primaryYearGraduated) || !hasValidGraduationYear(enrollmentData?.secondaryYearGraduated)) {
      return { error: "Select valid four-digit graduation years that are not in the future.", data: null };
    }

    const enrollmentQuery = existingEnrollmentId
      ? supabase
          .from('enrollments')
          .update({
            status: 'pending_documents',
            form_data: enrollmentData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEnrollmentId)
          .eq('user_id', userId)
      : supabase.from('enrollments').insert({
          user_id: userId,
          enrollment_date: new Date().toISOString(),
          status: 'pending_documents',
          form_data: enrollmentData,
        });

    const { data: enrollment, error: enrollmentError } = await enrollmentQuery
      .select()
      .single();

    if (enrollmentError) {
      console.error('Enrollment insert error:', enrollmentError);
      return { error: enrollmentError.message, data: null };
    }

    const documentUploadErrors = [];
    if (documentFiles && Object.keys(documentFiles).length > 0) {
      for (const [docType, file] of Object.entries(documentFiles)) {
        if (file) {
          const { error: docError } = await uploadDocument(enrollment.id, file, docType);
          if (docError) {
            console.error(`Document upload failed for ${docType}:`, docError);
            documentUploadErrors.push({ documentType: docType, error: docError });
          }
        }
      }
    }

    if (documentUploadErrors.length > 0) {
      const failures = documentUploadErrors
        .map(({ documentType, error }) => `${documentType}: ${error}`)
        .join('; ');
      return {
        error: `Enrollment was saved, but some documents could not be uploaded: ${failures}`,
        data: enrollment,
        documentUploadErrors,
      };
    }

    // Clear draft after successful submission
    const { error: clearError } = await supabase
      .from('enrollment_drafts')
      .delete()
      .eq('user_id', userId);

    if (clearError) {
      console.error('Clear draft error:', clearError);
    }

    return { error: null, data: enrollment };
  } catch (error) {
    console.error('Submit enrollment error:', error);
    return { error: error.message, data: null };
  }
};

// Get user's latest enrollment
export const getUserEnrollment = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `
        *,
        enrollment_documents(*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error && error.code === 'PGRST116') {
      // No enrollment found
      return { error: null, data: null };
    }

    if (error) {
      console.error('Get enrollment error:', error);
      return { error: error.message, data: null };
    }

    const latestEnrollment = data?.[0] || null;
    const inactiveStatuses = new Set(['rejected', 'dropped', 'unenrolled', 'removed']);

    if (!latestEnrollment || inactiveStatuses.has(String(latestEnrollment.status || '').toLowerCase())) {
      return { error: null, data: null };
    }

    return { error: null, data: latestEnrollment };
  } catch (error) {
    console.error('Get enrollment error:', error);
    return { error: error.message, data: null };
  }
};

// Update enrollment status
export const updateEnrollmentStatus = async (enrollmentId, status) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      console.error('Update status error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Update status error:', error);
    return { error: error.message, data: null };
  }
};

// Upload document file to Supabase Storage
export const uploadDocument = async (enrollmentId, file, documentType) => {
  try {
    const validationError = validateDocumentFile(file);
    if (validationError) {
      return { error: validationError, data: null };
    }
    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${enrollmentId}/${documentType}/${timestamp}.${fileExt}`;

    const { data: existingDoc, error: existingDocError } = await supabase
      .from('enrollment_documents')
      .select('id, status')
      .eq('enrollment_id', enrollmentId)
      .eq('document_type', documentType)
      .maybeSingle();

    if (existingDocError) {
      console.error('Existing document lookup error:', existingDocError);
      return { error: existingDocError.message, data: null };
    }

    // Upload file to Supabase storage
    const { error: storageError } = await supabase.storage
      .from('enrollment_documents')
      .upload(fileName, file, { upsert: true });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return { error: storageError.message, data: null };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('enrollment_documents')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl || null;

    const documentPayload = {
      file_name: file.name,
      file_path: fileName,
      file_url: publicUrl,
      file_size: file.size || null,
      status: existingDoc?.status === 'rejected' ? 'reuploaded' : 'pending_review',
      updated_at: new Date().toISOString(),
    };
    const isMissingFileSizeColumn = (error) =>
      /file_size.*enrollment_documents|enrollment_documents.*file_size/i.test(String(error?.message || error || ''));

    const saveDocumentRecord = async (includeFileSize = true) => {
      const payload = { ...documentPayload };
      if (!includeFileSize) {
        delete payload.file_size;
      }

      if (existingDoc?.id) {
        return supabase
          .from('enrollment_documents')
          .update({ ...payload, rejection_comment: null })
          .eq('id', existingDoc.id)
          .select()
          .single();
      }

      return supabase
        .from('enrollment_documents')
        .insert({
          enrollment_id: enrollmentId,
          document_type: documentType,
          ...payload,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();
    };

    let { data: dbData, error: dbError } = await saveDocumentRecord(true);

    // Existing deployments may predate the optional file_size column. Retry
    // without metadata so a valid student document is never blocked while the
    // schema migration is being applied.
    if (dbError && isMissingFileSizeColumn(dbError)) {
      console.warn('enrollment_documents.file_size is unavailable; saving document without size metadata.');
      ({ data: dbData, error: dbError } = await saveDocumentRecord(false));
    }

    if (dbError) {
      console.error('Document db insert error:', dbError);
      return { error: dbError.message, data: null };
    }

    return { error: null, data: dbData };
  } catch (error) {
    console.error('Upload document error:', error);
    return { error: error.message, data: null };
  }
};

// Delete enrollment draft
export const deleteDraft = async (userId) => {
  try {
    const { error } = await supabase
      .from('enrollment_drafts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Delete draft error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete draft error:', error);
    return { error: error.message };
  }
};
