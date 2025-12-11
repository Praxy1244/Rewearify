import React from 'react';
import { useNotifications } from '../contexts/NotificationContext'; // 1. Correct Import
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Check, Bell, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  // 2. Use the correct hook
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id || notification.id);
    }
    
    // Navigate if there is an action URL
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {/* 3. Safe check for array existence */}
            {notifications && notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id || notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-4 ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon Circle */}
                    <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${
                      !notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Bell className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-base font-semibold ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1 ml-2">
                          <Calendar className="w-3 h-3" />
                          {formatTime(notification.createdAt || notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.data?.actionUrl && (
                        <span className="inline-block mt-2 text-xs font-medium text-blue-600 hover:text-blue-800">
                          View Details →
                        </span>
                      )}
                    </div>

                    {/* Unread Dot */}
                    {!notification.read && (
                      <div className="w-2 h-2 mt-2 bg-blue-600 rounded-full flex-shrink-0" title="Unread" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                <p className="max-w-sm mt-1">
                  We'll notify you when there are updates about your donations or requests.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;