import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import donationService from '../services/donationService';
import requestService from '../services/requestService';
import userService from '../services/userService';

const AppContext = createContext();

const initialState = {
  // User data
  userProfile: null,
  
  // Donations
  donations: [],
  userDonations: [],
  nearbyDonations: [],
  
  // Requests
  requests: [],
  userRequests: [],
  nearbyRequests: [],
  
  // Organizations
  organizations: [],
  
  // Loading states
  loading: {
    donations: false,
    requests: false,
    profile: false,
    organizations: false
  },
  
  // Error states
  errors: {
    donations: null,
    requests: null,
    profile: null,
    organizations: null
  }
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error
        }
      };
      
    case 'SET_USER_PROFILE':
      return {
        ...state,
        userProfile: action.payload
      };
      
    case 'SET_DONATIONS':
      return {
        ...state,
        donations: action.payload
      };
      
    case 'SET_USER_DONATIONS':
      return {
        ...state,
        userDonations: action.payload
      };
      
    case 'SET_NEARBY_DONATIONS':
      return {
        ...state,
        nearbyDonations: action.payload
      };
      
    case 'ADD_DONATION':
      return {
        ...state,
        donations: [action.payload, ...state.donations],
        userDonations: [action.payload, ...state.userDonations]
      };
      
    case 'UPDATE_DONATION':
      const updateDonations = (donations) =>
        donations.map(donation =>
          donation.id === action.payload.id ? action.payload : donation
        );
      
      return {
        ...state,
        donations: updateDonations(state.donations),
        userDonations: updateDonations(state.userDonations),
        nearbyDonations: updateDonations(state.nearbyDonations)
      };
      
    case 'REMOVE_DONATION':
      const filterDonations = (donations) =>
        donations.filter(donation => donation.id !== action.payload);
      
      return {
        ...state,
        donations: filterDonations(state.donations),
        userDonations: filterDonations(state.userDonations),
        nearbyDonations: filterDonations(state.nearbyDonations)
      };
      
    case 'SET_REQUESTS':
      return {
        ...state,
        requests: action.payload
      };
      
    case 'SET_USER_REQUESTS':
      return {
        ...state,
        userRequests: action.payload
      };
      
    case 'SET_NEARBY_REQUESTS':
      return {
        ...state,
        nearbyRequests: action.payload
      };
      
    case 'ADD_REQUEST':
      return {
        ...state,
        requests: [action.payload, ...state.requests],
        userRequests: [action.payload, ...state.userRequests]
      };
      
    case 'UPDATE_REQUEST':
      const updateRequests = (requests) =>
        requests.map(request =>
          request.id === action.payload.id ? action.payload : request
        );
      
      return {
        ...state,
        requests: updateRequests(state.requests),
        userRequests: updateRequests(state.userRequests),
        nearbyRequests: updateRequests(state.nearbyRequests)
      };
      
    case 'REMOVE_REQUEST':
      const filterRequests = (requests) =>
        requests.filter(request => request.id !== action.payload);
      
      return {
        ...state,
        requests: filterRequests(state.requests),
        userRequests: filterRequests(state.userRequests),
        nearbyRequests: filterRequests(state.nearbyRequests)
      };
      
    case 'SET_ORGANIZATIONS':
      return {
        ...state,
        organizations: action.payload
      };
      
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Load initial data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      dispatch({ type: 'SET_USER_PROFILE', payload: null });
      dispatch({ type: 'SET_USER_DONATIONS', payload: [] });
      dispatch({ type: 'SET_USER_REQUESTS', payload: [] });
    }
  }, [user]);

  const setLoading = (key, value) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  };

  const setError = (key, error) => {
    dispatch({ type: 'SET_ERROR', payload: { key, error } });
  };

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user profile
      setLoading('profile', true);
      const profileResponse = await userService.getUserById(user.id);
      if (profileResponse.success) {
        dispatch({ type: 'SET_USER_PROFILE', payload: profileResponse.data.user });
      }
    } catch (error) {
      setError('profile', error.message);
    } finally {
      setLoading('profile', false);
    }

    try {
      // Load user donations
      setLoading('donations', true);
      const donationsResponse = await donationService.getUserDonations(user.id);
      if (donationsResponse.success) {
        dispatch({ type: 'SET_USER_DONATIONS', payload: donationsResponse.data.donations });
      }
    } catch (error) {
      setError('donations', error.message);
    } finally {
      setLoading('donations', false);
    }

    try {
      // Load user requests
      setLoading('requests', true);
      const requestsResponse = await requestService.getUserRequests(user.id);
      if (requestsResponse.success) {
        dispatch({ type: 'SET_USER_REQUESTS', payload: requestsResponse.data.requests });
      }
    } catch (error) {
      setError('requests', error.message);
    } finally {
      setLoading('requests', false);
    }
  };

  // Donation methods
  const loadDonations = async (params = {}) => {
    try {
      setLoading('donations', true);
      setError('donations', null);
      
      const response = await donationService.getDonations(params);
      if (response.success) {
        dispatch({ type: 'SET_DONATIONS', payload: response.data.donations });
      }
      
      return response;
    } catch (error) {
      setError('donations', error.message);
      throw error;
    } finally {
      setLoading('donations', false);
    }
  };

  const createDonation = async (donationData) => {
    try {
      const response = await donationService.createDonation(donationData);
      if (response.success) {
        dispatch({ type: 'ADD_DONATION', payload: response.data.donation });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateDonation = async (donationId, donationData) => {
    try {
      const response = await donationService.updateDonation(donationId, donationData);
      if (response.success) {
        dispatch({ type: 'UPDATE_DONATION', payload: response.data.donation });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const deleteDonation = async (donationId) => {
    try {
      const response = await donationService.deleteDonation(donationId);
      if (response.success) {
        dispatch({ type: 'REMOVE_DONATION', payload: donationId });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Request methods
  const loadRequests = async (params = {}) => {
    try {
      setLoading('requests', true);
      setError('requests', null);
      
      const response = await requestService.getRequests(params);
      if (response.success) {
        dispatch({ type: 'SET_REQUESTS', payload: response.data.requests });
      }
      
      return response;
    } catch (error) {
      setError('requests', error.message);
      throw error;
    } finally {
      setLoading('requests', false);
    }
  };

  const createRequest = async (requestData) => {
    try {
      const response = await requestService.createRequest(requestData);
      if (response.success) {
        dispatch({ type: 'ADD_REQUEST', payload: response.data.request });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateRequest = async (requestId, requestData) => {
    try {
      const response = await requestService.updateRequest(requestId, requestData);
      if (response.success) {
        dispatch({ type: 'UPDATE_REQUEST', payload: response.data.request });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const deleteRequest = async (requestId) => {
    try {
      const response = await requestService.deleteRequest(requestId);
      if (response.success) {
        dispatch({ type: 'REMOVE_REQUEST', payload: requestId });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Convenience methods
  const addRequest = (itemData) => {
    return createRequest(itemData);
  };

  const cancelRequest = (requestId) => {
    return deleteRequest(requestId);
  };

  const updateUserProfile = (profileData) => {
    dispatch({ type: 'SET_USER_PROFILE', payload: { ...state.userProfile, ...profileData } });
  };

  // Load nearby data
  const loadNearbyData = async (lat, lng, radius = 25) => {
    try {
      const [donationsResponse, requestsResponse] = await Promise.all([
        donationService.getNearbyDonations(lat, lng, radius),
        requestService.getNearbyRequests(lat, lng, radius)
      ]);

      if (donationsResponse.success) {
        dispatch({ type: 'SET_NEARBY_DONATIONS', payload: donationsResponse.data.donations });
      }

      if (requestsResponse.success) {
        dispatch({ type: 'SET_NEARBY_REQUESTS', payload: requestsResponse.data.requests });
      }
    } catch (error) {
      console.error('Failed to load nearby data:', error);
    }
  };

  const value = {
    // State
    ...state,
    
    // Donation methods
    loadDonations,
    createDonation,
    updateDonation,
    deleteDonation,
    
    // Request methods
    loadRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    addRequest, // Alias for createRequest
    cancelRequest, // Alias for deleteRequest
    
    // User methods
    updateUserProfile,
    loadUserData,
    
    // Location-based methods
    loadNearbyData
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