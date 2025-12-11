import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Spinner } from '../../components/ui/spinner';
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
  MessageSquare
} from 'lucide-react';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRequests, allDonations, loadingStates } = useApp();
  
  const [request, setRequest] = useState(null);
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequestDetails = () => {
      try {
        setLoading(true);
        
        // Find the request
        const foundRequest = userRequests.find(r => r._id === id);
        if (!foundRequest) {
          console.error('Request not found');
          setLoading(false);
          return;
        }
        
        setRequest(foundRequest);
        
        // Find the associated donation
        const foundDonation = allDonations.find(d => d._id === foundRequest.donation);
        if (foundDonation) {
          setDonation(foundDonation);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading request details:', error);
        setLoading(false);
      }
    };

    if (userRequests && allDonations) {
      fetchRequestDetails();
    }
  }, [id, userRequests, allDonations]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'delivered': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'delivered': return <Truck className="h-5 w-5 text-blue-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading || loadingStates.userRequests) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
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
            
            {/* Donation Details */}
            {donation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>Requested Item</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <img 
                      src={donation.images?.[0]?.url || 'https://placehold.co/200x200/e2e8f0/64748b?text=Item'}
                      alt={donation.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {donation.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{donation.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2 font-medium">{donation.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Condition:</span>
                          <span className="ml-2 font-medium">{donation.condition}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Requested Quantity:</span>
                          <span className="ml-2 font-medium">{request.quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Available:</span>
                          <span className="ml-2 font-medium">{donation.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Information */}
            <Card>
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Request Date</label>
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
                  
                  {request.urgency && (
                    <div>
                      <label className="text-sm text-gray-500">Priority Level</label>
                      <div className="mt-1">
                        <Badge className={
                          request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                          request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {request.urgency.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {request.expectedDelivery && (
                    <div>
                      <label className="text-sm text-gray-500">Expected Delivery</label>
                      <div className="flex items-center mt-1">
                        <Truck className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">
                          {new Date(request.expectedDelivery).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {request.justification && (
                  <div>
                    <label className="text-sm text-gray-500">Justification</label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
                      {request.justification}
                    </p>
                  </div>
                )}

                {request.deliveryAddress && (
                  <div>
                    <label className="text-sm text-gray-500">Delivery Address</label>
                    <div className="flex items-start mt-1">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                      <span className="font-medium">{request.deliveryAddress}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Notes (if rejected) */}
            {request.status === 'rejected' && request.adminNotes && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{request.adminNotes}</p>
                </CardContent>
              </Card>
            )}
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
                      <p className="font-medium text-sm">Request Submitted</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {request.status === 'approved' && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Request Approved</p>
                        <p className="text-xs text-gray-500">
                          {request.updatedAt && new Date(request.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Request Rejected</p>
                        <p className="text-xs text-gray-500">
                          {request.updatedAt && new Date(request.updatedAt).toLocaleString()}
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
                {request.status === 'pending' && (
                  <Button variant="outline" className="w-full" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Waiting for Approval
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

            {/* Donor Info */}
            {donation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-purple-600" />
                    <span>Donor Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Location:</span>
                      <p className="font-medium">{donation.location?.city || 'Not specified'}</p>
                    </div>
                    {donation.location?.address && (
                      <div>
                        <span className="text-sm text-gray-500">Address:</span>
                        <p className="text-sm">{donation.location.address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
