import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Truck, MapPin, Calendar, CheckCircle, Package, Clock, ArrowRight, Star, User, Phone, Home, Eye } from 'lucide-react';
import { donationService, requestService } from '../../services';
import { toast } from 'sonner';
import api from '../../lib/api';

const LogisticsDashboard = () => {
  const [pickups, setPickups] = useState([]);
  const [transitItems, setTransitItems] = useState([]);
  const [pendingReview, setPendingReview] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback review modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    setLoading(true);
    try {
      // 1. Get donations scheduled for pickup (READ-ONLY)
      const scheduledRes = await api.get('/donations', {
        params: { status: 'pickup_scheduled', limit: 100 }
      });
      if (scheduledRes.success) setPickups(scheduledRes.data || []);

      // 2. Get donations currently in transit (READ-ONLY)
      const transitRes = await api.get('/donations', {
        params: { status: 'in_transit', limit: 100 }
      });
      if (transitRes.success) setTransitItems(transitRes.data || []);

      // 3. Get DONATIONS with feedback awaiting review
      const deliveredRes = await api.get('/donations', {
        params: { status: 'delivered', limit: 100 }
      });
      
      let reviewItems = [];
      
      if (deliveredRes.success && deliveredRes.data) {
        let allDelivered = Array.isArray(deliveredRes.data) ? deliveredRes.data : [];
        
        const donationsWithFeedback = allDelivered.filter(d => 
          !!(d.completion?.feedback?.rating)
        );
        
        reviewItems = donationsWithFeedback.map(d => ({ ...d, itemType: 'donation' }));
      }

      // 4. Get REQUESTS with feedback awaiting review
      const requestsRes = await api.get('/requests', {
        params: { status: 'delivered' }
      });
      
      if (requestsRes.success) {
        const requestsWithFeedback = (requestsRes.data || []).filter(r => 
          r.fulfillment?.feedback?.submittedAt && r.status !== 'fulfilled'
        );
        reviewItems = [...reviewItems, ...requestsWithFeedback.map(r => ({ ...r, itemType: 'request' }))];
      }

      setPendingReview(reviewItems);

    } catch (error) {
      console.error("❌ Failed to load logistics data", error);
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewFeedback = (item) => {
    setSelectedItem(item);
    setFeedbackModalOpen(true);
  };

  const handleCompleteItem = async () => {
    if (!selectedItem) return;

    try {
      setCompleting(true);
      
      let response;
      
      if (selectedItem.itemType === 'donation') {
        response = await api.put(`/donations/${selectedItem._id}/mark-completed`, {
          adminNotes: 'Reviewed and approved'
        });
      } else {
        response = await requestService.adminCompleteRequest(selectedItem._id);
      }
      
      if (response.success) {
        toast.success(`${selectedItem.itemType === 'donation' ? 'Donation' : 'Request'} marked as completed! Congratulations sent to donor.`);
        setFeedbackModalOpen(false);
        setSelectedItem(null);
        fetchLogisticsData();
      } else {
        toast.error(response.message || 'Failed to complete');
      }
    } catch (error) {
      console.error('Complete error:', error);
      toast.error('Failed to complete item');
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
          <h1 className="text-3xl font-bold text-gray-900">Logistics Overview</h1>
          <p className="text-gray-600 mt-1">Monitor donation pickups, deliveries, and review feedback (View Only)</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled Pickups</p>
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
                <p className="text-3xl font-bold text-purple-600">{pendingReview.length}</p>
              </div>
              <Star className="h-10 w-10 text-purple-100" />
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="pickups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="pickups">Scheduled Pickups ({pickups.length})</TabsTrigger>
            <TabsTrigger value="transit">In Transit ({transitItems.length})</TabsTrigger>
            <TabsTrigger value="feedback">Pending Review ({pendingReview.length})</TabsTrigger>
          </TabsList>

          {/* Tab 1: Pickups (VIEW ONLY) */}
          <TabsContent value="pickups">
            {pickups.length > 0 ? (
              pickups.map(item => (
                <Card key={item._id} className="mb-4">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center flex-1">
                      <div className="bg-blue-50 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.location?.address || item.location?.city}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">{item.quantity} items</Badge>
                        </div>
                        {item.pickupSchedule && (
                          <p className="text-xs text-gray-500 mt-1">
                            📅 Scheduled: {new Date(item.pickupSchedule.date).toLocaleDateString()} at {item.pickupSchedule.time}
                          </p>
                        )}
                        <p className="text-xs text-blue-600 mt-2">
                          👤 NGO: {item.acceptedBy?.organization?.name || item.acceptedBy?.name}
                        </p>
                      </div>
                    </div>
                    
                    {/* ✅ CHANGED: View Only Badge instead of Action Button */}
                    <Badge className="bg-blue-100 text-blue-700">
                      <Eye className="mr-1 h-3 w-3" />
                      Awaiting NGO Pickup
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No pickups scheduled.</p>
            )}
          </TabsContent>

          {/* Tab 2: In Transit (VIEW ONLY) */}
          <TabsContent value="transit">
            {transitItems.length > 0 ? (
              transitItems.map(item => (
                <Card key={item._id} className="mb-4 border-l-4 border-l-orange-500">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center flex-1">
                      <div className="bg-orange-50 p-3 rounded-full">
                        <Truck className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600">Destination: {item.location?.city}</p>
                        <p className="text-xs text-gray-400 mt-1">Picked up from: {item.donor?.name}</p>
                        <p className="text-xs text-orange-600 mt-2">
                          🚚 Handled by: {item.acceptedBy?.organization?.name || item.acceptedBy?.name}
                        </p>
                      </div>
                    </div>
                    
                    {/* ✅ CHANGED: View Only Badge instead of Action Button */}
                    <Badge className="bg-orange-100 text-orange-700">
                      <Eye className="mr-1 h-3 w-3" />
                      In Transit by NGO
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No items currently in transit.</p>
            )}
          </TabsContent>

          {/* Tab 3: Feedback Review (ADMIN CAN COMPLETE) */}
          <TabsContent value="feedback">
            {pendingReview.length > 0 ? (
              pendingReview.map(item => {
                const isDonation = item.itemType === 'donation';
                const feedback = isDonation ? item.completion?.feedback : item.fulfillment?.feedback;
                const recipientName = isDonation 
                  ? item.acceptedBy?.organization?.name || item.acceptedBy?.name 
                  : item.requester?.name;
                
                return (
                  <Card key={item._id} className="mb-4 border-l-4 border-l-purple-500">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-start flex-1">
                          <div className="bg-purple-50 p-3 rounded-full">
                            <Star className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{item.title}</h4>
                              <Badge className="bg-blue-100 text-blue-800">
                                {isDonation ? 'Donation' : 'Request'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{item.category}</Badge>
                              <Badge className="bg-purple-100 text-purple-800">
                                Feedback Submitted
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {isDonation ? 'Recipient' : 'Requester'}: <span className="font-medium">{recipientName}</span>
                                </span>
                              </div>
                              
                              {feedback && (
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  <span className="text-gray-600">
                                    Rating: <span className="font-medium">{feedback.rating}/5</span>
                                  </span>
                                </div>
                              )}

                              <div className="text-xs text-gray-400 pt-1">
                                Submitted: {new Date(feedback?.submittedAt || item.fulfillment?.feedback?.submittedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleReviewFeedback(item)}
                        >
                          Review & Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No feedback pending review.</p>
                <p className="text-sm text-gray-400">All items have been completed!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Review Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Feedback & Complete {selectedItem?.itemType === 'donation' ? 'Donation' : 'Request'}</DialogTitle>
            <DialogDescription>
              Review the feedback and mark as completed. The donor will receive a congratulatory notification.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {selectedItem.itemType === 'donation' ? 'Donation' : 'Request'} Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium">{selectedItem.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedItem.itemType === 'donation' ? 'Recipient (NGO)' : 'Requester'}
                      </p>
                      <p className="font-medium">
                        {selectedItem.itemType === 'donation' 
                          ? selectedItem.acceptedBy?.organization?.name || selectedItem.acceptedBy?.name
                          : selectedItem.requester?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium capitalize">{selectedItem.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(() => {
                const feedback = selectedItem.itemType === 'donation' 
                  ? selectedItem.completion?.feedback
                  : selectedItem.fulfillment?.feedback;
                const impact = selectedItem.itemType === 'donation'
                  ? { beneficiariesHelped: feedback?.beneficiariesHelped, impactStory: feedback?.impactStory }
                  : selectedItem.fulfillment?.impact;

                return feedback && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Feedback Submitted
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
                                i < feedback.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 font-semibold">{feedback.rating}/5</span>
                        </div>
                      </div>

                      {feedback.comment && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Comment</p>
                          <p className="bg-gray-50 p-3 rounded-lg text-gray-700">{feedback.comment}</p>
                        </div>
                      )}

                      {impact?.beneficiariesHelped && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Beneficiaries Helped</p>
                          <p className="font-medium">{impact.beneficiariesHelped} people</p>
                        </div>
                      )}

                      {impact?.impactStory && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Impact Story</p>
                          <p className="bg-gray-50 p-3 rounded-lg text-gray-700">{impact.impactStory}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteItem}
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
