import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  TrendingUp,
  Users,
  Heart,
  Calendar,
  MapPin,
  Sparkles
} from 'lucide-react';
import { mockDonations, mockRequests } from '../../mock';

const MyDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    // Get user's donations (including from localStorage for demo)
    const userDonations = mockDonations.filter(d => d.donorId === user.id);
    const storedDonations = JSON.parse(localStorage.getItem('user_donations') || '[]');
    setDonations([...userDonations, ...storedDonations]);

    // Get requests for user's donations
    const donationIds = [...userDonations, ...storedDonations].map(d => d.id);
    const userRequests = mockRequests.filter(r => donationIds.includes(r.donationId));
    setRequests(userRequests);
  }, [user.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         donation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || donation.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || donation.category === filterCategory;
    const matchesTab = activeTab === 'all' || donation.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesTab;
  });

  const stats = {
    total: donations.length,
    approved: donations.filter(d => d.status === 'approved').length,
    pending: donations.filter(d => d.status === 'pending').length,
    totalRequests: requests.length,
    activeRequests: requests.filter(r => r.status === 'pending').length
  };

  const DonationCard = ({ donation }) => {
    const donationRequests = requests.filter(r => r.donationId === donation.id);
    
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Image */}
            <div className="flex-shrink-0">
              <img 
                src={donation.images?.[0] || '/placeholder-image.jpg'} 
                alt={donation.title}
                className="w-24 h-24 object-cover rounded-lg border"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {donation.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {donation.description}
                  </p>
                </div>
                
                <div className="flex flex-col items-end space-y-2 ml-4">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(donation.status)}
                    <Badge className={getStatusColor(donation.status)}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {donation.aiAnalysis && (
                    <div className="flex items-center space-x-1 text-xs text-purple-600">
                      <Sparkles className="h-3 w-3" />
                      <span>{Math.round(donation.aiAnalysis.categoryConfidence * 100)}% AI</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  {donation.quantity} items
                </span>
                <span className="capitalize">{donation.category}</span>
                <span className="capitalize">{donation.condition}</span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {donation.location}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created {donation.createdAt}
                  </span>
                  
                  {donationRequests.length > 0 && (
                    <span className="flex items-center text-blue-600">
                      <Users className="h-4 w-4 mr-1" />
                      {donationRequests.length} request{donationRequests.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {donation.status === 'pending' && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Requests Preview */}
              {donationRequests.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Requests:</h4>
                  <div className="space-y-2">
                    {donationRequests.slice(0, 2).map(request => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{request.organization}</div>
                          <div className="text-xs text-gray-600">
                            Requested {request.requestedQuantity} items • {request.urgencyLevel} priority
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <div className="text-xs text-green-600 font-medium">
                            {Math.round(request.aiMatchScore * 100)}% match
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Donations</h1>
            <p className="text-gray-600 mt-2">Track and manage your clothing donations</p>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link to="/donate">
              <Plus className="h-5 w-5 mr-2" />
              New Donation
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Donations</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalRequests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search donations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="outerwear">Outerwear</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="children">Children</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="requests">Active Requests ({stats.activeRequests})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-6">
              {filteredDonations.map(donation => (
                <DonationCard key={donation.id} donation={donation} />
              ))}
              
              {filteredDonations.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
                  <p className="text-gray-600 mb-4">
                    {donations.length === 0 
                      ? "You haven't created any donations yet." 
                      : "No donations match your current filters."}
                  </p>
                  {donations.length === 0 && (
                    <Button asChild>
                      <Link to="/donate">Create Your First Donation</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="space-y-6">
              {filteredDonations.filter(d => d.status === 'approved').map(donation => (
                <DonationCard key={donation.id} donation={donation} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-6">
              {filteredDonations.filter(d => d.status === 'pending').map(donation => (
                <DonationCard key={donation.id} donation={donation} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <div className="space-y-6">
              {requests.filter(r => r.status === 'pending').length > 0 ? (
                requests.filter(r => r.status === 'pending').map(request => {
                  const donation = donations.find(d => d.id === request.donationId);
                  return (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.organization}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              Requesting {request.requestedQuantity} items from "{donation?.title}"
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                              <Badge className={request.urgencyLevel === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {request.urgencyLevel} priority
                              </Badge>
                              <span>Match: {Math.round(request.aiMatchScore * 100)}%</span>
                              <span>Requested: {request.requestedAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active requests</h3>
                  <p className="text-gray-600">No one has requested your items yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyDonations;