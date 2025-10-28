import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DonorDashboard from '../components/Dashboard/DonorDashboard';
import RecipientDashboard from '../components/Dashboard/RecipientDashboard';  
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import { Spinner } from '../components/ui/spinner';

const Dashboard = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2 text-lg">Loading your dashboard...</span>
      </div>
    );
  }

  // If not loading but no user, they're not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to access your dashboard.
          </p>
          <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case 'donor':
        return <DonorDashboard />;
      case 'recipient':
        return <RecipientDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Role not recognized
              </h2>
              <p className="text-gray-600">
                Please contact support if you continue to see this message.
              </p>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default Dashboard;