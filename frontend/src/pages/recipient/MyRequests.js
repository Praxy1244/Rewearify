import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { requestService, matchingService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Clock, CheckCircle, Package, Edit, Trash2, ChevronDown, ChevronUp, Sparkles, MapPin, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    active: 'bg-blue-100 text-blue-800',
    matched: 'bg-purple-100 text-purple-800',
    fulfilled: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={`${statusStyles[status] || 'bg-gray-100 text-gray-800'} capitalize`}>
      {status ? status.replace('_', ' ') : 'Unknown'}
    </Badge>
  );
};

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [matchData, setMatchData] = useState({});
  const hasFetchedRef = useRef(false); // ✅ Use ref to track if already fetched
  const [stats, setStats] = useState({
    pending: 0,
    fulfilled: 0,
    totalItemsReceived: 0,
    totalRequests: 0,
  });

  const calculateStats = (requests) => {
    if (!requests) return;
    const pending = requests.filter(r => ['active', 'matched'].includes(r.status)).length;
    const fulfilled = requests.filter(r => r.status === 'fulfilled').length;
    const totalItemsReceived = requests.filter(r => r.status === 'fulfilled').reduce((sum, r) => sum + r.quantity, 0);

    setStats({
      pending,
      fulfilled,
      totalItemsReceived,
      totalRequests: requests.length,
    });
  };

const loadMatchesForRequest = async (requestId) => {
  console.log(`📞 Calling API for request: ${requestId}`);
  try {
    const response = await matchingService.getMatchesForRequest(requestId);
    
    console.log(`📦 API Response for ${requestId}:`, response);
    
    // ✅ CHANGED: Check for matches directly, not response.success
    if (response && response.matches) {
      const count = response.matches.length;
      console.log(`✅ Request ${requestId}: ${count} matches`);
      
      setMatchData(prev => ({
        ...prev,
        [requestId]: {
          matches: response.matches,
          count: count,
          loaded: true
        }
      }));
    } else {
      console.log(`⚠️ No matches field in response for ${requestId}`);
      setMatchData(prev => ({
        ...prev,
        [requestId]: {
          matches: [],
          count: 0,
          loaded: true
        }
      }));
    }
  } catch (error) {
    console.error(`❌ Error loading matches for ${requestId}:`, error);
    setMatchData(prev => ({
      ...prev,
      [requestId]: {
        matches: [],
        count: 0,
        loaded: true
      }
    }));
  }
};


  // ✅ Fetch requests once
  useEffect(() => {
    if (hasFetchedRef.current || !user) return; // Skip if already fetched
    hasFetchedRef.current = true;

    const fetchRequests = async () => {
      try {
        const response = await requestService.getMyRequests(user._id);
        
        if (response.success) {
          const requestList = Array.isArray(response.data) ? response.data : [];
          console.log(`📋 Loaded ${requestList.length} requests`);
          setRequests(requestList);
          calculateStats(requestList);
          
          console.log(`🎯 About to load matches for ${requestList.length} requests`);
        requestList.forEach(request => {
          console.log(`🔄 Starting load for request: ${request._id}`);
          loadMatchesForRequest(request._id);
        });
        console.log(`✅ Dispatched all match loading calls`);
        } else {
          toast.error(response.message || 'Failed to fetch requests');
        }
      } catch (error) {
        console.error('Fetch requests error:', error);
        toast.error('Failed to fetch your requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);
  
  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
        return;
    }

    try {
        await requestService.deleteRequest(requestId);
        toast.success('Request deleted successfully');
        setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch(error) {
        toast.error(error.message || 'Failed to delete request');
    }
  };

  const toggleMatches = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
            <p className="text-gray-600 mt-1">Track and manage all your donation requests</p>
          </div>
          <Button onClick={() => navigate('/recipient/create-request')}>
            <Plus className="h-5 w-5 mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fulfilled Requests</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.fulfilled}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items Received</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalItemsReceived}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRequests}</div>
                </CardContent>
            </Card>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length > 0 ? (
            requests.map(request => {
              const requestMatchData = matchData[request._id] || { matches: [], count: 0, loaded: false };
              const hasMatches = requestMatchData.count > 0;
              const isExpanded = expandedRequests[request._id];
              const matchCount = requestMatchData.count;

              return (
                <Card key={request._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Main Request Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900 hover:text-blue-700">
                               <Link to={`/requests/${request._id}`}>{request.title || 'Untitled Request'}</Link>
                            </h3>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={request.status} />
                              {!requestMatchData.loaded && (
                                <Badge className="bg-gray-100 text-gray-600">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Checking...
                                </Badge>
                              )}
                              {requestMatchData.loaded && hasMatches && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{request.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">{request.category}</Badge>
                            <Badge variant="outline">{request.subcategory}</Badge>
                            {request.urgency === 'high' && <Badge className="bg-red-100 text-red-800">High Urgency</Badge>}
                            <Badge variant="outline">{request.quantity} items needed</Badge>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/requests/${request._id}`)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toast.info('Edit feature coming soon!')}>
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(request._id)}>
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>

                      {/* AI Matches Toggle - Only show if there are matches */}
                      {requestMatchData.loaded && hasMatches && (
                        <div className="border-t pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center justify-between text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => toggleMatches(request._id)}
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              <span className="font-medium">
                                {isExpanded ? 'Hide' : 'Show'} {matchCount} AI-Matched Donation{matchCount !== 1 ? 's' : ''}
                              </span>
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Expandable Matches Section */}
                          {isExpanded && (
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                              {requestMatchData.matches.slice(0, 3).map((match) => (
                                <div key={match.donation_id} className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-900">{match.donation_title}</h4>
                                        <Badge className={getScoreColor(match.score)}>
                                          {Math.round(match.score)}% Match
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <User className="h-3 w-3" />
                                        <span>{match.donor_name}</span>
                                        <span>•</span>
                                        <MapPin className="h-3 w-3" />
                                        <span>{match.distance_km} km away</span>
                                        <span>•</span>
                                        <Package className="h-3 w-3" />
                                        <span>{match.quantity} items</span>
                                      </div>

                                      <div className="flex flex-wrap gap-1">
                                        {match.reasons && match.reasons.slice(0, 2).map((reason, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {reason}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>

                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => navigate(`/donations/${match.donation_id}`)}
                                    >
                                      View
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {requestMatchData.matches.length > 3 && (
                                <div className="text-center text-sm text-gray-600">
                                  + {requestMatchData.matches.length - 3} more matches available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 mt-4 border-t pt-2">
                      Requested on: {request.createdAt ? format(new Date(request.createdAt), 'MMM dd, yyyy') : 'Date not available'}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Requests Found</h3>
              <p className="text-gray-500 mt-1">
                You haven't created any requests yet. Get started by letting donors know what you need.
              </p>
              <Button onClick={() => navigate('/recipient/create-request')} className="mt-4">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRequests;
