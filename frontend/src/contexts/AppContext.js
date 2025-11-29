import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'; // --- MODIFICATION: Import useCallback
import { useAuth } from './AuthContext';

// Import all your services
import { 
  donationService, 
  requestService, 
  userService, 
  notificationService 
} from '../services'; 

const AppContext = createContext();

const initialState = {
  // User data
  userProfile: null,
  
  // Donations
  donations: [],       // For BrowseItems (all approved donations)
  userDonations: [],   // For DonorDashboard
  
  // Requests
  requests: [],        // For Admin
  userRequests: [],    // For RecipientDashboard / MyRequests
  
  // Other
  organizations: [],
  notifications: [],
  
  // Granular loading & error states
  loading: {
    donations: false,
    userDonations: false,
    requests: false,
    userRequests: false,
    profile: false,
    organizations: false,
    notifications: false
  },
  errors: {
    donations: null,
    userDonations: null,
    requests: null,
    userRequests: null,
    profile: null,
    organizations: null,
    notifications: null
  }
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.payload.key]: action.payload.value }};
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.payload.key]: action.payload.error }};
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_DONATIONS':
      return { ...state, donations: action.payload };
    case 'SET_USER_DONATIONS':
      return { ...state, userDonations: action.payload };
    case 'ADD_DONATION':
      return { ...state, userDonations: [action.payload, ...state.userDonations] };
    case 'UPDATE_DONATION':
      const update = (d) => d.map(item => item._id === action.payload._id ? action.payload : item);
      return { ...state, donations: update(state.donations), userDonations: update(state.userDonations) };
    case 'REMOVE_DONATION':
      const filter = (d) => d.filter(item => item._id !== action.payload);
      return { ...state, donations: filter(state.donations), userDonations: filter(state.userDonations) };
    case 'SET_REQUESTS':
      return { ...state, requests: action.payload };
    case 'SET_USER_REQUESTS':
      return { ...state, userRequests: action.payload };
    case 'ADD_REQUEST':
      return { ...state, userRequests: [action.payload, ...state.userRequests] };
    case 'UPDATE_REQUEST':
      return { ...state, userRequests: state.userRequests.map(item => item._id === action.payload._id ? action.payload : item) };
    case 'REMOVE_REQUEST':
      return { ...state, userRequests: state.userRequests.filter(item => item._id !== action.payload) };
    case 'SET_ORGANIZATIONS':
      return { ...state, organizations: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  const setLoading = (key, value) => dispatch({ type: 'SET_LOADING', payload: { key, value } });
  const setError = (key, error) => dispatch({ type: 'SET_ERROR', payload: { key, error } });

  // --- API FUNCTIONS ---

  // --- MODIFICATION: Wrap functions in useCallback ---
  const loadUserData = useCallback(async () => {
    if (!user?._id) return;

    setLoading('profile', true);
    setLoading('userDonations', true);
    setLoading('userRequests', true);
    setLoading('notifications', true);

    try {
      const [
        donationsResponse, 
        requestsResponse,
        notificationResponse
      ] = await Promise.all([
        donationService.getUserDonations(user._id),
        requestService.getUserRequests(user._id),
        notificationService.getNotifications()
      ]);

      if (donationsResponse.success) {
        dispatch({ type: 'SET_USER_DONATIONS', payload: donationsResponse.data || [] });
      } else {
        setError('userDonations', donationsResponse.message);
      }

      if (requestsResponse.success) {
        dispatch({ type: 'SET_USER_REQUESTS', payload: requestsResponse.data || [] });
      } else {
        setError('userRequests', requestsResponse.message);
      }
      
      if (notificationResponse.success) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notificationResponse.data.notifications || [] });
      } else {
        setError('notifications', notificationResponse.message);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('profile', error.message);
    } finally {
      setLoading('profile', false);
      setLoading('userDonations', false);
      setLoading('userRequests', false);
      setLoading('notifications', false);
    }
  }, [user]); // This function only needs to be re-created if 'user' changes

  const loadDonations = useCallback(async (params = {}) => {
    try {
      setLoading('donations', true);
      setError('donations', null);
      const response = await donationService.getDonations(params);
      if (response.success) {
        dispatch({ type: 'SET_DONATIONS', payload: response.data || [] });
      } else {
        setError('donations', response.message);
      }
      return response;
    } catch (error) {
      setError('donations', error.message);
      throw error;
    } finally {
      setLoading('donations', false);
    }
  }, []); // Empty array means this function is created once and never changes

  const createDonation = useCallback(async (donationData) => {
    const response = await donationService.createDonation(donationData);
    if (response.success) {
      dispatch({ type: 'ADD_DONATION', payload: response.data.donation });
    }
    return response;
  }, []);

  const createRequest = useCallback(async (requestData) => {
    const response = await requestService.createRequest(requestData);
    if (response.success) {
      dispatch({ type: 'ADD_REQUEST', payload: response.data.request });
    }
    return response;
  }, []);

  const cancelRequest = useCallback(async (requestId) => {
    const response = await requestService.deleteRequest(requestId);
    if (response.success) {
      dispatch({ type: 'REMOVE_REQUEST', payload: requestId });
    }
    return response;
  }, []);
  
  // --- END API FUNCTIONS & MODIFICATION ---

  // Load user data on auth change
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear all data on logout
      dispatch({ type: 'SET_USER_PROFILE', payload: null });
      dispatch({ type: 'SET_USER_DONATIONS', payload: [] });
      dispatch({ type: 'SET_USER_REQUESTS', payload: [] });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
      dispatch({ type: 'SET_DONATIONS', payload: [] });
    }
  }, [user, loadUserData]); // We add loadUserData here
  
  const value = {
    ...state,
    
    // Aliases for Dashboards
    donations: state.userDonations,
    requests: state.userRequests,
    
    // Alias for BrowseItems Page
    allDonations: state.donations, 
    
    // Combined Loading/Error for simple components
    loading: Object.values(state.loading).some(Boolean),
    error: Object.values(state.errors).find(Boolean),

    // Granular states for complex components
    loadingStates: state.loading,
    errorStates: state.errors,

    // Actions
    loadUserData,
    loadDonations,
    createDonation,
    createRequest,
    cancelRequest,

    // Aliases for components
    reload: loadUserData,
    addRequest: createRequest,
    addDonation: createDonation,
    
    // Aliases for RecipientDashboard
    fetchAvailableDonations: loadDonations,
    fetchUserRequests: loadUserData,
    fetchNotifications: loadUserData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};