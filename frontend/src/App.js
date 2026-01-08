// src/App.tsx - Updated to integrate with existing React app structure
import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from './components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';


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
import RecommendationsFAB from './pages/donor/RecommendationsFAB';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import DonationForm from './pages/donor/DonationForm';
import MyDonations from './pages/donor/MyDonations';
import DonationDetails from './pages/donor/DonationDetails';
import DonationEdit from './pages/donor/DonationEdit';
import BrowseNeeds from "./pages/donor/BrowseNeeds";
import AIInsights from './pages/donor/AIInsights';
import PersonalizedRecommendations from './pages/donor/PersonalizedRecommendations';
import DonationRequests from './pages/donor/DonationRequests';
import Notifications from './pages/Notifications'; 
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import BrowseItems from "./pages/recipient/BrowseItems";
import MyRequests from "./pages/recipient/MyRequests";
import RequestDetail from './pages/recipient/RequestDetail';
import CreateRequest from './pages/recipient/CreateRequest';
import Dashboard from './pages/Dashboard';
import DonorDashboard from './components/Dashboard/DonorDashboard';
import RecipientDashboard from './components/Dashboard/RecipientDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard'; 
import Profile from "./pages/Profile";
import ManageDonations from "./pages/admin/ManageDonations";
import ManageUsers from "./pages/admin/ManageUsers";
import Analytics from "./pages/admin/Analytics";
import ErrorBoundary from './components/Layout/ErrorBoundary';
import AuthCallback from "./pages/auth/AuthCallback";
import VerifyEmail from "./pages/auth/VerifyEmail";
import SelectRole from "./pages/auth/SelectRole"; 
import FraudDetection from './pages/admin/FraudDetection';
import Forecasting from './pages/admin/Forecasting';
import LogisticsDashboard from './pages/admin/LogisticsDashboard';
import PublicDonationDetails from './pages/PublicDonationDetails';
import NGOClustering from './pages/admin/NGOClustering';
import DonationOffers from './pages/recipient/DonationOffers';
import Congratulations from "./pages/donor/Congratulations";
import Achievements from "./pages/donor/Achievements";


// ✅ Wrapper component to control Footer visibility and FAB
function AppContent() {
  const location = useLocation();
  const { user } = useAuth();

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

          <Route path="/donor/ai-insights" element={
             <ProtectedRoute allowedRoles={['donor']}>
              <AIInsights />
            </ProtectedRoute> } />

          {/* ✨ NEW: Personalized Recommendations Route */}
          <Route path="/donor/recommendations" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <PersonalizedRecommendations />
            </ProtectedRoute>
          } />

          {/* ✨ NEW: Donation Requests Route */}
          <Route path="/donor/donation-requests" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonationRequests />
            </ProtectedRoute>
          } />
{/* ✨ Congratulations Routes - Support both request and donation IDs */}
<Route path="/donor/congratulations/:id" element={
  <ProtectedRoute allowedRoles={['donor']}>
    <Congratulations />
  </ProtectedRoute>
} />


          {/* ✨ NEW: Achievements Route */}
          <Route path="/donor/achievements" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <Achievements />
            </ProtectedRoute>
          } />


          {/* Recipient Routes */}
          <Route path="/recipient/browseItems" element={
            <ProtectedRoute allowedRoles={['recipient']}>
              <BrowseItems />
            </ProtectedRoute>
          } />

         
          <Route path="/recipient/my-requests" element={
            <ProtectedRoute allowedRoles={['recipient']}>
             <MyRequests />
            </ProtectedRoute>
          } />

          <Route path="/requests/:id" element={
            <ProtectedRoute allowedRoles={['recipient']}>
            <RequestDetail />
                </ProtectedRoute> 
          }/>

          <Route path="/recipient/create-request" element={
            <ProtectedRoute allowedRoles={['recipient']}>
              <CreateRequest />
            </ProtectedRoute>
          } />
          <Route path="/recipient/offers" element={
            <ProtectedRoute allowedRoles={['recipient']}>
             <DonationOffers />
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

          <Route path="/admin/logistics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <LogisticsDashboard />
            </ProtectedRoute>
          } />

          
          {/* Notifications Route */}
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['donor', 'recipient']}>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/admin/fraud-detection" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FraudDetection />
            </ProtectedRoute> } />

          <Route path="/admin/forecasting" element={
              <ProtectedRoute allowedRoles={['admin']}>
              <Forecasting />
            </ProtectedRoute> } />

            <Route path="/admin/clustering" element={
              <ProtectedRoute allowedRoles={['admin']}>
             <NGOClustering />
            </ProtectedRoute>} />


          {/* 💡 UNIFIED PROFILE ROUTES */}
          <Route path="/donor/profile" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/recipient/profile" element={
            <ProtectedRoute allowedRoles={['recipient']}>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Profile />
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
          <Route path="/donations/:id" element={<PublicDonationDetails />} />
        </Routes>
      </main>

      {/* ✨ Show Floating Action Button only for donors */}
      {user?.role === 'donor' && <RecommendationsFAB />}

      {/* ✅ Show Footer only if not in hidden pages */}
      {showFooterPage.includes(location.pathname) && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
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
           <HotToaster 
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#fff',
                  color: '#333',
                },
              }}
            />

          </BrowserRouter>
        </div>
      </AppProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
