import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext'; // ✨ ADDED
import { notificationService } from '../../services';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import RewearifyLogo from '../../components/Layout/RewearifyLogo';
import NotificationBell from './NotificationBell'; // ✨ ADDED
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { 
  Bell, 
  User, 
  LogOut, 
  Settings,
  Heart,
  Leaf,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // ✨ UPDATED: Use real-time notification context
  const { 
    notifications, 
    unreadCount, 
    isConnected  // Socket connection status
  } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'donor': return 'bg-green-100 text-green-800 border-green-200';
      case 'recipient': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNavLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'donor':
        return [
          { path: '/donor-dashboard', label: 'Dashboard' },
          { path: '/donor/donate', label: 'New Donation' },
          { path: '/donor/my-donations', label: 'My Donations' },
          { path: '/donor/browseNeeds', label: 'Browse Needs' }
        ];
      case 'recipient':
        return [
          { path: '/recipient-dashboard', label: 'Dashboard' },
          { path: '/recipient/browseItems', label: 'Browse Items' },
          { path: '/recipient/my-requests', label: 'My Requests' },
          { path: '/recipient/organizations', label: 'Organizations' }
        ];
      case 'admin':
        return [
          { path: '/admin-dashboard', label: 'Dashboard' },
          { path: '/admin/donations', label: 'Manage Donations' },
          { path: '/admin/users', label: 'Manage Users' },
          { path: '/admin/logistics', label: 'Logistics' },
          { path: '/admin/analytics', label: 'Analytics' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();
  
  const getProfilePath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "donor": return "/donor/profile";
      case "recipient": return "/recipient/profile";
      case "admin": return "/admin/profile";
      default: return "/profile";
    }
  };

  const getNotificationsPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "donor": return "/donor/notifications";
      case "recipient": return "/recipient/notifications";
      case "admin": return "/admin/notifications";
      default: return "/notifications";
    }
  };

  const getSettingsPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "donor": return "/donor/settings";
      case "recipient": return "/recipient/settings";
      case "admin": return "/admin/settings";
      default: return "/settings";
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <RewearifyLogo />

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* ✨ REPLACED OLD NOTIFICATION DROPDOWN WITH NEW NOTIFICATION BELL */}
                <NotificationBell />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 h-auto p-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profilePicture} alt={user.name} />
                        <AvatarFallback>
                          {user?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuItem onClick={() => navigate(getProfilePath())}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(getSettingsPath())}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile menu button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-2 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    location.pathname === link.path
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
