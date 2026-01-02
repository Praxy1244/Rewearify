import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { requestService } from '../../services';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  MapPin, 
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  MessageSquare,
  Phone,
  Home,
  Star,
  Upload,
  Loader2,
  XCircle,
  TrendingUp
} from 'lucide-react';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: '',
    beneficiariesHelped: '',
    impactStory: ''
  });

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await requestService.getRequest(id);
      
      if (response.success) {
        setRequest(response.data.request);
      } else {
        toast.error('Failed to load request details');
      }
    } catch (error) {
      console.error('Error loading request details:', error);
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this request as "${newStatus.replace('_', ' ')}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      const response = await requestService.updateRequestStatus(request._id, newStatus);
      
      if (response.success) {
        toast.success(`Request marked as ${newStatus.replace('_', ' ')}`);
        setRequest(response.data.request);
        
        // If marked as delivered, prompt for feedback
        if (newStatus === 'delivered') {
          setTimeout(() => {
            setFeedbackModalOpen(true);
          }, 1000);
        }
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.rating) {
      toast.error('Please provide a rating');
      return;
    }

    try {
      setUpdating(true);
      const response = await requestService.submitFeedback(request._id, feedbackForm);
      
      if (response.success) {
        toast.success('Feedback submitted successfully! Admin will review and complete the request.');
        setFeedbackModalOpen(false);
        setRequest(response.data.request);
      } else {
        toast.error(response.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Submit feedback error:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'active': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending_donor': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accepted': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'pickup_scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
      'in_transit': 'bg-orange-100 text-orange-800 border-orange-200',
      'delivered': 'bg-teal-100 text-teal-800 border-teal-200',
      'fulfilled': 'bg-green-100 text-green-800 border-green-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'active': <Clock className="h-5 w-5 text-blue-600" />,
      'pending_donor': <Clock className="h-5 w-5 text-yellow-600" />,
      'accepted': <CheckCircle className="h-5 w-5 text-green-600" />,
      'rejected': <XCircle className="h-5 w-5 text-red-600" />,
      'pickup_scheduled': <Calendar className="h-5 w-5 text-purple-600" />,
      'in_transit': <Truck className="h-5 w-5 text-orange-600" />,
      'delivered': <Package className="h-5 w-5 text-teal-600" />,
      'fulfilled': <CheckCircle className="h-5 w-5 text-green-600" />
    };
    return icons[status] || <Clock className="h-5 w-5 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <span className="ml-2">Loading request details...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-gray-600 mb-6">
              The request you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/recipient/my-requests')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/recipient/my-requests')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Requests
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
              <p className="text-gray-600 mt-1">
                Request ID: {request._id?.slice(-8)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusIcon(request.status)}
              <Badge className={`text-lg px-4 py-2 ${getStatusColor(request.status)}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Donor Response Status */}
            {request.donorResponse && request.donation && (
              <Card className={
                request.donorResponse.status === 'accepted' ? 'border-green-200 bg-green-50' :
                request.donorResponse.status === 'rejected' ? 'border-red-200 bg-red-50' :
                'border-yellow-200 bg-yellow-50'
              }>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {request.donorResponse.status === 'accepted' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {request.donorResponse.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                      {request.donorResponse.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                      Donor Response
                    </span>
                    <Badge className={
                      request.donorResponse.status === 'accepted' ? 'bg-green-600 text-white' :
                      request.donorResponse.status === 'rejected' ? 'bg-red-600 text-white' :
                      'bg-yellow-600 text-white'
                    }>
                      {request.donorResponse.status.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {request.donorResponse.status === 'pending' && (
                    <p className="text-gray-700">Waiting for donor to respond to your request...</p>
                  )}
                  {request.donorResponse.status === 'accepted' && (
                    <div className="space-y-2">
                      <p className="text-green-700 font-medium">✅ Donor accepted your request!</p>
                      {request.donorResponse.acceptanceNote && (
                        <p className="text-gray-700 bg-white p-3 rounded-lg">{request.donorResponse.acceptanceNote}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Responded on: {new Date(request.donorResponse.respondedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {request.donorResponse.status === 'rejected' && (
                    <div className="space-y-2">
                      <p className="text-red-700 font-medium">❌ Donor declined your request</p>
                      {request.donorResponse.rejectionReason && (
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                          <p className="text-gray-700">{request.donorResponse.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pickup/Delivery Details */}
            {request.pickupDelivery && request.pickupDelivery.method && (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {request.pickupDelivery.method === 'pickup' ? (
                      <Home className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Truck className="h-5 w-5 text-purple-600" />
                    )}
                    {request.pickupDelivery.method === 'pickup' ? 'Pickup Details' : 'Delivery Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Method</Label>
                      <p className="font-medium capitalize">{request.pickupDelivery.method}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Address</Label>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <p className="font-medium">{request.pickupDelivery.address}</p>
                          <p className="text-sm text-gray-600">
                            {request.pickupDelivery.city}{request.pickupDelivery.state && `, ${request.pickupDelivery.state}`}
                            {request.pickupDelivery.zipCode && ` - ${request.pickupDelivery.zipCode}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Contact Person</Label>
                        <p className="font-medium">{request.pickupDelivery.contactPerson || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Contact Phone</Label>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="font-medium">{request.pickupDelivery.contactPhone}</p>
                        </div>
                      </div>
                    </div>

                    {request.pickupDelivery.preferredDate && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Preferred Date</Label>
                          <p className="font-medium">
                            {new Date(request.pickupDelivery.preferredDate).toLocaleDateString()}
                          </p>
                        </div>
                        {request.pickupDelivery.preferredTimeSlot && (
                          <div>
                            <Label className="text-sm text-gray-600">Time Slot</Label>
                            <p className="font-medium capitalize">{request.pickupDelivery.preferredTimeSlot}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {request.pickupDelivery.specialInstructions && (
                      <div>
                        <Label className="text-sm text-gray-600">Special Instructions</Label>
                        <p className="text-sm text-gray-700 bg-white p-2 rounded">
                          {request.pickupDelivery.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Update Actions */}
            {request.status === 'pickup_scheduled' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">Ready to update status?</h3>
                      <p className="text-sm text-gray-600">Mark the donation as in transit once pickup is confirmed</p>
                    </div>
                    <Button
                      onClick={() => handleUpdateStatus('in_transit')}
                      disabled={updating}
                      className="bg-orange-600 hover:bg-orange-700"
                      data-testid="mark-in-transit-btn"
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                      Mark In Transit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {request.status === 'in_transit' && (
              <Card className="border-teal-200 bg-teal-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">Delivery confirmation</h3>
                      <p className="text-sm text-gray-600">Mark as delivered once you receive the donation</p>
                    </div>
                    <Button
                      onClick={() => handleUpdateStatus('delivered')}
                      disabled={updating}
                      className="bg-teal-600 hover:bg-teal-700"
                      data-testid="mark-delivered-btn"
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Mark Delivered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback Display (if already submitted) */}
            {request.fulfillment?.feedback?.submittedAt && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Your Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Rating</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < request.fulfillment.feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 font-semibold">{request.fulfillment.feedback.rating}/5</span>
                    </div>
                  </div>
                  
                  {request.fulfillment.feedback.comment && (
                    <div>
                      <Label className="text-sm text-gray-600">Comment</Label>
                      <p className="text-gray-700 bg-white p-3 rounded-lg mt-1">
                        {request.fulfillment.feedback.comment}
                      </p>
                    </div>
                  )}

                  {request.fulfillment.impact?.beneficiariesHelped && (
                    <div>
                      <Label className="text-sm text-gray-600">Beneficiaries Helped</Label>
                      <p className="font-medium">{request.fulfillment.impact.beneficiariesHelped} people</p>
                    </div>
                  )}

                  {request.fulfillment.impact?.impactStory && (
                    <div>
                      <Label className="text-sm text-gray-600">Impact Story</Label>
                      <p className="text-gray-700 bg-white p-3 rounded-lg mt-1">
                        {request.fulfillment.impact.impactStory}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 pt-2 border-t">
                    Submitted on: {new Date(request.fulfillment.feedback.submittedAt).toLocaleString()}
                  </p>
                  
                  {request.status !== 'fulfilled' && (
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                      ⏳ Waiting for admin to review and mark as complete
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Request Information */}
            <Card>
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Title</Label>
                  <p className="font-medium text-lg">{request.title}</p>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{request.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Request Date</Label>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-600">Category</Label>
                    <p className="font-medium capitalize">{request.category}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Quantity</Label>
                    <p className="font-medium">{request.quantity} items</p>
                  </div>
                  
                  {request.urgency && (
                    <div>
                      <Label className="text-sm text-gray-600">Priority Level</Label>
                      <div className="mt-1">
                        <Badge className={
                          request.urgency === 'high' || request.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {request.urgency.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {request.beneficiaries?.count && (
                    <div>
                      <Label className="text-sm text-gray-600">Beneficiaries</Label>
                      <p className="font-medium">{request.beneficiaries.count} people</p>
                    </div>
                  )}
                </div>

                {request.location && (
                  <div>
                    <Label className="text-sm text-gray-600">Location</Label>
                    <div className="flex items-start mt-1">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                      <span className="font-medium">
                        {request.location.city}, {request.location.state}, {request.location.country}
                      </span>
                    </div>
                  </div>
                )}

                {request.timeline?.neededBy && (
                  <div>
                    <Label className="text-sm text-gray-600">Needed By</Label>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">
                        {new Date(request.timeline.neededBy).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Request Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Request Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {request.donorResponse?.respondedAt && (
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        request.donorResponse.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {request.donorResponse.status === 'accepted' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Donor {request.donorResponse.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.donorResponse.respondedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.status === 'pickup_scheduled' && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Pickup Scheduled</p>
                        <p className="text-xs text-gray-500">Logistics details provided</p>
                      </div>
                    </div>
                  )}

                  {(request.status === 'in_transit' || request.status === 'delivered' || request.status === 'fulfilled') && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Truck className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">In Transit</p>
                        <p className="text-xs text-gray-500">Donation on its way</p>
                      </div>
                    </div>
                  )}

                  {(request.status === 'delivered' || request.status === 'fulfilled') && request.fulfillment?.deliveredAt && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-teal-100 p-2 rounded-full">
                        <Package className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Delivered</p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.fulfillment.deliveredAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.status === 'fulfilled' && request.fulfillment?.completedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Completed ✅</p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.fulfillment.completedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.status === 'delivered' && !request.fulfillment?.feedback?.submittedAt && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setFeedbackModalOpen(true)}
                    data-testid="submit-feedback-btn"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </Button>
                )}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/recipient/my-requests">
                    View All Requests
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/recipient/browseItems">
                    Browse More Items
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Donation Info */}
            {request.donation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>Donation Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Title:</span>
                      <p className="font-medium">{request.donation.title || 'N/A'}</p>
                    </div>
                    {request.donation.donor && (
                      <div>
                        <span className="text-sm text-gray-500">Donor:</span>
                        <p className="font-medium">{request.donation.donor.name || 'Anonymous'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
            <DialogDescription>
              Share your experience and the impact this donation made. This helps us improve and motivates donors!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Rating */}
            <div>
              <Label>Rating * (1-5 stars)</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        star <= feedbackForm.rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-lg font-semibold">{feedbackForm.rating}/5</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label>Your Comments</Label>
              <Textarea
                placeholder="Share your experience with this donation..."
                value={feedbackForm.comment}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Beneficiaries Helped */}
            <div>
              <Label>How many people benefited from this donation?</Label>
              <Input
                type="number"
                min="0"
                placeholder="Number of beneficiaries"
                value={feedbackForm.beneficiariesHelped}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, beneficiariesHelped: e.target.value }))}
              />
            </div>

            {/* Impact Story */}
            <div>
              <Label>Impact Story (Optional)</Label>
              <Textarea
                placeholder="Tell us about the positive impact this donation had..."
                value={feedbackForm.impactStory}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, impactStory: e.target.value }))}
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Share a story about how this donation helped your community
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={updating || !feedbackForm.rating}
              className="bg-green-600 hover:bg-green-700"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestDetail;
