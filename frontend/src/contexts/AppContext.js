import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import donationService from '../services/donationService';
import requestService from '../services/requestService';
import notificationService from '../services/notificationService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's donations
  const fetchUserDonations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await donationService.getUserDonations();
      if (response.success) {
        setDonations(response.data);
      } else {
        setError(response.error || 'Failed to fetch donations');
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch requests related to user's donations
  const fetchUserRequests = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await requestService.getRequests();
      if (response.success) {
        setRequests(response.data);
      } else {
        setError(response.error || 'Failed to fetch requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getUserNotifications();
      if (response.success) {
        setNotifications(response.data);
      } else {
        setError(response.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = {
    donations,
    requests,
    notifications,
    loading,
    error,
    fetchUserDonations,
    fetchUserRequests,
    fetchNotifications
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};