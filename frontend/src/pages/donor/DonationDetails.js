import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { donationService, requestService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Package, MapPin, Tag, Palette, CheckCircle, Clock, XCircle, Edit, Truck } from 'lucide-react';
import { toast } from 'sonner';
import SchedulePickupModal from '../../components/SchedulePickupModal';
import DonationTimeline from '../../components/DonationTimeline';
import InterestedNGOs from '../../components/InterestedNGOs';
import SuggestedNGOs from '../../components/SuggestedNGOs';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donation, setDonation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    fetchDonationData();
  }, [id, user, navigate]);

  const fetchDonationData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      const donationRes = await donationService.getDonationById(id);
      
      if (donationRes.success) {
        const donData = donationRes.data.donation;
        
        if (donData.donor._id !== user._id) {
          toast.error("Access Denied");
          navigate('/donor/my-donations');
          return;
        }
        setDonation(donData);

        if (donData.status === 'approved') {
          const reqRes = await requestService.getRequests({ 
            donation: id, 
            status: 'active' 
          });
          if (reqRes.success) {
            setRequests(reqRes.data.requests || []);
          }
        }
      } else {
        setError("Failed to fetch donation details.");
      }
    } catch (err) {
      setError("An error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setAccepting(true);
    try {
      const response = await requestService.matchRequest(requestId, id);
      
      if (response.success) {
        toast.success("Request Accepted! You can now schedule pickup.");
        fetchDonationData();
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      console.error("Match error:", error);
      toast.error("Error accepting request");
    } finally {
      setAccepting(false);
    }
  };

  const handleSchedulePickup = async (scheduleData) => {
    setScheduling(true);
    try {
      const response = await donationService.schedulePickup(id, scheduleData);
      if (response.success) {
        toast.success("Pickup scheduled successfully!");
        setShowPickupModal(false);
        fetchDonationData();
      } else {
        toast.error(response.message || "Failed to schedule pickup");
      }
    } catch (err) {
      toast.error(err.message || "Error scheduling pickup");
    } finally {
      setScheduling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'matched': return 'bg-blue-100 text-blue-800';
      case 'pickup_scheduled': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pickup_scheduled': return <Truck className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error || "Donation not found"}</p>
          <Button onClick={() => navigate('/donor/my-donations')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Donations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/donor/my-donations')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Donations
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <DonationTimeline status={donation.status} /> 
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold">{donation.title}</CardTitle>
                <Badge className={`text-base ${getStatusColor(donation.status)}`}>
                  {getStatusIcon(donation.status)}
                  <span className="ml-2 capitalize">
                    {donation.status === 'pickup_scheduled' ? 'Pickup Scheduled' : donation.status.replace('_', ' ')}
                  </span>
                </Badge>
              </div>
              <CardDescription>
                Donated on {new Date(donation.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={donation.images?.[0]?.url || 'https://placehold.co/600x400/E2E8F0/4A5568?text=Donation'} 
                    alt={donation.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <span className="text-lg capitalize">{donation.category} / {donation.subcategory}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                    <span className="text-lg capitalize">{donation.condition} Condition</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    <span className="text-lg">{donation.quantity} items</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-lg">{donation.location.city}, {donation.location.state}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Description</h4>
                <p className="text-gray-700">{donation.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Sizes</h4>
                  <div className="flex flex-wrap gap-2">
                    {donation.sizes.map((s, i) => (
                      <Badge key={i} variant="secondary">{s.size} (Qty: {s.quantity})</Badge>
                    ))}
                  </div>
                </div>
                {/* 💡 REMOVED: Colors section */}
              </div>

              {donation.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Admin Rejection Reason</h4>
                  <p className="text-red-700">{donation.moderation?.rejectionReason || "No reason provided."}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t">
                {donation.status === 'pending' && (
                  <Button onClick={() => navigate(`/donor/donations/${donation._id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Donation
                  </Button>
                )}

                {donation.status === 'matched' && (
                  <Button 
                    onClick={() => setShowPickupModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Schedule Pickup
                  </Button>
                )}
                
                {donation.status === 'pickup_scheduled' && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-md w-full flex items-center">
                    <Truck className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-semibold">Pickup Scheduled</p>
                      <p className="text-sm">Your donation is queued for pickup.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {donation.status === 'approved' && (
             <InterestedNGOs 
                requests={requests} 
                onAccept={handleAcceptRequest} 
                loading={accepting} 
             />
          )}

          {donation.status === 'approved' && (
             <SuggestedNGOs donation={donation} />
          )}

        </div>
      </div>

      <SchedulePickupModal 
        open={showPickupModal} 
        onOpenChange={setShowPickupModal}
        onSchedule={handleSchedulePickup}
        loading={scheduling}
      />
    </div>
  );
};

export default DonationDetails;