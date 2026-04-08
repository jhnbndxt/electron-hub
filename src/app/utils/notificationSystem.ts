/**
 * Notification System Utility
 * 
 * Handles real-time notifications triggered by user actions
 * - NO dummy or pre-generated notifications
 * - Empty by default
 * - Populated only after real user actions
 * - Persists via localStorage
 */

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
  userId: string;
  action?: string;
}

export type NotificationTrigger =
  | 'ASSESSMENT_COMPLETED'
  | 'ENROLLMENT_SUBMITTED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'DOCUMENTS_VERIFIED'
  | 'ENROLLMENT_APPROVED'
  | 'ENROLLMENT_REJECTED';

/**
 * Add a new notification
 */
export function addNotification(
  userId: string,
  trigger: NotificationTrigger,
  additionalData?: Record<string, any>
): Notification {
  const notifications = getNotifications(userId);
  
  // Create notification based on trigger
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: getNotificationType(trigger),
    message: getNotificationMessage(trigger, additionalData),
    timestamp: new Date().toISOString(),
    read: false,
    userId,
    action: trigger
  };

  // Add to notifications array
  notifications.push(notification);

  // Save to localStorage
  saveNotifications(notifications);

  console.log(`📬 Notification created: ${trigger} for user ${userId}`);
  
  return notification;
}

/**
 * Get notification type based on trigger
 */
function getNotificationType(trigger: NotificationTrigger): Notification['type'] {
  switch (trigger) {
    case 'ASSESSMENT_COMPLETED':
    case 'PAYMENT_VERIFIED':
    case 'DOCUMENTS_VERIFIED':
    case 'ENROLLMENT_APPROVED':
      return 'success';
    
    case 'ENROLLMENT_SUBMITTED':
    case 'PAYMENT_SUBMITTED':
      return 'info';
    
    case 'PAYMENT_REJECTED':
    case 'ENROLLMENT_REJECTED':
      return 'error';
    
    default:
      return 'info';
  }
}

/**
 * Get notification message based on trigger
 */
function getNotificationMessage(
  trigger: NotificationTrigger,
  data?: Record<string, any>
): string {
  switch (trigger) {
    case 'ASSESSMENT_COMPLETED':
      return 'Assessment completed successfully. View your personalized recommendations.';
    
    case 'ENROLLMENT_SUBMITTED':
      return 'Enrollment submitted successfully. Awaiting registrar review.';
    
    case 'PAYMENT_SUBMITTED':
      return 'Payment submitted successfully. Awaiting verification from cashier.';
    
    case 'PAYMENT_VERIFIED':
      return 'Your payment has been verified and approved. You may proceed with enrollment.';
    
    case 'PAYMENT_REJECTED':
      return data?.reason 
        ? `Payment rejected: ${data.reason}`
        : 'Payment was rejected. Please contact the cashier for details.';
    
    case 'DOCUMENTS_VERIFIED':
      return 'Your documents have been verified. Please proceed to payment.';
    
    case 'ENROLLMENT_APPROVED':
      return 'Congratulations! Your enrollment has been approved.';
    
    case 'ENROLLMENT_REJECTED':
      return data?.reason
        ? `Enrollment rejected: ${data.reason}`
        : 'Enrollment was rejected. Please contact the registrar for details.';
    
    default:
      return 'You have a new notification.';
  }
}

/**
 * Get all notifications (from localStorage)
 */
function getNotifications(userId?: string): Notification[] {
  try {
    const stored = localStorage.getItem('notifications');
    if (!stored) return [];
    
    const all: Notification[] = JSON.parse(stored);
    
    // Filter by userId if provided
    if (userId) {
      return all.filter(n => n.userId === userId);
    }
    
    return all;
  } catch (error) {
    console.error('Failed to load notifications:', error);
    return [];
  }
}

/**
 * Save notifications to localStorage
 */
function saveNotifications(notifications: Notification[]) {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
}

/**
 * Get user notifications
 */
export function getUserNotifications(userId: string): Notification[] {
  return getNotifications(userId).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): void {
  const all = getNotifications();
  const notification = all.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    saveNotifications(all);
  }
}

/**
 * Mark all user notifications as read
 */
export function markAllAsRead(userId: string): void {
  const all = getNotifications();
  all.forEach(n => {
    if (n.userId === userId) {
      n.read = true;
    }
  });
  saveNotifications(all);
}

/**
 * Get unread count for user
 */
export function getUnreadCount(userId: string): number {
  return getNotifications(userId).filter(n => !n.read).length;
}

/**
 * Clear all notifications for user
 */
export function clearUserNotifications(userId: string): void {
  const all = getNotifications();
  const filtered = all.filter(n => n.userId !== userId);
  saveNotifications(filtered);
  console.log(`🗑️ Cleared all notifications for user ${userId}`);
}

/**
 * Clear all notifications (admin function)
 */
export function clearAllNotifications(): void {
  localStorage.setItem('notifications', JSON.stringify([]));
  console.log('🗑️ Cleared ALL notifications');
}

/**
 * Delete a specific notification
 */
export function deleteNotification(notificationId: string): void {
  const all = getNotifications();
  const filtered = all.filter(n => n.id !== notificationId);
  saveNotifications(filtered);
}

/**
 * Check if user has notifications
 */
export function hasNotifications(userId: string): boolean {
  return getNotifications(userId).length > 0;
}

/**
 * Get notification statistics
 */
export function getNotificationStats(userId: string) {
  const notifications = getNotifications(userId);
  
  return {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length,
    byType: {
      success: notifications.filter(n => n.type === 'success').length,
      info: notifications.filter(n => n.type === 'info').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      error: notifications.filter(n => n.type === 'error').length
    }
  };
}
