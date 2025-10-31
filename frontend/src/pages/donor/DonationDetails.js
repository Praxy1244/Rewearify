import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { donationService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Package, Calendar, MapPin, Tag, Palette, CheckCircle, Clock, XCircle ,Edit} from 'lucide-react';
import { toast } from 'sonner';

const DonationDetails = () => {
  const { id } = useParams(); // Get the donation ID from the URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonation = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await donationService.getDonationById(id);
        
        if (response.success) {
          // Security check: Make sure this donation belongs to the logged-in user
          if (response.data.donation.donor._id !== user._id) {
            toast.error("Access Denied", "You are not authorized to view this donation.");
            setError("You are not authorized to view this donation.");
            navigate('/donor/my-donations');
          } else {
            setDonation(response.data.donation);
          }
        } else {
          setError(response.message || "Failed to fetch donation details.");
          toast.error(response.message || "Failed to fetch donation details.");
        }
      } catch (err) {
        setError(err.message || "An error occurred.");
        toast.error("An error occurred while fetching donation details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [id, user, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'matched': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/donor/my-donations')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Donations
          </Button>
        </div>
      </div>
    );
  }

  if (!donation) {
    return null; // or a 'not found' message
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/donor/my-donations')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Donations
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">{donation.title}</CardTitle>
            <Badge className={`text-base ${getStatusColor(donation.status)}`}>
              {getStatusIcon(donation.status)}
              <span className="ml-2 capitalize">{donation.status}</span>
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
                <span className="text-lg">{donation.category} / {donation.subcategory}</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Sizes</h4>
              <div className="flex flex-wrap gap-2">
                {donation.sizes.map((s, i) => (
                  <Badge key={i} variant="secondary">{s.size} (Qty: {s.quantity})</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Colors</h4>
              <div className="flex flex-wrap gap-2">
                {donation.colors.map((color, i) => (
                  <Badge key={i} variant="outline" className="flex items-center space-x-1">
                    <Palette className="h-3 w-3" />
                    <span>{color}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {donation.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Admin Rejection Reason</h4>
              <p className="text-red-700">{donation.moderation?.rejectionReason || "No reason provided."}</p>
            </div>
          )}

          {donation.status === 'pending' && (
            <div className="flex gap-4">
              <Button onClick={() => navigate(`/donor/donations/${donation._id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Donation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonationDetails;