import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../hooks/use-toast';
import { 
  Package, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  X
} from 'lucide-react';

const MyRequests = () => {
  const { requests, cancelRequest } = useApp();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'received': return <Truck className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelRequest = (request) => {
    setSelectedRequest(request);
    setShowCancelDialog(true);
  };

  const confirmCancelRequest = () => {
    if (selectedRequest) {
      cancelRequest(selectedRequest.id);
      toast({
        title: "Request Cancelled",
        description: `Your request for "${selectedRequest.itemName}" has been cancelled.`,
      });
      setShowCancelDialog(false);
      setSelectedRequest(null);
    }
  };

  const getRequestStats = () => {
    const pending = requests.filter(req => req.status === 'pending').length;
    const approved = requests.filter(req => req.status === 'approved').length;
    const received = requests.filter(req => req.status === 'received').length;
    
    return { pending, approved, received };
  };

  const stats = getRequestStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
              <p className="text-gray-600 mt-1">Track all your donation requests</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Package className="w-4 h-4" />
              <span>{requests.length} total requests</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                    <p className="text-gray-600 text-sm">Pending Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
                    <p className="text-gray-600 text-sm">Approved Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.received}</p>
                    <p className="text-gray-600 text-sm">Items Received</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    {/* Item Image */}
                    <div className="flex-shrink-0">
                      <img 
                        src={request.itemImage} 
                        alt={request.itemName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                    
                    {/* Request Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {request.itemName}
                          </h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                Requested: {new Date(request.requestDate).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                Quantity: {request.quantity}
                              </span>
                            </div>
                            
                            {request.approvedDate && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Approved: {new Date(request.approvedDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            
                            {request.receivedDate && (
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Received: {new Date(request.receivedDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {request.notes && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {request.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Status and Actions */}
                        <div className="flex flex-col items-end space-y-3">
                          <Badge className={`${getStatusColor(request.status)} flex items-center space-x-1`}>
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                          
                          {request.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelRequest(request)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <Package className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
            <p className="text-gray-600 mb-6">You haven't made any donation requests yet.</p>
            <Button onClick={() => window.location.href = '/browse'}>
              Browse Available Items
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Cancel Request</span>
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <p>Are you sure you want to cancel your request for "{selectedRequest.itemName}"?</p>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
              <div className="flex space-x-3">
                <Button 
                  variant="destructive" 
                  onClick={confirmCancelRequest}
                  className="flex-1"
                >
                  Yes, Cancel Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1"
                >
                  Keep Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyRequests;