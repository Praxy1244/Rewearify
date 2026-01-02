import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Truck, MapPin, Calendar, CheckCircle, Package, Clock, ArrowRight, Star, User, Phone, Home } from 'lucide-react';
import { donationService, requestService } from '../../services';
import { toast } from 'sonner';
import api from '../../lib/api';

const LogisticsDashboard = () => {
  const [pickups, setPickups] = useState([]);
  const [transitItems, setTransitItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback review modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    setLoading(true);
    try {
      // 1. Get items scheduled for pickup
      const scheduledRes = await donationService.getDonations({ status: 'pickup_scheduled' });
      if (scheduledRes.success) setPickups(scheduledRes.data);

      // 2. Get items currently in transit
      const transitRes = await donationService.getDonations({ status: 'in_transit' });
      if (transitRes.success) setTransitItems(transitRes.data);

      // 3. Get requests with feedback awaiting review
      const requestsRes = await api.get('/requests?status=delivered');
      if (requestsRes.success) {
        // Filter requests that have feedback submitted but not yet completed
        const pendingReview = requestsRes.data.filter(r => 
          r.fulfillment?.feedback?.submittedAt && r.status !== 'fulfilled'
        );
        setRequests(pendingReview);
      }

    } catch (error) {
      console.error("Failed to load logistics data", error);
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  };

  // Function to advance the status
  const handleStatusUpdate = async (donationId, nextStatus) => {
    try {
      // Using the transition endpoint to update status securely
      const response = await api.put(`/donations/${donationId}/transition`, {
        toState: nextStatus,
        metadata: {
          updatedAt: new Date().toISOString(),
          note: `Status updated to ${nextStatus} by Admin`
        }
      });

      if (response.success) {
        toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`);
        fetchLogisticsData(); // Refresh the lists to move the item
      }
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update status");
    }
  };

  const handleReviewFeedback = (request) => {
    setSelectedRequest(request);
    setFeedbackModalOpen(true);
  };

  const handleCompleteRequest = async () => {
    if (!selectedRequest) return;

    try {
      setCompleting(true);
      const response = await requestService.adminCompleteRequest(selectedRequest._id);
      
      if (response.success) {
        toast.success('Request marked as completed!');
        setFeedbackModalOpen(false);
        setSelectedRequest(null);
        fetchLogisticsData(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to complete request');
      }
    } catch (error) {
      console.error('Complete request error:', error);
      toast.error('Failed to complete request');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Logistics Management</h1>
          <p className="text-gray-600 mt-1">Manage donation pickups and deliveries.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Pickups</p>
                <p className="text-3xl font-bold text-blue-600">{pickups.length}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-100" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Transit</p>
                <p className="text-3xl font-bold text-orange-600">{transitItems.length}</p>
              </div>
              <Package className="h-10 w-10 text-orange-100" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-purple-600">{requests.length}</p>
              </div>
              <Star className="h-10 w-10 text-purple-100" />
            </CardContent>
          </Card>
        </div>

        {/* Main Management Tabs */}
        <Tabs defaultValue="pickups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="pickups">Scheduled Pickups ({pickups.length})</TabsTrigger>
            <TabsTrigger value="transit">In Transit ({transitItems.length})</TabsTrigger>
            <TabsTrigger value="feedback">Pending Review ({requests.length})</TabsTrigger>
          </TabsList>

          {/* Tab 1: Pickups */}
          <TabsContent value="pickups">
            {pickups.length > 0 ? (
              pickups.map(item => (
                <Card key={item._id} className="mb-4">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="bg-blue-50 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.location?.address}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">{item.quantity} items</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleStatusUpdate(item._id, 'in_transit')}
                    >
                      Start Transit <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No pickups scheduled.</p>
            )}
          </TabsContent>

          {/* Tab 2: In Transit */}
          <TabsContent value="transit">
            {transitItems.length > 0 ? (
              transitItems.map(item => (
                <Card key={item._id} className="mb-4 border-l-4 border-l-orange-500">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="bg-orange-50 p-3 rounded-full">
                        <Truck className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600">Destination: {item.location?.city}</p>
                        <p className="text-xs text-gray-400 mt-1">Picked up from: {item.donor?.name}</p>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusUpdate(item._id, 'delivered')}
                    >
                      Mark Delivered <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No items currently in transit.</p>
            )}
          </TabsContent>

          {/* Tab 3: Feedback Review */}
          <TabsContent value="feedback">
            {requests.length > 0 ? (
              requests.map(request => (
                <Card key={request._id} className="mb-4 border-l-4 border-l-purple-500">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 items-start flex-1">
                        <div className="bg-purple-50 p-3 rounded-full">
                          <Star className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{request.title}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{request.category}</Badge>
                            <Badge className="bg-purple-100 text-purple-800">
                              Feedback Submitted
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                Recipient: <span className="font-medium">{request.requester?.name}</span>
                              </span>
                            </div>
                            
                            {request.fulfillment?.feedback && (
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-gray-600">
                                  Rating: <span className="font-medium">{request.fulfillment.feedback.rating}/5</span>
                                </span>
                              </div>
                            )}
                            
                            {request.fulfillment?.impact?.beneficiariesHelped && (
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Helped: <span className="font-medium">{request.fulfillment.impact.beneficiariesHelped} people</span>
                                </span>
                              </div>
                            )}

                            <div className="text-xs text-gray-400 pt-1">
                              Submitted: {new Date(request.fulfillment?.feedback?.submittedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleReviewFeedback(request)}
                      >
                        Review & Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No feedback pending review.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Review Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Feedback & Complete Request</DialogTitle>
            <DialogDescription>
              Review the recipient's feedback and mark the request as completed if everything looks good.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Request Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium">{selectedRequest.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Recipient</p>
                      <p className="font-medium">{selectedRequest.requester?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium capitalize">{selectedRequest.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback */}
              {selectedRequest.fulfillment?.feedback && (
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Recipient Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Rating</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < selectedRequest.fulfillment.feedback.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-semibold">
                          {selectedRequest.fulfillment.feedback.rating}/5
                        </span>
                      </div>
                    </div>

                    {selectedRequest.fulfillment.feedback.comment && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Comment</p>
                        <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                          {selectedRequest.fulfillment.feedback.comment}
                        </p>
                      </div>
                    )}

                    {selectedRequest.fulfillment.impact?.beneficiariesHelped && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Beneficiaries Helped</p>
                        <p className="font-medium">
                          {selectedRequest.fulfillment.impact.beneficiariesHelped} people
                        </p>
                      </div>
                    )}

                    {selectedRequest.fulfillment.impact?.impactStory && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Impact Story</p>
                        <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                          {selectedRequest.fulfillment.impact.impactStory}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteRequest}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700"
            >
              {completing ? 'Completing...' : 'Mark as Completed'}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogisticsDashboard;