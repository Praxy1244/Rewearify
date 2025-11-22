import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'react-hot-toast';

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
  if (!user) {
    console.log('No user, skipping notification fetch');
    return;
  }
  
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token found');
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    console.log('🔔 Fetching notifications...');
    
    const response = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      console.error('Response not OK:', response.status);
      const text = await response.text();
      console.error('Response body:', text.substring(0, 200));
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Expected JSON but got:', contentType);
      const text = await response.text();
      console.error('Response body:', text.substring(0, 200));
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const data = await response.json();
    console.log('✅ Notifications fetched:', data);
    
    if (data.success && Array.isArray(data.data)) {
      const userNotifications = data.data;
      setNotifications(userNotifications);
      
      if (data.pagination && data.pagination.unreadCount !== undefined) {
        setUnreadCount(data.pagination.unreadCount);
        console.log('📊 Unread count:', data.pagination.unreadCount);
      } else {
        const unread = userNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } else {
      console.error('Unexpected data format:', data);
      setNotifications([]);
      setUnreadCount(0);
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
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
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
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/read-all`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const notification = notifications.find(n => n._id === notificationId);
        
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Show toast notification based on type
  const showToastNotification = (notification) => {
    const { type, title, message } = notification;

    const toastOptions = {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#fff',
        color: '#333',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    };

    // Different toast styles based on notification type
    switch (type) {
      case 'new_donation_pending':
      case 'new_request':
        toast.success(`${title}\n${message}`, {
          ...toastOptions,
          icon: '📦'
        });
        break;

      case 'match_found':
      case 'donation_approved':
        toast.success(`${title}\n${message}`, {
          ...toastOptions,
          icon: '✅'
        });
        break;

      case 'fraud_alert':
      case 'donation_rejected':
        toast.error(`${title}\n${message}`, {
          ...toastOptions,
          icon: '⚠️'
        });
        break;

      case 'pickup_scheduled':
      case 'donation_delivered':
        toast.success(`${title}\n${message}`, {
          ...toastOptions,
          icon: '🚚'
        });
        break;

      case 'message_received':
        toast(`${title}\n${message}`, {
          ...toastOptions,
          icon: '💬'
        });
        break;

      default:
        toast(`${title}\n${message}`, toastOptions);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    } catch (error) {
      // Silently fail if audio doesn't work
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
