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
  const [pendingReview, setPendingReview] = useState([]); // Both donations and requests
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
    // 1. Get donations scheduled for pickup
    const scheduledRes = await api.get('/donations', {
      params: { status: 'pickup_scheduled', limit: 100 }
    });
    if (scheduledRes.success) setPickups(scheduledRes.data || []);

    // 2. Get donations currently in transit
    const transitRes = await api.get('/donations', {
      params: { status: 'in_transit', limit: 100 }
    });
    if (transitRes.success) setTransitItems(transitRes.data || []);

    // 3. Get DONATIONS with feedback awaiting review
    console.log('🔍 Fetching delivered donations...');
    const deliveredRes = await api.get('/donations', {
      params: { status: 'delivered', limit: 100 }
    });
    
    console.log('📦 Full delivered response:', deliveredRes);
    console.log('📦 Response data:', deliveredRes.data);
    console.log('📦 Response data type:', typeof deliveredRes.data);
    console.log('📦 Is array?', Array.isArray(deliveredRes.data));
    
    let reviewItems = [];
    
    if (deliveredRes.success && deliveredRes.data) {
      // Handle different response structures
      let allDelivered = [];
      
      if (Array.isArray(deliveredRes.data)) {
        allDelivered = deliveredRes.data;
      } else if (deliveredRes.data.donations && Array.isArray(deliveredRes.data.donations)) {
        allDelivered = deliveredRes.data.donations;
      } else if (deliveredRes.data.data && Array.isArray(deliveredRes.data.data)) {
        allDelivered = deliveredRes.data.data;
      }
      
      console.log(`📊 Total delivered donations: ${allDelivered.length}`);
      console.log('📊 All delivered donations:', allDelivered);
      
      // Check each donation
      allDelivered.forEach((d, idx) => {
        console.log(`\n[${idx}] Donation: ${d.title} (ID: ${d._id})`);
        console.log('   Status:', d.status);
        console.log('   Has completion?', !!d.completion);
        console.log('   Completion object:', d.completion);
        console.log('   Has completion.feedback?', !!(d.completion?.feedback));
        console.log('   Completion.feedback:', d.completion?.feedback);
        console.log('   Rating:', d.completion?.feedback?.rating);
      });
      
      const donationsWithFeedback = allDelivered.filter(d => {
        const hasFeedback = !!(d.completion?.feedback?.rating);
        console.log(`✓ ${d.title}: Has feedback? ${hasFeedback}`);
        return hasFeedback;
      });
      
      console.log(`⭐ Donations with feedback: ${donationsWithFeedback.length}`);
      console.log('⭐ Donations list:', donationsWithFeedback);
      
      reviewItems = donationsWithFeedback.map(d => ({ ...d, itemType: 'donation' }));
    } else {
      console.log('❌ No delivered donations or failed response');
    }

    // 4. Get REQUESTS with feedback awaiting review
    const requestsRes = await api.get('/requests', {
      params: { status: 'delivered' }
    });
    
    console.log('📋 Requests response:', requestsRes);
    
    if (requestsRes.success) {
      const requestsWithFeedback = (requestsRes.data || []).filter(r => 
        r.fulfillment?.feedback?.submittedAt && r.status !== 'fulfilled'
      );
      console.log(`📋 Requests with feedback: ${requestsWithFeedback.length}`);
      reviewItems = [...reviewItems, ...requestsWithFeedback.map(r => ({ ...r, itemType: 'request' }))];
    }

    console.log(`\n✅ FINAL: Total items pending review: ${reviewItems.length}`);
    console.log('✅ Final review items:', reviewItems);
    
    setPendingReview(reviewItems);

  } catch (error) {
    console.error("❌ Failed to load logistics data", error);
    toast.error("Failed to load logistics data");
  } finally {
    setLoading(false);
  }
};

  const handleStatusUpdate = async (donationId, nextStatus) => {
    try {
      const response = await api.put(`/donations/${donationId}/update-status`, {
        status: nextStatus,
        notes: `Status updated to ${nextStatus} by Admin`
      });

      if (response.success) {
        toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`);
        fetchLogisticsData();
      }
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update status");
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
        // Complete donation
        response = await api.put(`/donations/${selectedItem._id}/mark-completed`, {
          adminNotes: 'Reviewed and approved'
        });
      } else {
        // Complete request
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
          <h1 className="text-3xl font-bold text-gray-900">Logistics Management</h1>
          <p className="text-gray-600 mt-1">Manage donation pickups, deliveries, and feedback reviews.</p>
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
                <p className="text-3xl font-bold text-purple-600">{pendingReview.length}</p>
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
            <TabsTrigger value="feedback">Pending Review ({pendingReview.length})</TabsTrigger>
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
            {pendingReview.length > 0 ? (
              pendingReview.map(item => {
                const isDonation = item.itemType === 'donation';
                const feedback = isDonation ? item.feedback : item.fulfillment?.feedback;
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
                              
                              {(feedback?.beneficiariesHelped || item.fulfillment?.impact?.beneficiariesHelped) && (
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    Helped: <span className="font-medium">
                                      {feedback?.beneficiariesHelped || item.fulfillment?.impact?.beneficiariesHelped} people
                                    </span>
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
              {/* Item Info */}
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


              {/* Feedback */}
              {(() => {
                const feedback = selectedItem.itemType === 'donation' 
                  ? selectedItem.feedback 
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
                          <span className="ml-2 font-semibold">
                            {feedback.rating}/5
                          </span>
                        </div>
                      </div>

                      {feedback.comment && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Comment</p>
                          <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                            {feedback.comment}
                          </p>
                        </div>
                      )}

                      {impact?.beneficiariesHelped && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Beneficiaries Helped</p>
                          <p className="font-medium">
                            {impact.beneficiariesHelped} people
                          </p>
                        </div>
                      )}

                      {impact?.impactStory && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Impact Story</p>
                          <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                            {impact.impactStory}
                          </p>
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
