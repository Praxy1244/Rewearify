import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AlertTriangle } from 'lucide-react';
import RewearifyLogo from '../components/Layout/RewearifyLogo';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <RewearifyLogo />
        
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-400" />
          <h1 className="mt-6 text-3xl font-bold text-gray-800">Oops! Something went wrong.</h1>
          <p className="mt-4 text-gray-600">
            We're sorry, but it looks like there was an unexpected server error. Our team has been notified and we're working to fix it.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="mt-8 w-full bg-green-600 hover:bg-green-700"
          >
            Go Back to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
