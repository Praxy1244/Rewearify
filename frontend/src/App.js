// src/App.tsx - Updated to integrate with existing React app structure
import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { Toaster } from './components/ui/toaster';

// Create a screen reader announcer element
const ScreenReaderAnnouncer = () => {
  useEffect(() => {
    if (!document.getElementById('screen-reader-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'screen-reader-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'polite');
      document.body.appendChild(announcer);
    }
    
    // Add global skip link for keyboard users
    if (!document.getElementById('skip-to-content')) {
      const skipLink = document.createElement('a');
      skipLink.id = 'skip-to-content';
      skipLink.href = '#main-content';
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600';
      skipLink.textContent = 'Skip to main content';
      document.body.prepend(skipLink);
    }
    
    return () => {
      const announcer = document.getElementById('screen-reader-announcer');
      const skipLink = document.getElementById('skip-to-content');
      if (announcer) announcer.remove();
      if (skipLink) skipLink.remove();
    };
  }, []);
  
  return null;
};

// Layout Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import DonationForm from './pages/donor/DonationForm';
import MyDonations from './pages/donor/MyDonations';
import DonationDetails from './pages/donor/DonationDetails';
import DonationEdit from './pages/donor/DonationEdit';
import BrowseNeeds from "./pages/donor/BrowseNeeds";
import DonorProfile from "./pages/donor/DonorProfile";
import Notifications from './pages/Notifications'; 
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import BrowseItems from "./pages/recipient/BrowseItems";
import MyRequests from "./pages/recipient/MyRequests";
import Organizations from "./pages/recipient/Organizations";
import Dashboard from './pages/Dashboard';
import DonorDashboard from './components/Dashboard/DonorDashboard';
import RecipientDashboard from './components/Dashboard/RecipientDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard'; 
import RecipientProfile from "./pages/recipient/RecipientProfile";
import Profile from "./pages/admin/Profile";
import ManageDonations from "./pages/admin/ManageDonations";
import ManageUsers from "./pages/admin/ManageUsers";
import Analytics from "./pages/admin/Analytics";
import ErrorBoundary from './components/Layout/ErrorBoundary';
import AuthCallback from "./pages/auth/AuthCallback";
import VerifyEmail from "./pages/auth/VerifyEmail";
import SelectRole from "./pages/auth/SelectRole"; 


// AI Pages
import AIInsights from "./pages/ai/AIInsights";

// ✅ Wrapper component to control Footer visibility
function AppContent() {
  const location = useLocation();

  const showFooterPage = ["/"];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "donor", "recipient"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["donor"]}>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipient-dashboard"
            element={
              <ProtectedRoute allowedRoles={["recipient"]}>
                <RecipientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Donor Routes */}
          <Route path="/donor/donate" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonationForm />
            </ProtectedRoute>
          } />

          <Route path="/donor/my-donations" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <MyDonations />
            </ProtectedRoute>
          } />

          <Route path="/donor/donations/:id" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonationDetails />
            </ProtectedRoute>
          } />

          <Route path="/donor/donations/:id/edit" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonationEdit />
            </ProtectedRoute>
          } />

          <Route path="/donor/browseNeeds" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <BrowseNeeds />
            </ProtectedRoute>
          } />

          <Route path="/donor/profile" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorProfile />
            </ProtectedRoute>
          } />

          {/* Recipient Routes */}
          <Route path="/recipient/browseItems" element={
            <ProtectedRoute allowedRoles={['recipient']}>
              <BrowseItems />
            </ProtectedRoute>
          } />

          <Route path="/recipient/organizations" element={
            <ProtectedRoute allowedRoles={['recipient']}>
             <Organizations />
            </ProtectedRoute>
          } />

          <Route path="/recipient/my-requests" element={
            <ProtectedRoute allowedRoles={['recipient']}>
             <MyRequests />
            </ProtectedRoute>
          } />

          <Route path="/recipient/profile" element={
            <ProtectedRoute allowedRoles={['recipient']}>
              <RecipientProfile />
            </ProtectedRoute>
          } />

          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Profile/>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/donations" element={
            <ProtectedRoute allowedRoles={['admin']}>
            <ManageDonations/>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
            <ManageUsers/>
            </ProtectedRoute>
          } />

          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
            <Analytics/>
            </ProtectedRoute>
          } />

          {/* AI Routes */}
          <Route path="/ai/insights" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AIInsights />
            </ProtectedRoute>
          } />

          {/* Notifications Route */}
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['donor', 'recipient']}>
              <Notifications />
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            </div>
          } />

           <Route path="/verify-email/:token" element={<VerifyEmail />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route 
            path="/select-role" 
            element={
              <ProtectedRoute allowedRoles={["donor", "recipient", "admin"]}>
                <SelectRole />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {/* ✅ Show Footer only if not in hidden pages */}
      {showFooterPage.includes(location.pathname) && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="App">
          <BrowserRouter>
            <ScreenReaderAnnouncer />
            <div id="main-content">
              <ErrorBoundary>
              <AppContent />
              </ErrorBoundary>
            </div>
            <Toaster />
          </BrowserRouter>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;