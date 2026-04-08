import supabase from '../supabase';

/**
 * Admin Service
 * Handles all admin-related database operations with Supabase
 */

// Get all pending applications (enrollments with status pending_documents or pending_review)
export const getPendingApplications = async () => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        user_id,
        form_data,
        status,
        enrollment_date,
        enrollment_documents(*)
      `
      )
      .in('status', ['pending_documents', 'pending_review'])
      .order('enrollment_date', { ascending: false });

    if (error) {
      console.error('Get pending applications error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Get pending applications error:', error);
    return { error: error.message, data: null };
  }
};

// Get all enrolled students
export const getEnrolledStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        user_id,
        form_data,
        status,
        enrollment_date,
        users(id, email, full_name)
      `
      )
      .eq('status', 'enrolled')
      .order('enrollment_date', { ascending: false });

    if (error) {
      console.error('Get enrolled students error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Get enrolled students error:', error);
    return { error: error.message, data: null };
  }
};

// Get single student enrollment details
export const getStudentEnrollment = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        user_id,
        form_data,
        status,
        enrollment_date,
        updated_at,
        enrollment_documents(*)
      `
      )
      .eq('user_id', userId)
      .order('enrollment_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      return { error: null, data: null };
    }

    if (error) {
      console.error('Get student enrollment error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Get student enrollment error:', error);
    return { error: error.message, data: null };
  }
};

// Update enrollment status
export const updateEnrollmentStatus = async (enrollmentId, newStatus, notes = null) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        notes,
      })
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

// Approve enrollment (transition to next step)
export const approveEnrollment = async (enrollmentId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: 'documents_verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      console.error('Approve enrollment error:', error);
      return { error: error.message, data: null };
    }

    // Create audit log
    await createAuditLog(
      'admin',
      'ENROLLMENT_APPROVED',
      `Approved enrollment: ${enrollmentId}`,
      'success'
    );

    return { error: null, data };
  } catch (error) {
    console.error('Approve enrollment error:', error);
    return { error: error.message, data: null };
  }
};

// Reject enrollment
export const rejectEnrollment = async (enrollmentId, reason) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      console.error('Reject enrollment error:', error);
      return { error: error.message, data: null };
    }

    // Create audit log
    await createAuditLog(
      'admin',
      'ENROLLMENT_REJECTED',
      `Rejected enrollment: ${enrollmentId} - Reason: ${reason}`,
      'warning'
    );

    return { error: null, data };
  } catch (error) {
    console.error('Reject enrollment error:', error);
    return { error: error.message, data: null };
  }
};

// Enroll student (finalize enrollment after payment verification)
export const enrollStudent = async (enrollmentId, userId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: 'enrolled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      console.error('Enroll student error:', error);
      return { error: error.message, data: null };
    }

    // Create audit log
    await createAuditLog(
      'admin',
      'STUDENT_ENROLLED',
      `Student enrolled: ${userId} (Enrollment: ${enrollmentId})`,
      'success'
    );

    return { error: null, data };
  } catch (error) {
    console.error('Enroll student error:', error);
    return { error: error.message, data: null };
  }
};

// Update document status
export const updateDocumentStatus = async (documentId, status, notes = null) => {
  try {
    const { data, error } = await supabase
      .from('enrollment_documents')
      .update({
        status,
        review_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('Update document status error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Update document status error:', error);
    return { error: error.message, data: null };
  }
};

// Get document verification status for enrollment
export const getDocumentVerificationStatus = async (enrollmentId) => {
  try {
    const { data, error } = await supabase
      .from('enrollment_documents')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('document_type');

    if (error) {
      console.error('Get document verification error:', error);
      return { error: error.message, data: null };
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      approved: data?.filter(d => d.status === 'approved').length || 0,
      rejected: data?.filter(d => d.status === 'rejected').length || 0,
      pending: data?.filter(d => d.status === 'pending_review').length || 0,
    };
    stats.allApproved = stats.approved === stats.total && stats.total > 0;

    return { error: null, data, stats };
  } catch (error) {
    console.error('Get document verification error:', error);
    return { error: error.message, data: null };
  }
};

// Get enrollment progress for user
export const getEnrollmentProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('enrollment_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    if (error && error.code !== 'PGRST116') {
      console.error('Get progress error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data: data || [] };
  } catch (error) {
    console.error('Get progress error:', error);
    return { error: error.message, data: null };
  }
};

// Create audit log entry
export const createAuditLog = async (userId, action, details, status = 'info') => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        details,
        status,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create audit log error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Create audit log error:', error);
    return { error: error.message, data: null };
  }
};

// Get audit logs
export const getAuditLogs = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get audit logs error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return { error: error.message, data: null };
  }
};

// Get payment verification for student
export const getStudentPaymentStatus = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error('Get payment status error:', error);
      return { error: error.message, data: null };
    }

    const payment = data?.[0] || null;
    return { 
      error: null, 
      data: payment,
      isVerified: payment?.status === 'completed',
      isPending: payment?.status === 'pending',
    };
  } catch (error) {
    console.error('Get payment status error:', error);
    return { error: error.message, data: null };
  }
};

// Get all payments for review
export const getAllPayments = async (status = null) => {
  try {
    let query = supabase
      .from('payments')
      .select(
        `
        id,
        user_id,
        amount,
        status,
        payment_method,
        created_at,
        reference_number
      `
      );

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Get all payments error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Get all payments error:', error);
    return { error: error.message, data: null };
  }
};

// Update payment status
export const updatePaymentStatus = async (paymentId, status, verifiedBy = 'admin') => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        verified_at: status === 'completed' ? new Date().toISOString() : null,
        verified_by: verifiedBy,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Update payment status error:', error);
      return { error: error.message, data: null };
    }

    // Create audit log
    await createAuditLog(
      'admin',
      'PAYMENT_VERIFIED',
      `Payment verified: ${paymentId} - Status: ${status}`,
      'success'
    );

    return { error: null, data };
  } catch (error) {
    console.error('Update payment status error:', error);
    return { error: error.message, data: null };
  }
};

// Get analytics dashboard data
export const getDashboardAnalytics = async () => {
  try {
    const [enrollmentsRes, paymentsRes, auditRes] = await Promise.all([
      supabase.from('enrollments').select('id, status'),
      supabase.from('payments').select('id, status'),
      supabase.from('audit_logs').select('id, action', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .limit(50),
    ]);

    const stats = {
      totalEnrollments: enrollmentsRes.data?.length || 0,
      pendingEnrollments: enrollmentsRes.data?.filter(e => e.status === 'pending_documents' || e.status === 'pending_review').length || 0,
      enrolledStudents: enrollmentsRes.data?.filter(e => e.status === 'enrolled').length || 0,
      pendingPayments: paymentsRes.data?.filter(p => p.status === 'pending').length || 0,
      totalVerifiedPayments: paymentsRes.data?.filter(p => p.status === 'completed').length || 0,
      recentActivities: auditRes.data?.length || 0,
    };

    return { error: null, data: stats };
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return { error: error.message, data: null };
  }
};
