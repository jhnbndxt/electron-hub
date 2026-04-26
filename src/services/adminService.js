import { supabase } from '../supabase';

/**
 * Admin Service
 * Handles all admin-related database operations with Supabase
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FINALIZED_PAYMENT_STATUSES = new Set(['completed', 'verified', 'approved', 'paid']);

const normalizeAuditSeverity = (status = 'success') => {
  const normalizedStatus = String(status || 'success').trim().toLowerCase();

  if (['failed', 'failure', 'error'].includes(normalizedStatus)) {
    return 'failed';
  }

  if (normalizedStatus === 'warning') {
    return 'warning';
  }

  if (normalizedStatus === 'info') {
    return 'info';
  }

  return 'success';
};

const toDatabaseAuditStatus = (status = 'success') => {
  return normalizeAuditSeverity(status) === 'failed' ? 'failure' : 'success';
};

const buildAuditDetails = (details, fallbackAction = '') => {
  if (typeof details === 'string') {
    return details;
  }

  if (details == null) {
    return fallbackAction || '';
  }

  try {
    return JSON.stringify(details);
  } catch (_error) {
    return String(details);
  }
};

const mapAuditLogRecord = (log, userMap = new Map()) => {
  const changes = log?.changes && typeof log.changes === 'object' && !Array.isArray(log.changes)
    ? log.changes
    : {};
  const severity = normalizeAuditSeverity(changes.severity || log?.status);
  const user = log?.user_id ? userMap.get(log.user_id) : null;
  const actorReference = typeof changes.actor_reference === 'string' ? changes.actor_reference : '';
  const actorLabel = typeof changes.actor_label === 'string' ? changes.actor_label : '';
  const actorEmail = typeof changes.actor_email === 'string' ? changes.actor_email : '';
  const userName =
    user?.full_name ||
    actorLabel ||
    (actorReference && !actorReference.includes('@') ? actorReference : '') ||
    actorEmail ||
    (log?.user_id ? 'Unknown User' : 'System');
  const email = user?.email || actorEmail || (actorReference.includes('@') ? actorReference : '');
  const details = buildAuditDetails(
    changes.details || changes.message || log?.error_message,
    log?.action || ''
  );

  return {
    ...log,
    user: userName,
    user_name: userName,
    email,
    user_role: user?.role || changes.actor_role || 'System',
    timestamp: log?.created_at,
    created_at: log?.created_at,
    details,
    status: severity,
  };
};

export const resolveUserId = async (userReference) => {
  try {
    const normalizedReference = String(userReference || '').trim();

    if (!normalizedReference) {
      return null;
    }

    if (UUID_PATTERN.test(normalizedReference)) {
      return normalizedReference;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedReference)
      .maybeSingle();

    if (error) {
      console.error('Resolve user ID error:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Resolve user ID error:', error);
    return null;
  }
};

export const resolveUserEmail = async (userReference) => {
  try {
    const normalizedReference = String(userReference || '').trim();

    if (!normalizedReference) {
      return null;
    }

    if (!UUID_PATTERN.test(normalizedReference)) {
      return normalizedReference;
    }

    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', normalizedReference)
      .maybeSingle();

    if (error) {
      console.error('Resolve user email error:', error);
      return null;
    }

    return data?.email || null;
  } catch (error) {
    console.error('Resolve user email error:', error);
    return null;
  }
};

export const upsertEnrollmentProgress = async (studentId, steps = []) => {
  try {
    if (!studentId || !Array.isArray(steps) || steps.length === 0) {
      return { error: null, data: [] };
    }

    const timestamp = new Date().toISOString();
    const payload = steps.map((step) => {
      const row = {
        student_id: studentId,
        step_name: step.step_name || step.name,
        status: step.status,
        updated_at: step.updated_at || timestamp,
      };

      if (step.status === 'completed') {
        row.completed_at = step.completed_at || timestamp;
      }

      return row;
    });

    const { data, error } = await supabase
      .from('enrollment_progress')
      .upsert(payload, { onConflict: 'student_id,step_name' })
      .select();

    if (error) {
      console.error('Upsert progress error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Upsert progress error:', error);
    return { error: error.message, data: null };
  }
};

const resolveEnrollmentRecord = async (enrollmentId, userReference) => {
  try {
    if (enrollmentId) {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, user_id, status')
        .eq('id', enrollmentId)
        .maybeSingle();

      if (error) {
        console.error('Resolve enrollment record error:', error);
        return null;
      }

      if (data) {
        return data;
      }
    }

    const userEmail = await resolveUserEmail(userReference);
    if (!userEmail) {
      return null;
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select('id, user_id, status')
      .eq('user_id', userEmail)
      .neq('status', 'rejected')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Resolve enrollment record error:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Resolve enrollment record error:', error);
    return null;
  }
};

async function syncVerifiedPaymentsToEnrollments() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('enrollment_id, student_id, status')
      .in('status', Array.from(FINALIZED_PAYMENT_STATUSES));

    if (error) {
      console.error('Sync verified payments error:', error);
      return;
    }

    const uniqueTargets = new Map();

    (data || []).forEach((payment) => {
      const key = payment.enrollment_id || payment.student_id;

      if (key && !uniqueTargets.has(key)) {
        uniqueTargets.set(key, payment);
      }
    });

    for (const payment of uniqueTargets.values()) {
      const { error: enrollError } = await enrollStudent(
        payment.enrollment_id,
        payment.student_id,
        'system'
      );

      if (enrollError) {
        console.error('Sync verified payments error:', enrollError);
      }
    }
  } catch (error) {
    console.error('Sync verified payments error:', error);
  }
}

// Get assessment result for a student by student_id
export const getAssessmentResultByStudentId = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('overall_score')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Get assessment result error:', error);
      return null;
    }

    return data?.overall_score || null;
  } catch (error) {
    console.error('Get assessment result error:', error);
    return null;
  }
};

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
    await syncVerifiedPaymentsToEnrollments();

    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        user_id,
        form_data,
        status,
        enrollment_date,
        created_at
      `
      )
      .eq('status', 'enrolled')
      .order('created_at', { ascending: false });

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

export const getEnrollmentManagementStudents = async () => {
  try {
    await syncVerifiedPaymentsToEnrollments();

    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        user_id,
        form_data,
        status,
        enrollment_date,
        created_at,
        enrollment_documents(*)
      `
      )
      .in('status', ['documents_verified', 'enrolled'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get enrollment management students error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Get enrollment management students error:', error);
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
export const approveEnrollment = async (enrollmentId, approvedBy = 'admin') => {
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
      approvedBy,
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
export const rejectEnrollment = async (enrollmentId, reason, rejectedBy = 'admin') => {
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
      rejectedBy,
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
export const enrollStudent = async (enrollmentId, userId, enrolledBy = 'admin') => {
  try {
    const enrollmentRecord = await resolveEnrollmentRecord(enrollmentId, userId);
    if (!enrollmentRecord) {
      return { error: 'Enrollment record not found', data: null };
    }

    const wasAlreadyEnrolled = enrollmentRecord.status === 'enrolled';
    let enrolledRecord = enrollmentRecord;

    if (!wasAlreadyEnrolled) {
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          status: 'enrolled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentRecord.id)
        .select()
        .single();

      if (error) {
        console.error('Enroll student error:', error);
        return { error: error.message, data: null };
      }

      enrolledRecord = data;
    }

    const studentId = await resolveUserId(userId || enrollmentRecord.user_id);
    if (studentId) {
      const { error: progressError } = await upsertEnrollmentProgress(studentId, [
        { step_name: 'Payment Submitted', status: 'completed' },
        { step_name: 'Payment Verified', status: 'completed' },
        { step_name: 'Enrolled', status: 'completed' },
      ]);

      if (progressError) {
        console.error('Enroll student progress sync error:', progressError);
      }
    }

    if (!wasAlreadyEnrolled) {
      await createAuditLog(
        enrolledBy,
        'STUDENT_ENROLLED',
        `Student enrolled: ${enrollmentRecord.user_id || userId} (Enrollment: ${enrollmentRecord.id})`,
        'success'
      );
    }

    return { error: null, data: enrolledRecord };
  } catch (error) {
    console.error('Enroll student error:', error);
    return { error: error.message, data: null };
  }
};

// Update document status
export const updateDocumentStatus = async (documentId, status, notes = null) => {
  try {
    const payload = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      payload.rejection_comment = null;
    } else if (notes !== null) {
      payload.rejection_comment = notes;
    }

    const { data, error } = await supabase
      .from('enrollment_documents')
      .update(payload)
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
export const createAuditLog = async (userId, action, details, status = 'success', metadata = {}) => {
  try {
    const normalizedReference = String(userId || '').trim();
    const resolvedUserId = await resolveUserId(userId);
    const resolvedUserEmail = await resolveUserEmail(userId);
    const detailsText = buildAuditDetails(details, action);
    const severity = normalizeAuditSeverity(status);
    const changes = {
      details: detailsText,
      severity,
    };

    if (metadata?.changes && typeof metadata.changes === 'object' && !Array.isArray(metadata.changes)) {
      Object.assign(changes, metadata.changes);
    }

    if (normalizedReference) {
      changes.actor_reference = normalizedReference;
    }

    if (resolvedUserEmail && resolvedUserEmail.includes('@')) {
      changes.actor_email = resolvedUserEmail;
    }

    if (!resolvedUserId && normalizedReference && !changes.actor_label) {
      changes.actor_label = normalizedReference;
    }

    const payload = {
      action,
      status: toDatabaseAuditStatus(severity),
      changes,
    };

    if (resolvedUserId) {
      payload.user_id = resolvedUserId;
    }

    if (metadata?.resourceType) {
      payload.resource_type = metadata.resourceType;
    }

    if (metadata?.resourceId && UUID_PATTERN.test(String(metadata.resourceId))) {
      payload.resource_id = metadata.resourceId;
    }

    if (severity === 'failed') {
      payload.error_message = detailsText;
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(payload)
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
      .select('id, user_id, action, resource_type, resource_id, changes, status, error_message, ip_address, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get audit logs error:', error);
      return { error: error.message, data: null };
    }

    const logs = data || [];
    const userIds = [...new Set(logs.map((log) => log.user_id).filter(Boolean))];
    let userMap = new Map();

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .in('id', userIds);

      if (usersError) {
        console.error('Get audit log users error:', usersError);
      } else {
        userMap = new Map((users || []).map((user) => [user.id, user]));
      }
    }

    return { error: null, data: logs.map((log) => mapAuditLogRecord(log, userMap)) };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return { error: error.message, data: null };
  }
};

// Get payment verification for student
export const getStudentPaymentStatus = async (userId) => {
  try {
    const studentId = await resolveUserId(userId);
    if (!studentId) {
      return { error: null, data: null, isVerified: false, isPending: false };
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error('Get payment status error:', error);
      return { error: error.message, data: null };
    }

    const payment = data?.[0] || null;
    const verifiedStatuses = new Set(['completed', 'verified', 'approved', 'paid']);
    const pendingStatuses = new Set(['pending', 'submitted']);

    return { 
      error: null, 
      data: payment,
      isVerified: verifiedStatuses.has(payment?.status),
      isPending: pendingStatuses.has(payment?.status),
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
        student_id,
        enrollment_id,
        amount,
        status,
        payment_method,
        created_at,
        submitted_at,
        reference_number,
        receipt_file_path,
        receipt_file_url,
        queue_number,
        queue_schedule_date,
        queue_schedule_time,
        verified_at,
        paid_at,
        notes
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
export const updatePaymentStatus = async (paymentId, status, verifiedBy) => {
  try {
    const hasVerifierReference = verifiedBy !== undefined;
    const resolvedVerifierId = hasVerifierReference
      ? await resolveUserId(verifiedBy)
      : null;
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (hasVerifierReference) {
      updateData.verified_by = resolvedVerifierId;
    }

    // Set appropriate timestamp based on status
    if (status === 'completed' || status === 'verified' || status === 'approved') {
      updateData.verified_at = new Date().toISOString();
    }
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      updateData.verified_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Update payment status error:', error);
      return { error: error.message, data: null };
    }

    if (FINALIZED_PAYMENT_STATUSES.has(status)) {
      const { error: enrollmentError } = await enrollStudent(
        data?.enrollment_id,
        data?.student_id,
        verifiedBy
      );

      if (enrollmentError) {
        console.error('Post-payment enrollment sync error:', enrollmentError);
      }
    }

    // Create audit log
    await createAuditLog(
      verifiedBy || 'admin',
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isoToday = todayStart.toISOString();

    const [enrollmentsRes, paymentsRes, usersRes, approvedTodayRes] = await Promise.all([
      supabase.from('enrollments').select('id, status'),
      supabase.from('payments').select('id, status'),
      supabase.from('users').select('id, role').neq('role', 'student'),
      supabase
        .from('payments')
        .select('id, status')
        .in('status', Array.from(FINALIZED_PAYMENT_STATUSES))
        .gte('updated_at', isoToday),
    ]);

    const stats = {
      totalEnrollments: enrollmentsRes.data?.length || 0,
      pendingEnrollments:
        enrollmentsRes.data?.filter(
          (e) => e.status === 'pending_documents' || e.status === 'pending_review'
        ).length || 0,
      enrolledStudents: enrollmentsRes.data?.filter((e) => e.status === 'enrolled').length || 0,
      rejectedEnrollments: enrollmentsRes.data?.filter((e) => e.status === 'rejected').length || 0,
      paymentsPending: paymentsRes.data?.filter((p) => p.status === 'pending').length || 0,
      totalVerifiedPayments: paymentsRes.data?.filter((p) => FINALIZED_PAYMENT_STATUSES.has(p.status)).length || 0,
      approvedToday: approvedTodayRes.data?.length || 0,
      activeUsersAdmins: usersRes.data?.length || 0,
      recentActivities: 0,
    };

    return { error: null, data: stats };
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return { error: error.message, data: null };
  }
};

export const getPaymentCollectionData = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoSevenDaysAgo = sevenDaysAgo.toISOString();

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, created_at')
      .in('status', Array.from(FINALIZED_PAYMENT_STATUSES))
      .gte('created_at', isoSevenDaysAgo);

    if (error) throw error;

    const dailyTotals = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      dailyTotals[dayKey] = 0;
    }

    payments?.forEach(payment => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      if (dailyTotals[date] !== undefined) {
        dailyTotals[date] += payment.amount || 0;
      }
    });

    const data = Object.keys(dailyTotals).map(dateKey => {
      const date = new Date(dateKey);
      const dayName = days[date.getDay()];
      return { day: dayName, amount: dailyTotals[dateKey] };
    });

    return { error: null, data };
  } catch (error) {
    console.error('Get payment collection data error:', error);
    return { error: error.message, data: null };
  }
};
