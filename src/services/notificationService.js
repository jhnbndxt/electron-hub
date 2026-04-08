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

/**
 * Add a new notification
 */
export async function addNotification(userId, type, title, message, additionalData = {}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        read: false,
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
export async function getUserNotifications(userId) {
  try {
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
export async function getUnreadNotificationsCount(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return data?.length || 0;
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
      .update({ read: true, read_at: new Date().toISOString() })
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
export async function markAllNotificationsAsRead(userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

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
export async function deleteAllNotifications(userId) {
  try {
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
      type: 'assessment',
      title: 'Assessment Completed',
      message: 'You have successfully completed the career assessment.',
    },
    ENROLLMENT_SUBMITTED: {
      type: 'enrollment',
      title: 'Enrollment Submitted',
      message: 'Your enrollment form has been submitted successfully.',
    },
    PAYMENT_SUBMITTED: {
      type: 'payment',
      title: 'Payment Submitted',
      message: 'Your payment has been submitted for verification.',
    },
    PAYMENT_VERIFIED: {
      type: 'payment',
      title: 'Payment Verified',
      message: 'Your payment has been verified successfully.',
    },
    PAYMENT_REJECTED: {
      type: 'payment',
      title: 'Payment Rejected',
      message: 'Your payment was rejected. Please try again.',
    },
    DOCUMENTS_VERIFIED: {
      type: 'document',
      title: 'Documents Verified',
      message: 'All your documents have been verified and approved.',
    },
    ENROLLMENT_APPROVED: {
      type: 'enrollment',
      title: 'Enrollment Approved',
      message: 'Your enrollment has been approved. Welcome!',
    },
    ENROLLMENT_REJECTED: {
      type: 'enrollment',
      title: 'Enrollment Rejected',
      message: 'Your enrollment was not approved. Please review the feedback.',
    },
    DOCUMENT_REJECTED: {
      type: 'document',
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
    notification.type,
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
