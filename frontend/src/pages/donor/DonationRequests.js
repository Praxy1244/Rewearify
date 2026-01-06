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
  const [acceptedDonations, setAcceptedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [schedulePickupModalOpen, setSchedulePickupModalOpen] = useState(false);
  
  // Selected request/donation
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  
  // Form data
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ✅ Enhanced logistics form state
  const [scheduleForm, setScheduleForm] = useState({
    method: 'pickup',              // 'pickup' or 'delivery'
    pickupDate: '',
    pickupTime: '',
    
    // Pickup details (NGO comes to donor)
    pickupAddress: '',
    pickupCity: '',
    pickupState: '',
    pickupZipCode: '',
    
    // Delivery details (Donor goes to NGO)
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZipCode: '',
    
    // Contact information
    contactPerson: '',
    contactPhone: '',
    alternatePhone: '',
    
    // Instructions
    specialInstructions: '',
    parkingInfo: '',
    landmarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending requests
      const requestsResponse = await requestService.getPendingRequestsForDonor();
      if (requestsResponse.success) {
        setRequests(requestsResponse.data.requests || []);
        console.log(`✅ Found ${requestsResponse.data.requests?.length || 0} pending requests`);
      }

      // ✅ Fetch accepted donations including all relevant statuses
      const donationsResponse = await api.get(`/donations/user/${user._id || user.id}`, {
        params: { limit: 100 }
      });
      
      if (donationsResponse.success) {
        // ✅ Filter to show donations in these statuses
        const needsScheduling = donationsResponse.data.filter(d => 
          ['accepted_by_ngo', 'pickup_scheduled', 'in_transit'].includes(d.status)
        );
        
        console.log(`📦 All donations:`, donationsResponse.data.length);
        console.log(`📦 Filtered donations (with statuses):`, needsScheduling.map(d => ({
          id: d._id,
          title: d.title,
          status: d.status,
          hasPickupSchedule: !!d.pickupSchedule
        })));
        
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

  const handleAcceptRequest = async (request) => {
    if (!request) return;
    
    try {
      setSubmitting(true);
      console.log('🔄 Accepting request:', request._id);
      
      const response = await requestService.acceptRequest(request._id, '');
      
      if (response.success) {
        toast.success('✅ Request accepted! Now schedule the logistics.');
        
        // Get the donation ID from the request
        const donationId = request.donation?._id || request.donation;
        
        if (donationId) {
          const donationResponse = await api.get(`/donations/${donationId}`);
          
          if (donationResponse.success) {
            const donation = donationResponse.data?.donation || donationResponse.data;
            
            if (!donation._id) {
              console.error('❌ NO _id FOUND! Donation keys:', Object.keys(donation));
              toast.error('Error: Donation ID not found');
              return;
            }
            
            setSelectedDonation(donation);
            handleSchedulePickup(donation); // ✅ Open modal with pre-filled data
            setRequests(prev => prev.filter(r => r._id !== request._id));
          }
        } else {
          console.error('❌ NO DONATION ID! Request keys:', Object.keys(request));
          toast.error('Donation ID not found in request');
        }
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
        toast.success('Request declined and NGO has been notified');
        setRejectModalOpen(false);
        setRejectReason('');
        setSelectedRequest(null);
        
        // Remove from pending list
        setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
      } else {
        toast.error(response.message || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Reject request error:', error);
      toast.error(error.message || 'Failed to decline request');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Handle logistics scheduling - enhanced version
  const handleSchedulePickup = (donation) => {
    console.log('📅 Opening logistics modal for donation:', donation);
    
    if (!donation || !donation._id) {
      console.error('❌ Invalid donation object:', donation);
      toast.error('Error: Donation data is invalid');
      return;
    }
    
    setSelectedDonation(donation);
    
    // Pre-fill if rescheduling
    if (donation.pickupSchedule) {
      setScheduleForm({
        method: donation.pickupSchedule.method || 'pickup',
        pickupDate: donation.pickupSchedule.date || '',
        pickupTime: donation.pickupSchedule.time || '',
        
        pickupAddress: donation.pickupSchedule.pickupAddress || donation.location?.address || '',
        pickupCity: donation.pickupSchedule.pickupCity || donation.location?.city || '',
        pickupState: donation.pickupSchedule.pickupState || donation.location?.state || '',
        pickupZipCode: donation.pickupSchedule.pickupZipCode || donation.location?.zipCode || '',
        
        deliveryAddress: donation.pickupSchedule.deliveryAddress || '',
        deliveryCity: donation.pickupSchedule.deliveryCity || '',
        deliveryState: donation.pickupSchedule.deliveryState || '',
        deliveryZipCode: donation.pickupSchedule.deliveryZipCode || '',
        
        contactPerson: donation.pickupSchedule.contactPerson || user.name || '',
        contactPhone: donation.pickupSchedule.contactPhone || user.phone || '',
        alternatePhone: donation.pickupSchedule.alternatePhone || '',
        
        specialInstructions: donation.pickupSchedule.specialInstructions || '',
        parkingInfo: donation.pickupSchedule.parkingInfo || '',
        landmarks: donation.pickupSchedule.landmarks || ''
      });
    } else {
      // Default values for new scheduling
      setScheduleForm({
        method: 'pickup',
        pickupDate: '',
        pickupTime: '',
        
        pickupAddress: donation.location?.address || '',
        pickupCity: donation.location?.city || '',
        pickupState: donation.location?.state || '',
        pickupZipCode: donation.location?.zipCode || '',
        
        deliveryAddress: '',
        deliveryCity: '',
        deliveryState: '',
        deliveryZipCode: '',
        
        contactPerson: user.name || '',
        contactPhone: user.phone || '',
        alternatePhone: '',
        
        specialInstructions: '',
        parkingInfo: '',
        landmarks: ''
      });
    }
    
    setSchedulePickupModalOpen(true);
  };

  // ✅ Submit logistics schedule
  const handleSubmitSchedule = async () => {
    // Validation
    if (!scheduleForm.pickupDate || !scheduleForm.pickupTime) {
      toast.error('Please select date and time slot');
      return;
    }

    if (!scheduleForm.method) {
      toast.error('Please select pickup or delivery method');
      return;
    }

    if (scheduleForm.method === 'pickup') {
      if (!scheduleForm.pickupAddress || !scheduleForm.pickupCity) {
        toast.error('Please provide pickup address and city');
        return;
      }
    } else {
      if (!scheduleForm.deliveryAddress || !scheduleForm.deliveryCity) {
        toast.error('Please provide delivery address and city');
        return;
      }
    }

    if (!scheduleForm.contactPhone) {
      toast.error('Please provide contact phone number');
      return;
    }

    if (!selectedDonation || !selectedDonation._id) {
      console.error('❌ No donation selected or missing ID:', selectedDonation);
      toast.error('Error: Donation not found. Please try again.');
      setSchedulePickupModalOpen(false);
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('📅 Scheduling logistics for donation:', selectedDonation._id);
      console.log('📅 Logistics data:', scheduleForm);
      
      const response = await api.put(`/donations/${selectedDonation._id}/schedule-pickup`, scheduleForm);

      console.log('📅 Schedule response:', response);

      if (response.success) {
        const methodText = scheduleForm.method === 'pickup' ? 'Pickup' : 'Delivery';
        toast.success(`✅ ${methodText} scheduled successfully! NGO has been notified.`);
        
        setSchedulePickupModalOpen(false);
        
        // Update local state
        setAcceptedDonations(prev => prev.map(d => 
          d._id === selectedDonation._id 
            ? { 
                ...d, 
                status: 'pickup_scheduled',
                pickupSchedule: {
                  ...scheduleForm,
                  scheduledAt: new Date()
                }
              }
            : d
        ));
        
        // Reset form
        setSelectedDonation(null);
        setScheduleForm({
          method: 'pickup',
          pickupDate: '',
          pickupTime: '',
          pickupAddress: '',
          pickupCity: '',
          pickupState: '',
          pickupZipCode: '',
          deliveryAddress: '',
          deliveryCity: '',
          deliveryState: '',
          deliveryZipCode: '',
          contactPerson: '',
          contactPhone: '',
          alternatePhone: '',
          specialInstructions: '',
          parkingInfo: '',
          landmarks: ''
        });
        
        // Refresh data
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        toast.error(response.message || 'Failed to schedule');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
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

        {/* ✅ Accepted Donations Section */}
        {acceptedDonations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-purple-600" />
              Accepted Donations - Action Required
            </h2>
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
                            {donation.status === 'accepted_by_ngo' ? '⏰ Schedule Logistics' :
                             donation.status === 'pickup_scheduled' ? '✅ Pickup Scheduled' :
                             '🚚 In Transit'}
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
                            {donation.acceptedBy.email && (
                              <p className="text-sm text-gray-600 mt-1">📧 {donation.acceptedBy.email}</p>
                            )}
                            {donation.acceptedBy.phone && (
                              <p className="text-sm text-gray-600">📞 {donation.acceptedBy.phone}</p>
                            )}
                          </div>
                        )}

                        {/* Pickup Schedule */}
                        {donation.pickupSchedule && (
                          <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500 mb-3">
                            <div className="flex items-center gap-2 text-green-700 mb-2">
                              <Calendar className="h-4 w-4" />
                              <strong>{donation.pickupSchedule.method === 'pickup' ? 'Pickup' : 'Delivery'} Scheduled:</strong> 
                              <span>{new Date(donation.pickupSchedule.date).toLocaleDateString()} at {donation.pickupSchedule.time}</span>
                            </div>
                            {donation.pickupSchedule.method === 'pickup' && donation.pickupSchedule.pickupAddress && (
                              <p className="text-sm text-green-600 ml-6">
                                📍 {donation.pickupSchedule.pickupAddress}, {donation.pickupSchedule.pickupCity}
                              </p>
                            )}
                            {donation.pickupSchedule.contactPerson && (
                              <p className="text-sm text-green-600 ml-6">
                                👤 {donation.pickupSchedule.contactPerson} • 📞 {donation.pickupSchedule.contactPhone}
                              </p>
                            )}
                            {donation.pickupSchedule.specialInstructions && (
                              <p className="text-sm text-green-600 mt-1 ml-6">
                                📝 {donation.pickupSchedule.specialInstructions}
                              </p>
                            )}
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
                            size="lg"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Logistics
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
                              Waiting for NGO Pickup
                            </Badge>
                          </>
                        )}

                        {donation.status === 'in_transit' && (
                          <Badge className="bg-indigo-100 text-indigo-800 text-center py-3 whitespace-nowrap">
                            <Truck className="h-4 w-4 mr-1 inline" />
                            In Transit to NGO
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

        {/* Pending Requests List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Pending Donation Requests from NGOs
          </h2>
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
                          <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>
                        </div>

                        <p className="text-gray-700 mb-4">{request.description}</p>

                        {/* Requester Info */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-700 mb-2">Requested by:</p>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{request.requester?.name}</p>
                              {request.requester?.organization?.name && (
                                <p className="text-sm text-gray-600 truncate">{request.requester.organization.name}</p>
                              )}
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
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
                          onClick={() => handleAcceptRequest(request)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept Request
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => openRejectModal(request)}
                          variant="destructive"
                          className="w-full"
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

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this request. The NGO will be notified.
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

      {/* ✅ ENHANCED LOGISTICS MODAL */}
      <Dialog open={schedulePickupModalOpen} onOpenChange={(open) => {
        if (!submitting) {
          setSchedulePickupModalOpen(open);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Schedule Logistics
            </DialogTitle>
            <DialogDescription>
              Choose how you'd like to transfer this donation and provide necessary details
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitSchedule(); }} className="space-y-6 py-4">
            
            {/* Method Selection */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <Label className="text-base font-semibold mb-3 block">Transfer Method *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleForm(prev => ({ ...prev, method: 'pickup' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    scheduleForm.method === 'pickup'
                      ? 'border-blue-600 bg-blue-100 shadow-md'
                      : 'border-gray-300 bg-white hover:border-blue-400'
                  }`}
                >
                  <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">Pickup</p>
                  <p className="text-xs text-gray-600">NGO picks up from you</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setScheduleForm(prev => ({ ...prev, method: 'delivery' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    scheduleForm.method === 'delivery'
                      ? 'border-green-600 bg-green-100 shadow-md'
                      : 'border-gray-300 bg-white hover:border-green-400'
                  }`}
                >
                  <Truck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Delivery</p>
                  <p className="text-xs text-gray-600">You deliver to NGO</p>
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={scheduleForm.pickupDate}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, pickupDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Time Slot *</Label>
                <Select
                  value={scheduleForm.pickupTime}
                  onValueChange={(value) => setScheduleForm(prev => ({ ...prev, pickupTime: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">🌅 Morning (9 AM - 12 PM)</SelectItem>
                    <SelectItem value="afternoon">☀️ Afternoon (12 PM - 3 PM)</SelectItem>
                    <SelectItem value="evening">🌆 Evening (3 PM - 6 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PICKUP ADDRESS (if method is pickup) */}
            {scheduleForm.method === 'pickup' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Pickup Address (Where NGO will come)
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label>Street Address *</Label>
                    <Input
                      type="text"
                      placeholder="123 Main Street, Building/Apt #"
                      value={scheduleForm.pickupAddress}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>City *</Label>
                      <Input
                        type="text"
                        placeholder="City"
                        value={scheduleForm.pickupCity}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, pickupCity: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>State</Label>
                      <Input
                        type="text"
                        placeholder="State"
                        value={scheduleForm.pickupState}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, pickupState: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>ZIP Code</Label>
                      <Input
                        type="text"
                        placeholder="000000"
                        value={scheduleForm.pickupZipCode}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, pickupZipCode: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Parking Information</Label>
                    <Input
                      type="text"
                      placeholder="e.g., Free parking available in front, Gate code: 1234"
                      value={scheduleForm.parkingInfo}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, parkingInfo: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Nearby Landmarks</Label>
                    <Input
                      type="text"
                      placeholder="e.g., Near City Mall, behind HDFC Bank"
                      value={scheduleForm.landmarks}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, landmarks: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DELIVERY ADDRESS (if method is delivery) */}
            {scheduleForm.method === 'delivery' && selectedDonation?.acceptedBy && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address (Where you'll deliver)
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label>Street Address *</Label>
                    <Input
                      type="text"
                      placeholder="NGO's address"
                      value={scheduleForm.deliveryAddress}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      required
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: Contact {selectedDonation.acceptedBy.organization?.name || selectedDonation.acceptedBy.name} for their exact address
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>City *</Label>
                      <Input
                        type="text"
                        placeholder="City"
                        value={scheduleForm.deliveryCity}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, deliveryCity: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>State</Label>
                      <Input
                        type="text"
                        placeholder="State"
                        value={scheduleForm.deliveryState}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, deliveryState: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>ZIP Code</Label>
                      <Input
                        type="text"
                        placeholder="000000"
                        value={scheduleForm.deliveryZipCode}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, deliveryZipCode: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label>Contact Person Name *</Label>
                  <Input
                    type="text"
                    placeholder="Your name or person to contact"
                    value={scheduleForm.contactPerson}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Primary Phone *</Label>
                    <Input
                      type="tel"
                      placeholder="+91 00000 00000"
                      value={scheduleForm.contactPhone}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Alternate Phone (Optional)</Label>
                    <Input
                      type="tel"
                      placeholder="+91 00000 00000"
                      value={scheduleForm.alternatePhone}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, alternatePhone: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special instructions (e.g., call before arriving, best time to reach, gate access codes, etc.)"
                value={scheduleForm.specialInstructions}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* NGO Contact Info Display */}
            {selectedDonation?.acceptedBy && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-sm text-blue-800">NGO Contact Information:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Organization:</strong> {selectedDonation.acceptedBy.organization?.name || selectedDonation.acceptedBy.name}</p>
                  {selectedDonation.acceptedBy.email && (
                    <p><strong>Email:</strong> {selectedDonation.acceptedBy.email}</p>
                  )}
                  {selectedDonation.acceptedBy.phone && (
                    <p><strong>Phone:</strong> {selectedDonation.acceptedBy.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <DialogFooter className="gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setSchedulePickupModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !scheduleForm.pickupDate || !scheduleForm.pickupTime || !scheduleForm.contactPhone}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Confirm {scheduleForm.method === 'pickup' ? 'Pickup' : 'Delivery'} Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonationRequests;
