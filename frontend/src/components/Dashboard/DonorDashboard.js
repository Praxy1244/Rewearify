import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Settings } from 'lucide-react';
import { 
  Plus, 
  Package, 
  Heart, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Award,
  Bell,
  Recycle, 
  TrendingUp,
  Sparkles,
  Building
} from 'lucide-react';

// --- AI Features ---
import { RequestSuggestions } from '../AI/RequestSuggestions';
import aiService from '../../services/aiService';

const DonorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { donations, notifications, loading, error, reload } = useApp();

  // AI State
  const [trendingItems, setTrendingItems] = useState([]);

  // Fetch AI Trends independently so it doesn't block the main UI
  useEffect(() => {
    const fetchTrends = async () => {
        try {
            const res = await aiService.getDonorTrends();
            if (res.trending) setTrendingItems(res.trending);
        } catch (err) {
            // Silent fail for AI suggestions
            console.log("AI Trends not available");
        }
    };
    fetchTrends();
  }, []);

  const userDonations = donations || [];
  const completedMatches = userDonations.filter(d => d.status === 'completed').length;
  const impactScore = (user?.statistics?.rating || 0) * 50 + completedMatches * 20 + userDonations.length * 5; 

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'matched': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'completed': return <Heart className="h-4 w-4 text-purple-600" />;
      case 'matched': return <CheckCircle className="h-4 w-4 text-blue-600" />; 
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
          <Button onClick={reload} variant="outline" size="sm" className="mt-2 border-red-300 text-red-700 hover:bg-red-100">
             Try Again
           </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profile?.profilePicture?.url} alt={user?.name} />
              <AvatarFallback className="text-xl">{user?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-1">
                Ready to make a difference in your community today?
              </p>
            </div>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/donate">
                <Plus className="h-5 w-5 mr-2" />
                New Donation
              </Link>
            </Button>
          </div>

          {/* Impact Card */}
          <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 shadow-xl rounded-xl overflow-hidden">
             <CardContent className="p-8">
               <h3 className="text-xl font-semibold mb-4 flex items-center">
                 <Award className="h-6 w-6 mr-2" />
                 Your Impact Snapshot
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                   <Package className="h-8 w-8 mx-auto mb-2 text-white" />
                   <div className="text-3xl font-bold">{userDonations.length}</div>
                   <div className="text-green-100 mt-1">Total Donations</div>
                 </div>
                 <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                   <CheckCircle className="h-8 w-8 mx-auto mb-2 text-white" />
                   <div className="text-3xl font-bold">{completedMatches}</div>
                   <div className="text-green-100 mt-1">Successful Matches</div>
                 </div>
                 <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                   <TrendingUp className="h-8 w-8 mx-auto mb-2 text-white" />
                   <div className="text-3xl font-bold">{impactScore}</div>
                   <div className="text-green-100 mt-1">Impact Score</div>
                 </div>
                 <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm flex flex-col items-center justify-center">
                   <Award className="h-8 w-8 mb-2 text-yellow-300" />
                   <Badge className="mt-2 bg-white/20 text-white border-white/30 text-xs">
                     Eco Champion
                   </Badge>
                 </div>
               </div>
             </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Recent Donations</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/donor/my-donations">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userDonations.length > 0 ? userDonations.slice(0, 3).map((donation) => (
                    <div key={donation._id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <img 
                        src={donation.images?.[0]?.url || 'https://placehold.co/64x64/E2E8F0/4A5568?text=Img'} 
                        alt={donation.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/64x64/E2E8F0/4A5568?text=Error'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{donation.title || 'Untitled Donation'}</h4>
                        <p className="text-sm text-gray-600">{donation.quantity || 0} items • {donation.category || 'N/A'}</p>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          {getStatusIcon(donation.status)}
                          <Badge className={`${getStatusColor(donation.status)} text-xs font-medium`}>
                            {donation.status || 'Unknown'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                             {new Date(donation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                        <Link to={`/donor/my-donations`}><Eye className="h-4 w-4" /></Link> 
                      </Button>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You haven't made any donations yet.</p>
                      <Button asChild className="bg-green-600 hover:bg-green-700">
                        <Link to="/donate">Make Your First Donation</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             
             {/* --- AI Feature: Community Needs --- */}
             {trendingItems.length > 0 && (
                 <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-indigo-700 text-lg">
                            <Sparkles className="w-5 h-5" />
                            Community Needs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-indigo-600 mb-3">
                            High demand items in your area:
                        </p>
                        <RequestSuggestions 
                            suggestions={trendingItems} 
                            onSelect={(item) => navigate(`/donate?type=${item}`)} 
                        />
                    </CardContent>
                 </Card>
             )}
             {/* ----------------------------------- */}

            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline"><Link to="/donate"><Plus className="h-4 w-4 mr-2" />Add New Donation</Link></Button>
                <Button asChild className="w-full justify-start" variant="outline"><Link to="/donor/my-donations"><Package className="h-4 w-4 mr-2" />Track My Donations</Link></Button>
                <Button asChild className="w-full justify-start" variant="outline"><Link to="/donor/profile"><Settings className="h-4 w-4 mr-2" />Settings</Link></Button>
              </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-4">
                 <CardTitle className="flex items-center space-x-2">
                   <Bell className="h-5 w-5 text-blue-600" />
                   <span>Recent Notifications</span>
                 </CardTitle>
               </CardHeader>
              <CardContent>
                 <div className="space-y-3 max-h-48 overflow-y-auto">
                   {notifications.length > 0 ? notifications.slice(0, 5).map((n) => (
                      <div key={n._id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 border-b last:border-b-0">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 truncate">{n.message}</p>
                        </div>
                      </div>
                   )) : (
                     <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
                   )}
                 </div>
                <Button variant="outline" size="sm" className="w-full mt-4" asChild><Link to="/notifications">View All Notifications</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="mb-8">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="h-16 w-16 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-1/2 bg-gray-200 rounded" />
          <Skeleton className="h-4 w-1/3 bg-gray-200 rounded" />
        </div>
         <Skeleton className="h-10 w-36 bg-gray-200 rounded-md" />
      </div>
      <Skeleton className="h-40 w-full bg-gray-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
         <Skeleton className="h-64 w-full bg-gray-200 rounded-lg" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full bg-gray-200 rounded-lg" />
        <Skeleton className="h-56 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

export default DonorDashboard;