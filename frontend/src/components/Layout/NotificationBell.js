import React, { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { notificationService } from '../../services'; 


const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    deleteNotification,
    getNotificationIcon
  } = useNotifications();


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };


    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    console.log('🔔 Clicked notification:', notification.type);
    console.log('🔔 Data:', notification.data);
    
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id || notification.id);
    }
    
    let targetUrl = null;
    
    // Route based on notification type
    switch (notification.type) {
      case 'congratulations':
      case 'donation_completed':
        const id = notification.data?.requestId || notification.data?.donationId;
        targetUrl = id ? `/donor/congratulations/${id}` : '/donor/my-donations';
        break;
        
      case 'donation_approved':
      case 'ngo_accepted':
      case 'pickup_scheduled':
      case 'donation_picked_up':
      case 'donation_delivered':
      case 'feedback_received':
        targetUrl = '/donor/my-donations';
        break;
        
      case 'achievement_earned':
        targetUrl = '/donor/achievements';
        break;
        
      case 'new_donation_request':
        targetUrl = '/donor/donation-requests';
        break;
        
      case 'donation_offer':
        targetUrl = '/recipient/offers';
        break;
        
      case 'request_accepted':
      case 'request_status_updated':
        targetUrl = '/recipient/my-requests';
        break;
        
      case 'new_donation_available':
        targetUrl = '/recipient/browseItems';
        break;
        
      case 'new_donation_pending':
      case 'fraud_alert':
      case 'feedback_submitted':
        targetUrl = '/admin/donations';
        break;
      
      case 'request_completed':  // ✅ NEW: Handle request_completed type
        targetUrl = '/donor/profile';
        break;
        
      default:
        targetUrl = notification.data?.actionUrl || '/notifications';
    }
    
    // ✅ FIX: Convert old /profile URLs to /donor/profile
    if (targetUrl === '/profile') {
      targetUrl = '/donor/profile';
    }
    
    console.log('🎯 Navigating to:', targetUrl);
    
    if (targetUrl) {
      setIsOpen(false);
      navigate(targetUrl);
    } else {
      console.warn('⚠️ No valid URL found');
      toast.error('Unable to navigate');
    }
  };


  const handleDeleteAll = async () => {
    try {
      const response = await notificationService.deleteAll();
      if (response.success) {
        await fetchNotifications();
        toast.success(`Cleared ${response.data.deletedCount} old notifications.`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Clear failed:", error);
      toast.error("Failed to clear notifications.");
    }
  };


  const handleSingleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };


  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);


    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        
        <span
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>


      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            <div className='flex gap-2'>
                {unreadCount > 0 && (
                <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Mark all read
                </button>
                )}
                {notifications.length > 0 && (
                    <button
                        onClick={handleDeleteAll}
                        className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center"
                    >
                        <Trash2 className='h-4 w-4 mr-1' />
                        Clear
                    </button>
                )}
            </div>
          </div>


          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id || notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 pr-6">
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                      {/* ✅ Show the actual URL for debugging */}
                      {notification.data?.actionUrl && (
                        <p className="text-xs text-blue-600 mt-1 font-mono">
                          → {notification.data.actionUrl}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </div>


                  <button
                    onClick={(e) => handleSingleDelete(e, notification._id || notification.id)}
                    className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>


          <div className="p-3 border-t border-gray-200 text-center">
            <button
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


export default NotificationBell;
