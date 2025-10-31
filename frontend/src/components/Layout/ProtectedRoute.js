import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/spinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but remember where they tried to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- 💡 NEW LOGIC FOR PENDING USERS ---
  
  // 2. If the user's role is 'pending'
  if (user.role === 'pending') {
    // A) If they are trying to go to the '/select-role' page, let them.
    if (location.pathname === '/select-role') {
      return children;
    }
    // B) If they are 'pending' and trying to go ANYWHERE ELSE, force them to the '/select-role' page.
    return <Navigate to="/select-role" replace />;
  }
  
  // 3. If the user is NOT 'pending' but is trying to access '/select-role' (e.g., by using the back button), send them to the home page.
  if (location.pathname === '/select-role') {
    return <Navigate to="/" replace />;
  }
  
  // 4. If the user has a valid role, but not the one allowed for this route (e.g., a 'donor' trying to access '/admin-dashboard')
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Send them to the main landing page (the portal), NOT /dashboard. This fixes the infinite loop.
    return <Navigate to="/" replace />;
  }
  

  return children;
};

export default ProtectedRoute;