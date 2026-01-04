import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { requestService } from '../../services';
import api from '../../lib/api';
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
  const [acceptedDonations, setAcceptedDonations] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [logisticsModalOpen, setLogisticsModalOpen] = useState(false);
  const [schedulePickupModalOpen, setSchedulePickupModalOpen] = useState(false); // ✅ NEW
  
  // Selected request/donation
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null); // ✅ NEW
  
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

  // ✅ NEW: Pickup schedule form
  const [scheduleForm, setScheduleForm] = useState({
    pickupDate: '',
    pickupTime: '',
    specialInstructions: ''
  });


  useEffect(() => {
    fetchData();
  }, []);

  // ✅ UPDATED: Fetch both requests and accepted donations
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending requests
      const requestsResponse = await requestService.getPendingRequestsForDonor();
      if (requestsResponse.success) {
        setRequests(requestsResponse.data.requests || []);
      }

      // ✅ Fetch accepted donations (donations where NGO accepted but no pickup scheduled)
      const donationsResponse = await api.get(`/donations/user/${user._id || user.id}`, {
        params: { limit: 100 }
      });
      
      if (donationsResponse.success) {
        // Filter to show only accepted donations that need pickup scheduling
        const needsScheduling = donationsResponse.data.filter(d => 
          d.status === 'accepted_by_ngo' || d.status === 'pickup_scheduled' || d.status === 'in_transit'
        );
        setAcceptedDonations(needsScheduling);
        console.log(`✅ Found ${needsScheduling.length} accepted donations`);
      }
      
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = fetchData; // Alias for compatibility


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

  // ✅ NEW: Handle pickup scheduling
  const handleSchedulePickup = (donation) => {
    setSelectedDonation(donation);
    
    // Pre-fill if rescheduling
    if (donation.pickupSchedule) {
      setScheduleForm({
        pickupDate: donation.pickupSchedule.date || '',
        pickupTime: donation.pickupSchedule.time || '',
        specialInstructions: donation.pickupSchedule.instructions || ''
      });
    } else {
      setScheduleForm({
        pickupDate: '',
        pickupTime: '',
        specialInstructions: ''
      });
    }
    
    setSchedulePickupModalOpen(true);
  };

  // ✅ NEW: Submit pickup schedule
  const handleSubmitSchedule = async () => {
    if (!scheduleForm.pickupDate || !scheduleForm.pickupTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await api.put(`/donations/${selectedDonation._id}/schedule-pickup`, scheduleForm);

      if (response.success) {
        toast.success('Pickup scheduled successfully! NGO has been notified.');
        setSchedulePickupModalOpen(false);
        setSelectedDonation(null);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Schedule pickup error:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule pickup');
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
          <h1 className="text-3xl font-bold text-gray-900">Donation Requests & Accepted Donations</h1>
          <p className="text-gray-600 mt-1">
            Manage pending requests and schedule pickups for accepted donations
          </p>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accepted Donations</p>
                  <p className="text-3xl font-bold text-purple-600">{acceptedDonations.length}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ NEW: Accepted Donations Section */}
        {acceptedDonations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accepted Donations - Action Required</h2>
            <div className="space-y-4">
              {acceptedDonations.map(donation => (
                <Card key={donation._id} className="hover:shadow-lg transition-shadow border-l-4 border-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800">Accepted Donation</Badge>
                            <h3 className="text-xl font-bold text-gray-900">{donation.title}</h3>
                          </div>
                          <Badge className={
                            donation.status === 'accepted_by_ngo' ? 'bg-yellow-100 text-yellow-800' :
                            donation.status === 'pickup_scheduled' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {donation.status === 'accepted_by_ngo' ? 'Schedule Pickup' :
                             donation.status === 'pickup_scheduled' ? 'Pickup Scheduled' :
                             'In Transit'}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-3">{donation.description}</p>

                        {/* NGO Info */}
                        {donation.acceptedBy && (
                          <div className="bg-purple-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-semibold text-purple-700 mb-1">Accepted by:</p>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{donation.acceptedBy.organization?.name || donation.acceptedBy.name}</span>
                            </div>
                          </div>
                        )}

                        {/* Pickup Schedule */}
                        {donation.pickupSchedule && (
                          <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                            <div className="flex items-center gap-2 text-green-700">
                              <Calendar className="h-4 w-4" />
                              <strong>Pickup Scheduled:</strong> 
                              <span>{donation.pickupSchedule.date} at {donation.pickupSchedule.time}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 mt-3 text-xs">
                          <Badge variant="outline">{donation.category}</Badge>
                          <Badge variant="outline">{donation.quantity} items</Badge>
                          <Badge variant="outline">{donation.condition}</Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 ml-4">
                        {donation.status === 'accepted_by_ngo' && (
                          <Button
                            onClick={() => handleSchedulePickup(donation)}
                            className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Pickup
                          </Button>
                        )}

                        {donation.status === 'pickup_scheduled' && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleSchedulePickup(donation)}
                              className="whitespace-nowrap"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Reschedule
                            </Button>
                            <Badge className="bg-blue-100 text-blue-800 text-center py-2">
                              Waiting for NGO
                            </Badge>
                          </>
                        )}

                        {donation.status === 'in_transit' && (
                          <Badge className="bg-indigo-100 text-indigo-800 text-center py-2 whitespace-nowrap">
                            <Truck className="h-4 w-4 mr-1 inline" />
                            In Transit
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Requests List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Donation Requests</h2>
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

      {/* Logistics Modal - keeping your existing one */}
      <Dialog open={logisticsModalOpen} onOpenChange={setLogisticsModalOpen}>
        {/* ... keep your existing logistics modal code ... */}
      </Dialog>

      {/* ✅ NEW: Schedule Pickup Modal */}
      {/* ✅ Schedule Pickup Modal - with time slots */}
{/* ✅ Schedule Pickup Modal - with 3 time slots */}
<Dialog open={schedulePickupModalOpen} onOpenChange={setSchedulePickupModalOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Schedule Pickup</DialogTitle>
      <DialogDescription>
        Choose a date and time slot for the NGO to pick up your donation
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div>
        <Label>Pickup Date *</Label>
        <Input
          type="date"
          value={scheduleForm.pickupDate}
          onChange={(e) => setScheduleForm(prev => ({ ...prev, pickupDate: e.target.value }))}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div>
        <Label>Pickup Time Slot *</Label>
        <Select
          value={scheduleForm.pickupTime}
          onValueChange={(value) => setScheduleForm(prev => ({ ...prev, pickupTime: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select time slot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
            <SelectItem value="afternoon">Afternoon (12 PM - 3 PM)</SelectItem>
            <SelectItem value="evening">Evening (3 PM - 6 PM)</SelectItem>
          </SelectContent>
        </Select>
      </div>

     <div>
  <Label>Special Instructions (Optional)</Label>
  <Textarea
    placeholder="Any special instructions for pickup..."
    value={scheduleForm.specialInstructions}
    onChange={(e) => setScheduleForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
    rows={3}
  />
</div>

    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setSchedulePickupModalOpen(false)}>
        Cancel
      </Button>
      <Button
        onClick={handleSubmitSchedule}
        disabled={submitting || !scheduleForm.pickupDate || !scheduleForm.pickupTime}
        className="bg-green-600 hover:bg-green-700"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Confirm Pickup Schedule
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


    </div>
  );
};

export default DonationRequests;
