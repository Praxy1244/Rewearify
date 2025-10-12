// src/components/NotificationsPage.js
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const Notifications = () => {
  const { user, notifications, updateNotificationRead } = useAuth();

  useEffect(() => {
    // Log notifications for debugging
    console.log('Notifications on page load:', notifications);
  }, [notifications]);

  const handleNotificationClick = (id) => {
    updateNotificationRead(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => handleNotificationClick(notification.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3 className="font-medium text-gray-900">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                  <a
                    href={notification.actionUrl}
                    className="text-sm text-green-600 hover:text-green-700 mt-2 inline-block"
                  >
                    View Details
                  </a>
                  <div
                    className={`w-2 h-2 rounded-full mt-1 ml-2 inline-block ${
                      notification.read ? 'bg-gray-300' : 'bg-blue-500'
                    }`}
                  ></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No notifications available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;