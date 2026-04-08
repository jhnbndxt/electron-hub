import supabase from '../supabase';

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

    const hasEnrollment = data && data.length > 0;
    return { error: null, data: hasEnrollment ? data[0] : null };
  } catch (error) {
    console.error('Check enrollment error:', error);
    return { error: error.message, data: null };
  }
};

// Submit enrollment
export const submitEnrollment = async (userId, enrollmentData, documentFiles = {}) => {
  try {
    // Insert main enrollment record
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        enrollment_date: new Date().toISOString(),
        status: 'pending_documents',
        form_data: enrollmentData,
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Enrollment insert error:', enrollmentError);
      return { error: enrollmentError.message, data: null };
    }

    // Upload documents if provided
    if (documentFiles && Object.keys(documentFiles).length > 0) {
      for (const [docType, file] of Object.entries(documentFiles)) {
        if (file) {
          const { error: docError } = await uploadDocument(enrollment.id, file, docType);
          if (docError) {
            console.error(`Document upload error for ${docType}:`, docError);
            return { error: docError, data: null };
          }
        }
      }
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

    return { error: null, data: data?.[0] || null };
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
    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${enrollmentId}/${documentType}/${timestamp}.${fileExt}`;

    // Upload file to Supabase storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('enrollment_documents')
      .upload(fileName, file);

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return { error: storageError.message, data: null };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('enrollment_documents')
      .getPublicUrl(fileName);

    // Record in database
    const { data: dbData, error: dbError } = await supabase
      .from('enrollment_documents')
      .insert({
        enrollment_id: enrollmentId,
        document_type: documentType,
        file_name: file.name,
        file_path: urlData.publicUrl,
        status: 'pending_review',
      })
      .select()
      .single();

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
