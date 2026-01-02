import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { requestService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { 
  Package, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Phone,
  Truck,
  Home,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const DonationRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [logisticsModalOpen, setLogisticsModalOpen] = useState(false);
  
  // Selected request
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Form data
  const [acceptNote, setAcceptNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Logistics form
  const [logisticsForm, setLogisticsForm] = useState({
    method: 'pickup',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contactPerson: user?.name || '',
    contactPhone: user?.contact?.phone || '',
    preferredDate: '',
    preferredTimeSlot: '',
    specialInstructions: ''
  });

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await requestService.getPendingRequestsForDonor();
      
      if (response.success) {
        setRequests(response.data.requests || []);
      } else {
        toast.error(response.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast.error('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setSubmitting(true);
      const response = await requestService.acceptRequest(selectedRequest._id, acceptNote);
      
      if (response.success) {
        toast.success('Request accepted! Please provide pickup/delivery details.');
        setAcceptModalOpen(false);
        setAcceptNote('');
        
        // Open logistics modal
        setSelectedRequest(response.data.request);
        setLogisticsModalOpen(true);
        
        // Remove from pending list
        setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
      } else {
        toast.error(response.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Accept request error:', error);
      toast.error(error.message || 'Failed to accept request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await requestService.rejectRequest(selectedRequest._id, rejectReason);
      
      if (response.success) {
        toast.success('Request rejected');
        setRejectModalOpen(false);
        setRejectReason('');
        setSelectedRequest(null);
        
        // Remove from pending list
        setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
      } else {
        toast.error(response.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Reject request error:', error);
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProvideLogistics = async () => {
    if (!selectedRequest) return;
    
    // Validation
    if (!logisticsForm.address || !logisticsForm.city || !logisticsForm.contactPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await requestService.provideLogistics(selectedRequest._id, logisticsForm);
      
      if (response.success) {
        toast.success(`${logisticsForm.method === 'pickup' ? 'Pickup' : 'Delivery'} details provided successfully!`);
        setLogisticsModalOpen(false);
        setSelectedRequest(null);
        
        // Reset form
        setLogisticsForm({
          method: 'pickup',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          contactPerson: user?.name || '',
          contactPhone: user?.contact?.phone || '',
          preferredDate: '',
          preferredTimeSlot: '',
          specialInstructions: ''
        });
      } else {
        toast.error(response.message || 'Failed to provide logistics details');
      }
    } catch (error) {
      console.error('Provide logistics error:', error);
      toast.error(error.message || 'Failed to provide logistics details');
    } finally {
      setSubmitting(false);
    }
  };

  const openAcceptModal = (request) => {
    setSelectedRequest(request);
    setAcceptModalOpen(true);
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donation Requests</h1>
          <p className="text-gray-600 mt-1">
            Recipients have requested the following donations. Review and respond to each request.
          </p>
        </div>

        {/* Stats Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-3xl font-bold text-blue-600">{requests.length}</p>
              </div>
              <Package className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length > 0 ? (
            requests.map(request => (
              <Card key={request._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Request Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>For: {request.donation?.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      </div>

                      <p className="text-gray-700 mb-4">{request.description}</p>

                      {/* Requester Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Requested by:</p>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.requester?.name}</p>
                            {request.requester?.organization?.name && (
                              <p className="text-sm text-gray-600">{request.requester.organization.name}</p>
                            )}
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span>{request.requester?.location?.city}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Request Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Quantity Needed</p>
                          <p className="font-semibold text-gray-900">{request.quantity} items</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Category</p>
                          <p className="font-semibold text-gray-900 capitalize">{request.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Urgency</p>
                          <Badge className={
                            request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                            request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {request.urgency}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Beneficiaries</p>
                          <p className="font-semibold text-gray-900">{request.beneficiaries?.count || 0} people</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => openAcceptModal(request)}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="accept-request-btn"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Request
                      </Button>
                      <Button
                        onClick={() => openRejectModal(request)}
                        variant="destructive"
                        className="w-full"
                        data-testid="reject-request-btn"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-500">
                  You don't have any pending requests at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Accept Modal */}
      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Request</DialogTitle>
            <DialogDescription>
              You're about to accept this donation request. You'll need to provide pickup or delivery details next.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Add a note (optional)</Label>
              <Textarea
                placeholder="Add any message for the recipient..."
                value={acceptNote}
                onChange={(e) => setAcceptNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAcceptRequest}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason for declining *</Label>
              <Textarea
                placeholder="Explain why you're declining this request..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectRequest}
              disabled={submitting || !rejectReason.trim()}
              variant="destructive"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logistics Modal */}
      <Dialog open={logisticsModalOpen} onOpenChange={setLogisticsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provide Pickup/Delivery Details</DialogTitle>
            <DialogDescription>
              Please provide the necessary information for the recipient to collect the donation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Method Selection */}
            <div>
              <Label>How will the donation be transferred? *</Label>
              <Select
                value={logisticsForm.method}
                onValueChange={(value) => setLogisticsForm(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Recipient will pickup from my address</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>I will deliver to recipient's address</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address Details */}
            <div>
              <Label>
                {logisticsForm.method === 'pickup' ? 'Pickup Address *' : 'Your Address *'}
              </Label>
              <Input
                placeholder="Street address"
                value={logisticsForm.address}
                onChange={(e) => setLogisticsForm(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  placeholder="City"
                  value={logisticsForm.city}
                  onChange={(e) => setLogisticsForm(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  placeholder="State"
                  value={logisticsForm.state}
                  onChange={(e) => setLogisticsForm(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>ZIP Code</Label>
              <Input
                placeholder="ZIP Code"
                value={logisticsForm.zipCode}
                onChange={(e) => setLogisticsForm(prev => ({ ...prev, zipCode: e.target.value }))}
              />
            </div>

            {/* Contact Details */}
            <div>
              <Label>Contact Person</Label>
              <Input
                placeholder="Contact person name"
                value={logisticsForm.contactPerson}
                onChange={(e) => setLogisticsForm(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>

            <div>
              <Label>Contact Phone *</Label>
              <Input
                placeholder="Phone number"
                value={logisticsForm.contactPhone}
                onChange={(e) => setLogisticsForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                required
              />
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preferred Date</Label>
                <Input
                  type="date"
                  value={logisticsForm.preferredDate}
                  onChange={(e) => setLogisticsForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Preferred Time Slot</Label>
                <Select
                  value={logisticsForm.preferredTimeSlot}
                  onValueChange={(value) => setLogisticsForm(prev => ({ ...prev, preferredTimeSlot: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM - 3 PM)</SelectItem>
                    <SelectItem value="evening">Evening (3 PM - 6 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <Label>Special Instructions</Label>
              <Textarea
                placeholder="Any special instructions for pickup/delivery..."
                value={logisticsForm.specialInstructions}
                onChange={(e) => setLogisticsForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogisticsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProvideLogistics}
              disabled={submitting || !logisticsForm.address || !logisticsForm.city || !logisticsForm.contactPhone}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonationRequests;
