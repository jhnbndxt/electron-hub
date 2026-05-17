/**
 * Notification Service
 * 
 * Handles all notification operations via Supabase
 * - Create notifications
 * - Retrieve notifications
 * - Mark as read
 * - Delete notifications
 */

import { supabase } from '../supabase';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveNotificationUserId(userReference) {
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
    console.error('Error resolving notification user:', error);
    return null;
  }

  return data?.id || null;
}

const NOTIFICATION_MAP = {
  ASSESSMENT_COMPLETED: {
    title: 'Assessment Completed',
    message: 'You have successfully completed the career assessment.',
  },
  ENROLLMENT_SUBMITTED: {
    title: 'Enrollment Submitted',
    message: 'Your enrollment form has been submitted successfully.',
  },
  PAYMENT_SUBMITTED: {
    title: 'Payment Submitted',
    message: 'Your payment has been submitted for verification.',
  },
  PAYMENT_VERIFIED: {
    title: 'Payment Verified',
    message: 'Your payment has been verified successfully.',
  },
  PAYMENT_REJECTED: {
    title: 'Payment Rejected',
    message: 'Your payment was rejected. Please try again.',
  },
  PAYMENT_SCHEDULE_EXPIRED: {
    title: 'Payment Schedule Expired',
    message:
      'Your over-the-counter payment schedule has expired because the payment was not completed on the assigned date. To continue your enrollment process, please generate a new payment schedule or contact the school administration for assistance.',
  },
  PAYMENT_UPDATED: {
    title: 'Payment Status Updated',
    message: additionalData =>
      additionalData.message || `Your payment status has been updated to ${additionalData.status || 'a new status'}.`,
  },
  DOCUMENTS_VERIFIED: {
    title: 'Documents Verified',
    message: 'All your documents have been verified and approved.',
  },
  DOCUMENT_APPROVED: {
    title: 'Document Approved',
    message: additionalData =>
      additionalData.documentName
        ? `Your ${additionalData.documentName} has been approved.`
        : 'Your document has been approved.',
  },
  ENROLLMENT_APPROVED: {
    title: 'Enrollment Approved',
    message: 'Your enrollment has been approved. Welcome!',
  },
  VOUCHER_ELIGIBLE: {
    title: 'Voucher Eligibility Confirmed',
    message:
      'Congratulations! You are eligible for the DepEd Senior High School Voucher Program. Your tuition fees are covered.',
  },
  OFFICIALLY_ENROLLED: {
    title: 'Officially Enrolled',
    message: 'Congratulations! You are now officially enrolled.',
  },
  ENROLLMENT_REJECTED: {
    title: 'Enrollment Rejected',
    message: 'Your enrollment was not approved. Please review the feedback.',
  },
  ENROLLMENT_STATUS_CHANGED: {
    title: 'Enrollment Status Updated',
    message: additionalData =>
      additionalData.message || `Your enrollment status has been updated to ${additionalData.status || 'a new status'}.`,
  },
  ENROLLMENT_UNENROLLED: {
    title: 'Unenrolled from Enrollment System',
    message: additionalData =>
      additionalData.message ||
      `You have been unenrolled from the enrollment system. Please contact the registrar for more information.${additionalData.reason ? ` Official reason: ${additionalData.reason}` : ''}`,
  },
  DOCUMENTS_REJECTED: {
    title: 'Documents Rejected',
    message: (additionalData) =>
      additionalData.message ||
      `One or more enrollment documents were rejected.${additionalData.reason ? ` Reason: ${additionalData.reason}` : ''} Open My Documents, read the rejection reason, click Re-upload Document under the rejected item, choose the corrected file, and wait for registrar review.`,
  },
  DOCUMENT_REJECTED: {
    title: 'Document Rejected',
    message: (additionalData) =>
      additionalData.message ||
      `Your uploaded document '${additionalData.documentName || 'Document'}' was rejected${additionalData.reason ? ` due to ${additionalData.reason}` : ''}. Open My Documents, click Re-upload Document for this item, select the corrected file, and wait for registrar review.`,
  },
  DOCUMENT_REUPLOADED: {
    title: 'Document Re-uploaded',
    message: (additionalData) =>
      additionalData.message ||
      `${additionalData.studentName || 'A student'} re-uploaded ${additionalData.documentName || 'a document'} and is ready for priority review.`,
  },
  DOCUMENT_STATUS_UPDATED: {
    title: 'Document Status Updated',
    message: additionalData =>
      additionalData.message || `Your ${additionalData.documentName || 'document'} status has been updated to ${additionalData.status || 'a new status'}.`,
  },
  ASSESSMENT_UPDATED: {
    title: 'Assessment Updated',
    message: additionalData =>
      additionalData.message || 'Your assessment result has been recorded or updated.',
  },
  ENROLLMENT_CLOSED: {
    title: 'Enrollment Closed',
    message: 'Enrollment is currently closed until further notice. We will notify you when it reopens.',
  },
  ENROLLMENT_OPENED: {
    title: 'Enrollment Reopened',
    message: 'Enrollment is now open again. Please complete your application while the window is available.',
  },
};

/**
 * Add a new notification
 */
export async function addNotification(userReference, type, title, message, additionalData = {}) {
  try {
    const userId = await resolveNotificationUserId(userReference);

    if (!userId) {
      throw new Error(`Unable to resolve notification recipient: ${userReference}`);
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        is_read: false,
        data: additionalData,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    
    console.log('📬 Notification created:', { userId, type, title });
    return data[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userReference) {
  try {
    const userId = await resolveNotificationUserId(userReference);
    if (!userId) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadNotificationsCount(userReference) {
  try {
    const userId = await resolveNotificationUserId(userReference);
    if (!userId) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userReference) {
  try {
    const userId = await resolveNotificationUserId(userReference);
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    console.log('✅ All notifications marked as read for user:', userId);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    console.log('🗑️ Notification deleted:', notificationId);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userReference) {
  try {
    const userId = await resolveNotificationUserId(userReference);
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    console.log('🗑️ All notifications deleted for user:', userId);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}

/**
 * Create notification based on trigger event
 * Convenience function for common notification types
 */
export async function triggerNotification(userId, trigger, additionalData = {}) {
  const notification = NOTIFICATION_MAP[trigger];
  if (!notification) {
    console.warn('Unknown notification trigger:', trigger);
    return null;
  }

  const message =
    typeof notification.message === 'function'
      ? notification.message(additionalData)
      : notification.message;

  return addNotification(
    userId,
    trigger,
    notification.title,
    message,
    { trigger, ...additionalData }
  );
}

export async function broadcastNotificationToStudents(trigger, additionalData = {}) {
  const notification = NOTIFICATION_MAP[trigger];
  if (!notification) {
    console.warn('Unknown broadcast notification trigger:', trigger);
    return [];
  }

  try {
    const { data: students, error: studentError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student');

    if (studentError) {
      console.error('Error loading student recipients for notifications:', studentError);
      return [];
    }

    const payload = (students || []).map((student) => ({
      user_id: student.id,
      type: trigger,
      title: notification.title,
      message:
        typeof notification.message === 'function'
          ? notification.message(additionalData)
          : notification.message,
      is_read: false,
      data: { trigger, ...additionalData },
      created_at: new Date().toISOString(),
    }));

    if (payload.length === 0) {
      return [];
    }

    const { data: inserted, error: insertError } = await supabase
      .from('notifications')
      .insert(payload)
      .select();

    if (insertError) {
      console.error('Error broadcasting notification to students:', insertError);
      return [];
    }

    console.log('📬 Broadcast notification created for students:', {
      trigger,
      recipients: payload.length,
    });
    return inserted || [];
  } catch (error) {
    console.error('Error broadcasting notification to students:', error);
    return [];
  }
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(userId, callback) {
  const subscription = supabase
    .from(`notifications:user_id=eq.${userId}`)
    .on('*', (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
}
