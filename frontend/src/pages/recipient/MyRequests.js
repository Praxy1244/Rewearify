import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { requestService, matchingService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Clock, CheckCircle, Package, Edit, Trash2, ChevronDown, ChevronUp, Sparkles, MapPin, User, Loader2, Truck, Star, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';

const StatusBadge = ({ status, type }) => {
  const statusStyles = {
    // Request statuses
    active: 'bg-blue-100 text-blue-800',
    matched: 'bg-purple-100 text-purple-800',
    fulfilled: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
    // Donation statuses
    accepted_by_ngo: 'bg-yellow-100 text-yellow-800',
    pickup_scheduled: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    accepted_by_ngo: 'Awaiting Pickup',
    pickup_scheduled: 'Pickup Scheduled',
    in_transit: 'In Transit',
    delivered: 'Delivered',
  };

  const label = type === 'donation' && statusLabels[status] ? statusLabels[status] : status?.replace('_', ' ');

  return (
    <Badge className={`${statusStyles[status] || 'bg-gray-100 text-gray-800'} capitalize`}>
      {label || 'Unknown'}
    </Badge>
  );
};

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]); // Combined requests + donations
  const [loading, setLoading] = useState(true);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [matchData, setMatchData] = useState({});
  const [updating, setUpdating] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: '',
    beneficiariesHelped: '',
    impactStory: ''
  });
  const hasFetchedRef = useRef(false);
  const [stats, setStats] = useState({
    pending: 0,
    fulfilled: 0,
    totalItemsReceived: 0,
    totalRequests: 0,
    awaitingPickup: 0,
    inTransit: 0,
  });

  const calculateStats = (items) => {
    if (!items) return;
    const pending = items.filter(i => ['active', 'matched'].includes(i.status)).length;
    const fulfilled = items.filter(i => ['fulfilled'].includes(i.status)).length;
    const awaitingPickup = items.filter(i => ['accepted_by_ngo', 'pickup_scheduled'].includes(i.status)).length;
    const inTransit = items.filter(i => ['in_transit'].includes(i.status)).length;
    const totalItemsReceived = items.filter(i => ['fulfilled', 'delivered'].includes(i.status)).reduce((sum, i) => sum + i.quantity, 0);

    setStats({
      pending,
      fulfilled,
      totalItemsReceived,
      totalRequests: items.length,
      awaitingPickup,
      inTransit,
    });
  };

  const loadMatchesForRequest = async (requestId) => {
    try {
      const response = await matchingService.getMatchesForRequest(requestId);
      
      if (response && response.matches) {
        const count = response.matches.length;
        setMatchData(prev => ({
          ...prev,
          [requestId]: {
            matches: response.matches,
            count: count,
            loaded: true
          }
        }));
      } else {
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

  // ✅ Fetch both requests AND accepted donations
  useEffect(() => {
    if (hasFetchedRef.current || !user) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      try {
        const userId = (user._id || user.id).toString();
        console.log('🔍 Fetching data for user:', userId);

        // Fetch requests
        const requestsResponse = await requestService.getMyRequests(user._id);
        
        // Fetch accepted donations
        const donationsResponse = await api.get('/donations', {
          params: {
            page: 1,
            limit: 100,
          }
        });

        let allItems = [];

        // Add requests
        if (requestsResponse.success) {
          const requestList = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
          allItems = requestList.map(req => ({ ...req, type: 'request' }));
          
          console.log(`✅ Loaded ${requestList.length} requests`);
          
          // Load matches for requests
          requestList.forEach(request => {
            loadMatchesForRequest(request._id);
          });
        }

        // Add accepted donations (filter by acceptedBy)
        if (donationsResponse.success) {
          const acceptedDonations = donationsResponse.data.filter(donation => {
            const acceptedById = donation.acceptedBy?._id?.toString() || 
                                 donation.acceptedBy?.id?.toString() || 
                                 donation.acceptedBy?.toString();
            
            // Only show donations in these statuses
            const relevantStatuses = ['accepted_by_ngo', 'pickup_scheduled', 'in_transit', 'delivered'];
            const isRelevant = relevantStatuses.includes(donation.status);
            
            return acceptedById === userId && isRelevant;
          });
          
          console.log(`✅ Found ${acceptedDonations.length} accepted donations`);
          allItems = [...allItems, ...acceptedDonations.map(don => ({ ...don, type: 'donation' }))];
        }

        // Sort by date (newest first)
        allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log(`📋 Total items: ${allItems.length}`);
        setItems(allItems);
        calculateStats(allItems);
      } catch (error) {
        console.error('Fetch data error:', error);
        toast.error('Failed to fetch items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ✅ Handle donation status updates (Start Transit / Mark Delivered)
  const handleUpdateDonationStatus = async (donationId, newStatus) => {
    try {
      setUpdating(true);
      const response = await api.put(`/donations/${donationId}/update-status`, {
        status: newStatus
      });

      if (response.success) {
        toast.success(`Donation marked as ${newStatus.replace('_', ' ')}`);
        
        // Update local state
        setItems(items.map(item => 
          item._id === donationId ? { ...item, status: newStatus } : item
        ));
        calculateStats(items);

        // If delivered, prompt for feedback
        if (newStatus === 'delivered') {
          const donation = items.find(i => i._id === donationId);
          setSelectedDonation(donation);
          setTimeout(() => {
            setShowFeedbackModal(true);
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Update status error:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Submit feedback for delivered donation
  const handleSubmitFeedback = async () => {
    if (!feedbackForm.rating) {
      toast.error('Please provide a rating');
      return;
    }

    try {
      setUpdating(true);
      const response = await api.put(`/donations/${selectedDonation._id}/feedback`, feedbackForm);

      if (response.success) {
        toast.success('✅ Feedback submitted! Admin will review and complete the donation.');
        setShowFeedbackModal(false);
        
        // Update local state
        setItems(items.map(item => 
          item._id === selectedDonation._id 
            ? { ...item, completion: { feedback: feedbackForm } } 
            : item
        ));

        setSelectedDonation(null);
        setFeedbackForm({
          rating: 5,
          comment: '',
          beneficiariesHelped: '',
          impactStory: ''
        });
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
        return;
    }

    try {
        await requestService.deleteRequest(requestId);
        toast.success('Request deleted successfully');
        setItems(prev => prev.filter(i => i._id !== requestId));
        calculateStats(items.filter(i => i._id !== requestId));
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
            <h1 className="text-3xl font-bold text-gray-900">My Requests & Accepted Donations</h1>
            <p className="text-gray-600 mt-1">Track and manage all your requests and accepted donations</p>
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
              <CardTitle className="text-sm font-medium">Awaiting Pickup</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.awaitingPickup}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.inTransit}</div>
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
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {items.length > 0 ? (
            items.map(item => {
              const isRequest = item.type === 'request';
              const isDonation = item.type === 'donation';
              const requestMatchData = isRequest ? (matchData[item._id] || { matches: [], count: 0, loaded: false }) : null;
              const hasMatches = isRequest && requestMatchData && requestMatchData.count > 0;
              const isExpanded = expandedRequests[item._id];
              const matchCount = isRequest ? requestMatchData?.count : 0;

              return (
                <Card key={item._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Main Item Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isDonation && <Badge className="bg-purple-100 text-purple-800">🎁 Donation</Badge>}
                              <h3 className="text-lg font-bold text-gray-900 hover:text-blue-700">
                                {isRequest ? (
                                  <Link to={`/requests/${item._id}`}>{item.title || 'Untitled Request'}</Link>
                                ) : (
                                  <span>{item.title}</span>
                                )}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={item.status} type={item.type} />
                              {isRequest && !requestMatchData?.loaded && (
                                <Badge className="bg-gray-100 text-gray-600">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Checking...
                                </Badge>
                              )}
                              {isRequest && requestMatchData?.loaded && hasMatches && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">{item.category}</Badge>
                            {item.subcategory && <Badge variant="outline">{item.subcategory}</Badge>}
                            {item.urgency === 'high' && <Badge className="bg-red-100 text-red-800">High Urgency</Badge>}
                            <Badge variant="outline">{item.quantity} items</Badge>
                            {isDonation && item.donor && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Donor: {item.donor.name}
                              </Badge>
                            )}
                          </div>

                          {/* ✅ Pickup Schedule for Donations */}
                          {isDonation && item.pickupSchedule && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border-l-4 border-blue-500">
                              <Calendar className="h-4 w-4" />
                              <strong>Scheduled Pickup:</strong> {new Date(item.pickupSchedule.date).toLocaleDateString('en-IN')} at {item.pickupSchedule.time}
                            </div>
                          )}

                          {/* ✅ Awaiting Pickup Message */}
                          {isDonation && item.status === 'accepted_by_ngo' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg border-l-4 border-yellow-500">
                              <Clock className="h-4 w-4" />
                              <strong>Awaiting donor to schedule pickup time</strong>
                            </div>
                          )}
                        </div>
                        
                        {/* ✅ Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {isRequest && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/requests/${item._id}`)}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => toast.info('Edit feature coming soon!')}>
                                <Edit className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(item._id)}>
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                            </>
                          )}

                          {/* ✅ DONATION ACTION BUTTONS */}
                          {isDonation && (
                            <>
                              {/* Start Transit Button (when pickup is scheduled) */}
                              {item.status === 'pickup_scheduled' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateDonationStatus(item._id, 'in_transit')}
                                  disabled={updating}
                                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                                >
                                  <Truck className="h-3 w-3" />
                                  {updating ? 'Processing...' : 'Start Transit'}
                                </Button>
                              )}

                              {/* Mark Delivered Button (when in transit) */}
                              {item.status === 'in_transit' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateDonationStatus(item._id, 'delivered')}
                                  disabled={updating}
                                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  {updating ? 'Processing...' : 'Mark Delivered'}
                                </Button>
                              )}

                              {/* Submit Feedback Button (when delivered but no feedback) */}
                              {item.status === 'delivered' && !item.completion?.feedback && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDonation(item);
                                    setShowFeedbackModal(true);
                                  }}
                                  disabled={updating}
                                  className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
                                >
                                  <Star className="h-3 w-3" />
                                  Submit Feedback
                                </Button>
                              )}

                              {/* Feedback Submitted Badge */}
                              {item.completion?.feedback && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Feedback Submitted
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* AI Matches Toggle - Only for requests with matches */}
                      {isRequest && requestMatchData?.loaded && hasMatches && (
                        <div className="border-t pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center justify-between text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => toggleMatches(item._id)}
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
                      {isRequest ? 'Requested' : 'Accepted'} on: {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : 'Date not available'}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Items Found</h3>
              <p className="text-gray-500 mt-1">
                You haven't created any requests or accepted any donations yet.
              </p>
              <Button onClick={() => navigate('/recipient/create-request')} className="mt-4">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Feedback Modal */}
      {showFeedbackModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6" />
                Submit Feedback for "{selectedDonation.title}"
              </h2>
              <p className="text-yellow-100 mt-1">Share your experience and the impact this donation made</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmitFeedback(); }} className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rating * <span className="text-red-500">(Required)</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star className={`h-10 w-10 ${star <= feedbackForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-2xl font-bold text-yellow-500">{feedbackForm.rating}/5</span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Comments</label>
                <textarea
                  placeholder="Share your experience with this donation..."
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                ></textarea>
              </div>

              {/* Beneficiaries */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How many people benefited from this donation?
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Number of beneficiaries"
                  value={feedbackForm.beneficiariesHelped}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, beneficiariesHelped: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Impact Story */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Impact Story <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  placeholder="Tell us about the positive impact this donation had on your community..."
                  value={feedbackForm.impactStory}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, impactStory: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedDonation(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updating || !feedbackForm.rating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
