import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import RewearifyLogo from '../../components/Layout/RewearifyLogo';

const AuthCallback = () => {
  const { handleOAuthCallback } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // This function will save the token and user data
      handleOAuthCallback(token, navigate);
    } else {
      // If no token, redirect to login with an error
      navigate('/login?error=oauth_failed');
    }
  }, [location, navigate, handleOAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <RewearifyLogo />
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-600" />
        <p className="text-lg text-gray-600">Finalizing your login, please wait...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
