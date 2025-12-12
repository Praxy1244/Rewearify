import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { requestService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { Plus, Clock, CheckCircle, Package, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    active: 'bg-blue-100 text-blue-800',
    partially_fulfilled: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={`${statusStyles[status] || 'bg-gray-100 text-gray-800'} capitalize`}>
      {status ? status.replace('_', ' ') : 'Unknown'}
    </Badge>
  );
};

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    fulfilled: 0,
    totalItemsReceived: 0,
    totalRequests: 0,
  });

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      try {
        const response = await requestService.getMyRequests(user._id);
        
        console.log('API Response:', response);

        if (response.success) {
          // ✅ Based on your paginated helper, response.data IS the array
          const requestList = Array.isArray(response.data) ? response.data : [];
          
          setRequests(requestList);
          calculateStats(requestList);
        } else {
          toast.error(response.message || 'Failed to fetch requests');
        }
      } catch (error) {
        console.error('Fetch requests error:', error);
        toast.error('Failed to fetch your requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const calculateStats = (requests) => {
    if (!requests) return;
    const pending = requests.filter(r => ['active', 'partially_fulfilled'].includes(r.status)).length;
    const fulfilled = requests.filter(r => r.status === 'completed').length;
    const totalItemsReceived = requests.reduce((sum, r) => sum + (r.quantityReceived || 0), 0);

    setStats({
      pending,
      fulfilled,
      totalItemsReceived,
      totalRequests: requests.length,
    });
  };
  
  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
        return;
    }

    try {
        await requestService.deleteRequest(requestId);
        toast.success('Request deleted successfully');
        setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch(error) {
        toast.error(error.message || 'Failed to delete request');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Clock className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
            <p className="text-gray-600 mt-1">Track and manage all your donation requests</p>
          </div>
          <Button onClick={() => navigate('/recipient/create-request')}>
            <Plus className="h-5 w-5 mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Requests</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.fulfilled}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items Received</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalItemsReceived}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRequests}</div>
                </CardContent>
            </Card>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length > 0 ? (
            requests.map(request => (
              <Card key={request._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Request Info */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 hover:text-blue-700">
                           <Link to={`/requests/${request._id}`}>{request.title || 'Untitled Request'}</Link>
                        </h3>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{request.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">{request.category}</Badge>
                        <Badge variant="outline">{request.subcategory}</Badge>
                        {request.urgency === 'high' && <Badge className="bg-red-100 text-red-800">High Urgency</Badge>}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="col-span-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-bold">
                            {request.quantityReceived || 0} / {request.quantity || 0}
                        </span>
                      </div>
                      <Progress 
                        value={Math.round(((request.quantityReceived || 0) / (request.quantity || 1)) * 100)} 
                        className="h-2" 
                      />
                      <p className="text-xs text-right mt-1 text-gray-500">
                        {Math.round(((request.quantityReceived || 0) / (request.quantity || 1)) * 100)}% Fulfilled
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-1 flex flex-col md:flex-row items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/requests/${request._id}`)}>
                        View
                      </Button>
                       <Button variant="outline" size="sm" onClick={() => toast.info('Edit feature coming soon!')}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(request._id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-4 border-t pt-2">
                    Requested on: {request.createdAt ? format(new Date(request.createdAt), 'MMM dd, yyyy') : 'Date not available'}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Requests Found</h3>
              <p className="text-gray-500 mt-1">
                You haven't created any requests yet. Get started by letting donors know what you need.
              </p>
              <Button onClick={() => navigate('/recipient/create-request')} className="mt-4">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRequests;
