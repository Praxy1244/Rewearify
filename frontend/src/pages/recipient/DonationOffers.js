import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  RefreshCw, 
  Package, 
  MapPin, 
  User, 
  Calendar, 
  CheckCircle, 
  X,
  AlertCircle,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

const DonationOffers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, new, urgent
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  // Fetch donation offers
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching offers for NGO:', user.id, user.name);

      const response = await api.get('/donations', {
        params: {
          status: 'approved',
          recipientId: user.id,
          page: 1,
          limit: 100
        }
      });

      console.log('📦 API Response:', response);

      if (response.success) {
        // Filter donations that include this NGO as preferred recipient
        const myOffers = response.data.filter(donation => {
          console.log('Checking donation:', donation._id, donation.preferences?.preferredRecipients);
          
          const isForThisNGO = donation.preferences?.preferredRecipients?.some(
            recipient => {
              const recipientId = typeof recipient === 'object' ? recipient._id : recipient;
              return recipientId === user.id;
            }
          );
          
          return isForThisNGO;
        });

        console.log('✅ Found', myOffers.length, 'offers for this NGO');
        setOffers(myOffers);
      } else {
        console.error('❌ Response not successful:', response);
        setOffers([]);
      }
    } catch (err) {
      console.error('❌ Error fetching offers:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load donation offers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (donationId) => {
    try {
      setAcceptingId(donationId);
      
      console.log('✅ Accepting donation offer:', donationId);
      
      const response = await api.put(`/donations/${donationId}/ngo-accept`);
      
      if (response.success) {
        toast.success('✅ Donation offer accepted successfully! The donor has been notified and will schedule a pickup time.');
        
        // Remove accepted offer from list
        setOffers(offers.filter(offer => offer._id !== donationId));
        setSelectedOffer(null);
        
        // Navigate to my requests page where it will show
        setTimeout(() => {
          navigate('/recipient/my-requests');
        }, 1500);
      }
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error(err.response?.data?.message || 'Failed to accept offer. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleViewDetails = (offer) => {
    setSelectedOffer(offer);
  };

  const closeModal = () => {
    setSelectedOffer(null);
  };

  const getFilteredOffers = () => {
    if (filter === 'new') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return offers.filter(offer => new Date(offer.approvedAt) > sevenDaysAgo);
    }
    if (filter === 'urgent') {
      return offers.filter(offer => offer.preferences?.urgentNeeded);
    }
    return offers;
  };

  const filteredOffers = getFilteredOffers();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading donation offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">{error}</p>
          <Button onClick={fetchOffers} className="bg-green-600 hover:bg-green-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Gift className="h-10 w-10 text-green-600" />
            Donation Offers
          </h1>
          <p className="text-gray-600 text-lg">
            Donors have offered these donations specifically to your organization
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-600 hover:-translate-y-0.5'
            }`}
            onClick={() => setFilter('all')}
          >
            All Offers ({offers.length})
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              filter === 'new'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-600 hover:-translate-y-0.5'
            }`}
            onClick={() => setFilter('new')}
          >
            New (Last 7 Days)
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              filter === 'urgent'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-600 hover:-translate-y-0.5'
            }`}
            onClick={() => setFilter('urgent')}
          >
            Urgent
          </button>
          <button
            className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2"
            onClick={fetchOffers}
            title="Refresh offers"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Offers List */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No donation offers yet</h3>
            <p className="text-gray-600 text-lg">
              {filter === 'all'
                ? 'You have no pending donation offers at the moment.'
                : `No ${filter} offers found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <Card key={offer._id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* Offer Image */}
                <div className="relative w-full h-56 overflow-hidden bg-gray-100">
                  {offer.images && offer.images.length > 0 ? (
                    <img 
                      src={offer.images[0]} 
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700 text-white text-6xl">
                      📦
                    </div>
                  )}
                  {offer.preferences?.urgentNeeded && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm animate-pulse shadow-lg">
                      🚨 Urgent
                    </span>
                  )}
                </div>

                {/* Offer Content */}
                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{offer.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-green-100 text-green-800">{offer.category}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">{offer.condition}</Badge>
                    <Badge className="bg-gray-100 text-gray-800">Qty: {offer.quantity}</Badge>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                    {offer.description.length > 100
                      ? `${offer.description.substring(0, 100)}...`
                      : offer.description}
                  </p>

                  {/* Donor Info */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {offer.donor?.profile?.profilePicture ? (
                        <img 
                          src={offer.donor.profile.profilePicture} 
                          alt={offer.donor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center text-xl font-bold">
                          {offer.donor?.name?.charAt(0) || 'D'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {offer.donor?.name || 'Anonymous Donor'}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {offer.location?.city || 'Location not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Approval Info */}
                  <div className="mb-4">
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      Approved {new Date(offer.approvedAt).toLocaleDateString()}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <Button
                      variant="outline"
                      className="flex-1 border-2 border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => handleViewDetails(offer)}
                    >
                      View Details
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleAcceptOffer(offer._id)}
                      disabled={acceptingId === offer._id}
                    >
                      {acceptingId === offer._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOffer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all hover:rotate-90"
              onClick={closeModal}
            >
              <X className="h-6 w-6" />
            </button>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{selectedOffer.title}</h2>

              {/* Image Gallery */}
              {selectedOffer.images && selectedOffer.images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {selectedOffer.images.map((img, index) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt={`${selectedOffer.title} ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <strong className="text-gray-600">Category:</strong>
                  <span className="font-semibold text-gray-900">{selectedOffer.category}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-gray-600">Condition:</strong>
                  <span className="font-semibold text-gray-900">{selectedOffer.condition}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-gray-600">Quantity:</strong>
                  <span className="font-semibold text-gray-900">{selectedOffer.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-gray-600">Season:</strong>
                  <span className="font-semibold text-gray-900">{selectedOffer.season || 'All Season'}</span>
                </div>
                {selectedOffer.size && (
                  <div className="flex justify-between col-span-2">
                    <strong className="text-gray-600">Size:</strong>
                    <span className="font-semibold text-gray-900">{selectedOffer.size}</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedOffer.description}</p>
              </div>

              {/* Donor Information */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                  Donor Information
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p><strong>Name:</strong> {selectedOffer.donor?.name}</p>
                  <p><strong>Email:</strong> {selectedOffer.donor?.email}</p>
                  {selectedOffer.donor?.phone && (
                    <p><strong>Phone:</strong> {selectedOffer.donor.phone}</p>
                  )}
                  <p><strong>Location:</strong> {selectedOffer.location?.address || selectedOffer.location?.city}</p>
                </div>
              </div>

              {/* AI Analysis (if available) */}
              {selectedOffer.aiAnalysis && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                    AI Analysis
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    {selectedOffer.aiAnalysis.qualityScore && (
                      <p>Quality Score: {(selectedOffer.aiAnalysis.qualityScore * 100).toFixed(0)}%</p>
                    )}
                    {selectedOffer.aiAnalysis.demandPrediction && (
                      <p>Demand: {selectedOffer.aiAnalysis.demandPrediction}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Accept Button */}
              <div className="flex gap-4 mt-8 pt-8 border-t-2 border-gray-200">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeModal}
                >
                  Close
                </Button>
                <Button
                  className="flex-[2] bg-green-600 hover:bg-green-700 text-lg py-6"
                  onClick={() => {
                    handleAcceptOffer(selectedOffer._id);
                    closeModal();
                  }}
                  disabled={acceptingId === selectedOffer._id}
                >
                  {acceptingId === selectedOffer._id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Accept This Offer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationOffers;
