import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import userService from '../services/userService'; 
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

  // 1. Initialize Auth State
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const response = await authService.getCurrentUser();
          if (response.success) {
            setUser(response.data.user);
          } else {
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout(); 
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // 2. Login Function
  // 2. Login Function
const login = async (email, password) => {
  try {
    const response = await authService.login({ email, password });
    if (response.success) {
      // Set token in localStorage immediately!
      localStorage.setItem('token', response.data.token);
      // Fetch the current user details immediately AFTER successful login
      const userResp = await authService.getCurrentUser();
      if (userResp.success) {
        setUser(userResp.data.user);
      } else {
        setUser(null);
      }
    }
    return response; 
  } catch (error) {
    throw error; 
  }
};


  // 3. Signup Function
  const signup = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      throw error; 
    }
  };

  // 4. Logout Function
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

  // 5. Google OAuth Callback Handler
  const handleOAuthCallback = async (token, navigate) => {
        try {
          localStorage.setItem('token', token);
          localStorage.setItem('rewearify_token', token); 
          
          const response = await authService.getCurrentUser();
          
          if (response.success) {
            const freshUser = response.data.user;
            setUser(freshUser);
            
            // --- 💡 THE NEW, CLEANER LOGIC ---
            // 4. Check if the user's role is 'pending'
            if (freshUser.role === 'pending') {
              // This is a new user. Force them to select a role.
              navigate('/select-role');
            } else {
              // This is a returning user. Send them to the main landing page.
              navigate('/');
            }
            // --- END OF FIX ---

          } else {
            throw new Error('Failed to fetch user after OAuth login');
          }
        } catch (error) {
          console.error("OAuth Callback Error:", error);
          logout(); 
          navigate('/login?error=oauth_failed');
        }
      };
    
  // 6. Helper function to update user state locally
  const updateUserContext = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
    
  // 7. API function to update user profile
  const updateUserProfile = async (updatedData) => {
    try {
      if (!user || !user._id) {
        throw new Error("No user found to update.");
      }
      
      const response = await userService.updateUserProfile(user._id, updatedData);
      
      if (response.success) {
        updateUserContext(response.data.user); // Update context
        return response;
      }
      
      return response;
    } catch (error) {
      throw error; 
    }
  };



  // Pass all values to children
  const value = {
    user,
   
    login,
    signup,
    logout,
    handleOAuthCallback,
    updateUserProfile,
    updateUserContext,
    
    loading,
    isAuthenticated: authService.isAuthenticated()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

