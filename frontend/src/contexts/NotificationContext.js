import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'sonner';
import { notificationService } from '../services';

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

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Play achievement sound
  const playAchievementSound = useCallback(() => {
    try {
      const audio = new Audio('/achievement-sound.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Create individual confetti piece
  const createConfettiPiece = useCallback((color) => {
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
    
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }, []);

  // Trigger confetti animation
  const triggerConfetti = useCallback(() => {
    try {
      const colors = ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#4169E1'];
      const confettiCount = 50;
      
      for (let i = 0; i < confettiCount; i++) {
        createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
      }
    } catch (error) {
      console.error('Confetti effect error:', error);
    }
  }, [createConfettiPiece]);

  // Show toast notification based on type
  const showToastNotification = useCallback((notification) => {
    const { type, title, message, data } = notification;

    // Helper function to create toast
    const createToast = (icon, duration = 5000) => {
      return {
        description: message,
        icon,
        duration,
      };
    };

    // Different toast styles based on notification type
    switch (type) {
      case 'new_donation_pending':
      case 'new_request':
        toast.success(title, createToast('📦'));
        break;

      case 'match_found':
      case 'donation_approved':
        toast.success(title, createToast('✅'));
        break;

      case 'fraud_alert':
      case 'donation_rejected':
        toast.error(title, createToast('⚠️'));
        break;

      case 'pickup_scheduled':
      case 'donation_delivered':
        toast.success(title, createToast('🚚'));
        break;

      case 'congratulations':
      case 'donation_completed':
        toast.success(title, createToast('🎉', 8000));
        if (data?.newAchievements && data.newAchievements > 0) {
          triggerConfetti();
        }
        break;

      case 'achievement_earned':
        toast.success(title, {
          description: message,
          icon: '🏆',
          duration: 10000,
        });
        triggerConfetti();
        playAchievementSound();
        break;

      case 'request_accepted':
        toast.success(title, createToast('🎉'));
        break;

      case 'new_donation_request':
        toast.info(title, createToast('📬', 7000));
        break;

      case 'ngo_accepted':
        toast.success(title, createToast('✨'));
        break;

      case 'request_status_updated':
        toast.info(title, createToast('📋'));
        break;

      case 'donation_offer':
        toast.info(title, createToast('🎁'));
        break;

      case 'feedback_received':
        toast.info(title, createToast('💬'));
        break;

      default:
        toast.info(title, { description: message, icon: '🔔' });
    }
  }, [triggerConfetti, playAchievementSound]);

  // Handle incoming notifications from Socket.IO
  const handleSocketNotification = useCallback((notification) => {
    console.log('📨 Received real-time notification:', notification);

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showToastNotification(notification);
    playNotificationSound();
  }, [showToastNotification, playNotificationSound]);

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
      const response = await notificationService.getNotifications();
      
      if (response.success) {
        const userNotifications = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setNotifications(userNotifications);
        
        if (response.pagination && response.pagination.unreadCount !== undefined) {
          setUnreadCount(response.pagination.unreadCount);
        } else {
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

  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);

      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId 
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

  const markAllAsRead = async () => {
    try {
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

  const deleteNotification = async (notificationId) => {
    try {
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
      system_update: 'ℹ️',
      congratulations: '🎉',
      donation_completed: '🎉',
      achievement_earned: '🏆',
      request_accepted: '✨',
      new_donation_request: '📬',
      ngo_accepted: '✨',
      request_status_updated: '📋',
      donation_offer: '🎁',
      feedback_received: '💬',
      donation_picked_up: '🚚',
      new_donation_available: '📦'
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
