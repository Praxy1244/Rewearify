import React, { useState } from 'react';
import { Bell, Check, X, Eye, Trash2, Filter, Calendar, User, Package, Shield, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { useToast } from '../../hooks/use-toast';

const Notifications = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'donation',
      title: 'New Donation Submitted',
      message: 'Sarah Johnson has submitted a new donation: Business Attire Set',
      time: '5 minutes ago',
      isRead: false,
      priority: 'high',
      actionRequired: true
    },
    {
      id: 2,
      type: 'user',
      title: 'New User Registration',
      message: 'Michael Chen has registered as a new donor on the platform',
      time: '15 minutes ago',
      isRead: false,
      priority: 'medium',
      actionRequired: false
    },
    {
      id: 3,
      type: 'system',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance window: Tonight 11 PM - 1 AM PST',
      time: '1 hour ago',
      isRead: true,
      priority: 'low',
      actionRequired: false
    },
    {
      id: 4,
      type: 'donation',
      title: 'Donation Approved',
      message: 'Winter Coats donation by Emma Davis has been successfully approved',
      time: '2 hours ago',
      isRead: true,
      priority: 'medium',
      actionRequired: false
    },
    {
      id: 5,
      type: 'security',
      title: 'Login from New Device',
      message: 'New login detected from Chrome on Windows in New York, NY',
      time: '3 hours ago',
      isRead: false,
      priority: 'high',
      actionRequired: true
    },
    {
      id: 6,
      type: 'user',
      title: 'User Account Blocked',
      message: 'User account for James Wilson has been automatically blocked due to suspicious activity',
      time: '4 hours ago',
      isRead: true,
      priority: 'high',
      actionRequired: false
    },
    {
      id: 7,
      type: 'system',
      title: 'Weekly Report Generated',
      message: 'Your weekly analytics report is ready for review',
      time: '1 day ago',
      isRead: true,
      priority: 'low',
      actionRequired: false
    },
    {
      id: 8,
      type: 'donation',
      title: 'Bulk Donation Request',
      message: 'Hope Community Center has requested 25 items for winter clothing drive',
      time: '2 days ago',
      isRead: true,
      priority: 'medium',
      actionRequired: false
    }
  ]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'action-required') return notification.actionRequired;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'donation': return <Package className="h-5 w-5 text-green-600" />;
      case 'user': return <User className="h-5 w-5 text-blue-600" />;
      case 'system': return <Settings className="h-5 w-5 text-gray-600" />;
      case 'security': return <Shield className="h-5 w-5 text-red-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
    toast({
      title: "Notification marked as read",
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    toast({
      title: "All notifications marked as read",
    });
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast({
      title: "Notification deleted",
    });
  };

  const clearAll = () => {
    setNotifications([]);
    toast({
      title: "All notifications cleared",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-gray-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Stay updated with platform activities</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={notifications.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Action Required</p>
                <p className="text-2xl font-bold">{notifications.filter(n => n.actionRequired).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{notifications.filter(n => n.time.includes('minute') || n.time.includes('hour')).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="action-required">Action Required</SelectItem>
                <SelectItem value="donation">Donations</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up! No new notifications to show.</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          {notification.actionRequired && (
                            <Badge variant="destructive">Action Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredNotifications.length > 0 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Notifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notifications;