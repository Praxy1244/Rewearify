import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DonorDashboard from '../components/Dashboard/DonorDashboard';
import RecipientDashboard from '../components/Dashboard/RecipientDashboard';  
import AdminDashboard from '../components/Dashboard/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
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