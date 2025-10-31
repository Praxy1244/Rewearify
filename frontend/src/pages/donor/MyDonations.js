import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { donationService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar, MapPin, Package, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

const MyDonations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user && user._id) { 
      fetchMyDonations();
    } else if (!user) {
      setLoading(false);
      setError("Please log in to see your donations.");
    }
  }, [user]);

  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      setError(null); 
      
      const response = await donationService.getUserDonations(user._id); 
      
      if (response.success) {
        // The data is in response.data, which is an array
        setDonations(response.data || []); 
      } else {
        setError(response.message || 'Failed to fetch donations');
        toast.error(response.message || 'Failed to fetch donations');
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError(err.message || 'Failed to fetch donations');
      toast.error('Failed to load your donations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm('Are you sure you want to delete this donation? This action is permanent.')) {
      return;
    }

    try {
      const response = await donationService.deleteDonation(donationId);
      if (response.success) {
        setDonations(donations.filter(d => d._id !== donationId));
        toast.success('Donation deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete donation');
      }
    } catch (err) {
      console.error('Error deleting donation:', err);
      toast.error(err.message || 'Failed to delete donation');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'matched':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterDonations = (status) => {
    if (status === 'all') return donations;
    return donations.filter(donation => donation.status === status);
  };

  const getStatusCounts = () => {
    return {
      all: donations.length,
      pending: donations.filter(d => d.status === 'pending').length,
      approved: donations.filter(d => d.status === 'approved').length,
      matched: donations.filter(d => d.status === 'matched').length,
      completed: donations.filter(d => d.status === 'completed').length,
      rejected: donations.filter(d => d.status === 'rejected').length,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your donations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Donations</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchMyDonations} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Donations</h1>
        <p className="text-gray-600">Track and manage your clothing donations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
          <TabsTrigger value="matched">Matched ({statusCounts.matched})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'approved', 'matched', 'completed', 'rejected'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterDonations(status).length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No {status === 'all' ? '' : status} donations found
                </h3>
                <p className="text-gray-600 mb-4">
                  {status === 'all' 
                    ? "You haven't made any donations yet." 
                    : `You don't have any ${status} donations.`}
                </p>
                <Button asChild>
                  <Link to="/donor/donate">Make Your First Donation</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterDonations(status).map((donation) => (
                  <Card key={donation._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold line-clamp-2">
                          {donation.title || 'Untitled Donation'}
                        </CardTitle>
                        <Badge className={getStatusColor(donation.status)}>
                          {donation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {donation.images && donation.images.length > 0 && (
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={donation.images[0]}
                            alt={donation.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {donation.description || 'No description provided'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>{donation.quantity || 0} items</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {donation.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            <span>{donation.location.city}, {donation.location.state}</span>
                          </div>
                        )}

                        {/* --- THIS IS THE FIXED BLOCK --- */}
                        {donation.sizes && donation.sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {/* FIX 1: Changed donation.items to donation.sizes */}
                            {donation.sizes.slice(0, 3).map((item, index) => ( 
                              <Badge key={index} variant="secondary" className="text-xs">
                                {/* FIX 2: Changed item.category to item.size */}
                                {item.size}
                              </Badge>
                            ))}
                            {/* FIX 3: Changed donation.items.length to donation.sizes.length */}
                            {donation.sizes.length > 3 && ( 
                              <Badge variant="secondary" className="text-xs">
                                +{donation.sizes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        {/* --- END OF FIX --- */}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          // We use window.location.href for now, until we create the page
                          onClick={() => navigate(`/donor/donations/${donation._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {donation.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              // We use window.location.href for now, until we create the page
                              onClick={() => navigate(`/donor/donations/${donation._id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteDonation(donation._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MyDonations;