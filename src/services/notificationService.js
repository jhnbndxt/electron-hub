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
  const notificationMap = {
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
    DOCUMENTS_VERIFIED: {
      title: 'Documents Verified',
      message: 'All your documents have been verified and approved.',
    },
    ENROLLMENT_APPROVED: {
      title: 'Enrollment Approved',
      message: 'Your enrollment has been approved. Welcome!',
    },
    ENROLLMENT_REJECTED: {
      title: 'Enrollment Rejected',
      message: 'Your enrollment was not approved. Please review the feedback.',
    },
    DOCUMENTS_REJECTED: {
      title: 'Documents Rejected',
      message: additionalData.message || 'One or more enrollment documents were rejected. Please review the feedback.',
    },
    DOCUMENT_REJECTED: {
      title: 'Document Rejected',
      message: additionalData.message || 'A document was rejected. Please review and reupload.',
    },
  };

  const notification = notificationMap[trigger];
  if (!notification) {
    console.warn('Unknown notification trigger:', trigger);
    return null;
  }

  return addNotification(
    userId,
    trigger,
    notification.title,
    notification.message,
    { trigger, ...additionalData }
  );
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
