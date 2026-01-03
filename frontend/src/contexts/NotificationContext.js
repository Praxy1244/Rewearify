import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'sonner'; // Using 'sonner' for consistency with other components
import { notificationService } from '../services'; // 💡 Import the service

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Handle incoming notifications from Socket.IO
  const handleSocketNotification = useCallback((notification) => {
    console.log('📨 Received real-time notification:', notification);

    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Increment unread count
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    showToastNotification(notification);
    
    // Play notification sound (optional)
    playNotificationSound();
  }, []);

  // Initialize Socket.IO connection
  const { socket, isConnected } = useSocket(handleSocketNotification);

  // Fetch initial notifications from API
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 💡 FIX: Use the service instead of manual fetch
      const response = await notificationService.getNotifications();
      
      if (response.success) {
        // Handle data wrapping (response.data might be the array or contain 'data')
        const userNotifications = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setNotifications(userNotifications);
        
        // Calculate unread count
        if (response.pagination && response.pagination.unreadCount !== undefined) {
          setUnreadCount(response.pagination.unreadCount);
        } else {
          // Fallback calculation
          // We check for !read OR status === 'unread' to be safe
          const unread = userNotifications.filter(n => !n.read && n.status !== 'read').length;
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // 💡 FIX: Use service
      const response = await notificationService.markAsRead(notificationId);

      if (response.success) {
        // Update local state immediately
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId 
              // 💡 FIX: Explicitly update both 'read' (boolean) and 'status' (string)
              ? { ...n, read: true, status: 'read' } 
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // 💡 FIX: Use service
      const response = await notificationService.markAllAsRead();

      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, status: 'read' }))
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      // 💡 FIX: Use service
      const response = await notificationService.deleteNotification(notificationId);

      if (response.success) {
        const notification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        
        if (notification && (!notification.read && notification.status !== 'read')) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Show toast notification based on type
  const showToastNotification = (notification) => {
    const { type, title, message, data } = notification;

    // Different toast styles based on notification type
    switch (type) {
      case 'new_donation_pending':
      case 'new_request':
        toast.success(title, { description: message, icon: '📦' });
        break;

      case 'match_found':
      case 'donation_approved':
        toast.success(title, { description: message, icon: '✅' });
        break;

      case 'fraud_alert':
      case 'donation_rejected':
        toast.error(title, { description: message, icon: '⚠️' });
        break;

      case 'pickup_scheduled':
      case 'donation_delivered':
        toast.success(title, { description: message, icon: '🚚' });
        break;

      // ✨ NEW: Special handling for congratulations and achievements
      case 'congratulations':
        toast.success(title, { 
          description: message, 
          icon: '🎉',
          duration: 8000, // Longer duration for important notifications
          action: data?.actionUrl ? {
            label: 'View Details',
            onClick: () => window.location.href = data.actionUrl
          } : undefined
        });
        // Trigger confetti effect for achievements
        if (data?.newAchievements && data.newAchievements > 0) {
          triggerConfetti();
        }
        break;

      case 'achievement_earned':
        toast.success(title, { 
          description: message, 
          icon: '🏆',
          duration: 10000,
          action: {
            label: 'View Achievement',
            onClick: () => window.location.href = '/donor/achievements'
          }
        });
        triggerConfetti();
        playAchievementSound();
        break;

      case 'request_accepted':
        toast.success(title, { description: message, icon: '🎉' });
        break;

      case 'new_donation_request':
        toast.info(title, { 
          description: message, 
          icon: '📬',
          duration: 7000,
          action: data?.actionUrl ? {
            label: 'View Request',
            onClick: () => window.location.href = data.actionUrl
          } : undefined
        });
        break;

      default:
        toast.info(title, { description: message });
    }
  };

  // ✨ NEW: Trigger confetti animation
  const triggerConfetti = () => {
    try {
      // Create confetti effect
      const colors = ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#4169E1'];
      const confettiCount = 50;
      
      for (let i = 0; i < confettiCount; i++) {
        createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
      }
    } catch (error) {
      console.error('Confetti effect error:', error);
    }
  };

  // ✨ NEW: Create individual confetti piece
  const createConfettiPiece = (color) => {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background-color: ${color};
      top: -10px;
      left: ${Math.random() * 100}vw;
      opacity: 1;
      transform: rotate(${Math.random() * 360}deg);
      pointer-events: none;
      z-index: 9999;
      animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
    `;
    
    document.body.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  };

  // ✨ NEW: Play achievement sound
  const playAchievementSound = () => {
    try {
      const audio = new Audio('/achievement-sound.mp3');
      audio.volume = 0.6;
      audio.play().catch(err => {
        // Silently fail if audio doesn't work
      });
    } catch (error) {
      // Silently fail
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        // Silently fail if audio doesn't work (e.g. browser policy)
      });
    } catch (error) {
      // Silently fail
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      new_donation_pending: '📦',
      donation_approved: '✅',
      donation_rejected: '❌',
      match_found: '🎯',
      pickup_scheduled: '🚚',
      donation_delivered: '✨',
      new_request: '📋',
      request_fulfilled: '🎉',
      fraud_alert: '⚠️',
      message_received: '💬',
      system_update: 'ℹ️'
    };
    return icons[type] || '🔔';
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};