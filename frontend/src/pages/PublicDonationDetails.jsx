import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Package, Calendar, User, Heart, Loader2, CheckCircle, Tag } from 'lucide-react';
import { donationService } from '../services';

const PublicDonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      const response = await donationService.getDonationById(id);
      
      if (response.success) {
        setDonation(response.data.donation);
      }
    } catch (error) {
      console.error('Fetch donation error:', error);
      toast.error('Failed to load donation details');
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-orange-100 text-orange-800'
    };
    return colors[condition?.toLowerCase()] || colors.good;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Donation Not Found</h2>
        <p className="text-gray-600 mb-4">This donation may have been removed or doesn't exist.</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{donation.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getConditionColor(donation.condition)}>
                    {donation.condition}
                  </Badge>
                  {donation.status === 'approved' && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
              </div>
              <Button onClick={() => toast.info('Request feature coming soon!')}>
                <Heart className="h-4 w-4 mr-2" />
                Request Donation
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Image */}
            {donation.images && donation.images.length > 0 && (
              <div className="w-full">
                <img 
                  src={donation.images[0].url} 
                  alt={donation.title}
                  className="w-full h-80 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{donation.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Category</span>
                </div>
                <p className="text-gray-900 capitalize">{donation.category}</p>
                {donation.subcategory && (
                  <p className="text-sm text-gray-600 capitalize">{donation.subcategory}</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Quantity</span>
                </div>
                <p className="text-gray-900">{donation.quantity} items</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Donor</span>
                </div>
                <p className="text-gray-900">{donation.donor?.name || 'Anonymous'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Location</span>
                </div>
                <p className="text-gray-900">
                  {donation.location?.city}, {donation.location?.state}
                </p>
              </div>

              {donation.createdAt && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Posted On</span>
                  </div>
                  <p className="text-gray-900">
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Sizes */}
            {donation.sizes && donation.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Available Sizes</h3>
                <div className="flex flex-wrap gap-2">
                  {donation.sizes.map((size, idx) => (
                    <Badge key={idx} variant="outline">
                      {size.size}: {size.quantity} items
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pickup/Delivery Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Pickup & Delivery</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Pickup Available</p>
                  <p className="font-medium">
                    {donation.pickupAvailable ? 'Yes' : 'No'}
                  </p>
                </div>
                {donation.deliveryRadius && (
                  <div>
                    <p className="text-sm text-gray-600">Delivery Radius</p>
                    <p className="font-medium">{donation.deliveryRadius} km</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={() => toast.info('Request feature coming soon!')}>
                <Heart className="h-4 w-4 mr-2" />
                Request This Donation
              </Button>
              <Button variant="outline" onClick={() => toast.info('Contact feature coming soon!')}>
                Contact Donor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicDonationDetails;
