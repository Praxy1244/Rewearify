import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import  api  from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if user is logged in from localStorage
      const token = authService.getToken();
      const storedUser = authService.getStoredUser();
      
      if (token && storedUser) {
        // Verify token is still valid by fetching current user
        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            setUser(response.data.user);
            await loadNotifications(response.data.user.id);
          } else {
            // Token is invalid, clear storage
            authService.logout();
          }
        } catch (error) {
          // Token is invalid, clear storage
          authService.logout();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async (userId) => {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.BASE);
      if (response.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to empty array if notifications fail to load
      setNotifications([]);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        setUser(response.data.user);
        await loadNotifications(response.data.user.id);
        return response;
      }
      
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        setNotifications([]); // New user starts with no notifications
        return response;
      }
      
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setNotifications([]);
    }
  };

  const handleOAuthCallback = async (token, navigate) => {
        try {
          // 1. Store the token from the URL
          localStorage.setItem('token', token);
          
          // 2. Fetch the user data using the new token
          const response = await authService.getCurrentUser();
          
          if (response.success) {
            // 3. Update the user state
            setUser(response.data.user);
            await loadNotifications(response.data.user.id);
            
            // 4. Redirect to the correct dashboard
            switch (response.data.user.role) {
              case "admin":
                navigate("/admin-dashboard");
                break;
              case "donor":
                navigate("/donor-dashboard");
                break;
              case "recipient":
                navigate("/recipient-dashboard");
                break;
              default:
                navigate("/dashboard");
            }
          } else {
            throw new Error('Failed to fetch user after OAuth login');
          }
        } catch (error) {
          console.error("OAuth Callback Error:", error);
          logout(); // Clear any partial login state
          navigate('/login?error=oauth_failed');
        }
      };
    

  const updateProfile = async (updatedData) => {
    try {
      const response = await api.put(`/users/${user.id}`, updatedData);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return response;
      }
      
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Profile update failed' 
      };
    }
  };

  const updateNotificationRead = async (notificationId) => {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      
      if (response.success) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
      
      return response;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Optimistically update UI even if API call fails
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      
      if (response.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
      
      return response;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Optimistically update UI even if API call fails
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const refreshNotifications = async () => {
    if (user) {
      await loadNotifications(user.id);
    }
  };

  const value = {
    user,
    notifications,
    login,
    signup,
    logout,
    handleOAuthCallback,
    updateProfile,
    updateNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
    loading,
    isAuthenticated: authService.isAuthenticated()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};