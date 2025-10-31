import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
// Import services using the index file for cleaner imports
import { donationService, requestService, notificationService } from '../services';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth(); // Get the currently logged-in user

  // State to hold application-wide data
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // --- Start loading as true to handle initial page load/refresh ---
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  // Function to fetch all necessary data for the logged-in user
  const loadInitialData = useCallback(async () => {
    // Only proceed if there is a logged-in user with an ID
    if (!user || !user._id) {
      setDonations([]);
      setRequests([]);
      setNotifications([]);
      setLoading(false); // Stop loading if no user
      setError(null);
      return;
    }

    // --- Explicitly set loading to true when fetching starts ---
    setLoading(true); 
    setError(null);   // Clear previous errors
    
    try {
      // Fetch user's data concurrently
      const [donationsRes, requestsRes, notificationsRes] = await Promise.all([
        donationService.getUserDonations(user._id),
        requestService.getUserRequests(user._id),
        notificationService.getNotifications()
      ]);

      // --- Process Responses (Keep existing logic) ---
       if (donationsRes.success && donationsRes.data) {
         // Use the nested 'donations' array if that's the structure
         setDonations(donationsRes.data.donations || []); 
       } else {
         console.error("Failed to fetch donations:", donationsRes.message || 'No data returned');
         setDonations([]); 
       }

       if (requestsRes.success && requestsRes.data) {
         // Assuming requests might also be nested
         setRequests(requestsRes.data.requests || []); 
       } else {
         console.error("Failed to fetch requests:", requestsRes.message || 'No data returned');
         setRequests([]);
       }
      
       if (notificationsRes.success && notificationsRes.data) {
         setNotifications(notificationsRes.data.notifications || []); 
       } else {
         console.error("Failed to fetch notifications:", notificationsRes.message || 'No data returned');
         setNotifications([]);
       }
      // --- End Processing Responses ---

    } catch (err) {
      console.error('Error loading initial app data:', err);
      setError(`Failed to load dashboard data: ${err.message || 'Network error'}. Please try again.`);
      setDonations([]);
      setRequests([]);
      setNotifications([]);
    } finally {
      // --- Set loading to false ONLY after all fetches are done ---
      setLoading(false); 
    }
  }, [user]); // Rerun this function ONLY if the user object reference changes

  // useEffect to trigger data loading
  useEffect(() => {
    // Check if user exists before loading to prevent unnecessary initial load
    if (user && user._id) {
        loadInitialData();
    } else {
        // If there's no user (e.g., initial load before auth check), ensure loading is false
        setLoading(false); 
        setDonations([]);
        setRequests([]);
        setNotifications([]);
        setError(null);
    }
  }, [user, loadInitialData]); // Depend on user and the memoized function

  // Function to add a new donation locally
  const addDonation = (newDonation) => {
    setDonations(prevDonations => [newDonation, ...prevDonations]);
  };

  // Value provided by the context
  const value = {
    donations,
    requests,
    notifications,
    loading, // Provide loading state
    error,   // Provide error state
    addDonation,
    reload: loadInitialData, // Provide reload function
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

