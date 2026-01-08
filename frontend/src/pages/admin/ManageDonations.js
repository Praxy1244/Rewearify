import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, Package, Calendar, AlertTriangle, ShieldAlert, ShieldCheck, Info, Loader2, Gift, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { adminService } from '../../services';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import api from '../../lib/api';

const ManageDonations = () => {
  // State for Donations
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donationSearchTerm, setDonationSearchTerm] = useState('');
  const [donationStatusFilter, setDonationStatusFilter] = useState('all'); // ✅ FIXED
  const [selectedDonation, setSelectedDonation] = useState(null);
  
  // State for Requests
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all'); // ✅ FIXED
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Shared states
  const [activeTab, setActiveTab] = useState('donations');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [rejectType, setRejectType] = useState(null);

  useEffect(() => {
    fetchDonations();
    fetchRequests();
  }, []);
  
  // ==================== DONATIONS ====================
  const fetchDonations = async () => {
    try {
      setDonationsLoading(true);
      const response = await adminService.getAllDonations(); 
      
      if (response.success) {
        const sortedData = (response.data || []).sort((a, b) => {
           if (a.isFlagged !== b.isFlagged) return a.isFlagged ? -1 : 1;
           return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setDonations(sortedData); 
      } else {
        toast.error("Failed to load donations");
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      toast.error('Failed to load donations');
    } finally {
      setDonationsLoading(false);
    }
  };

  const filteredDonations = donations.filter(donation => {
    const donorName = donation.donor?.name || '';
    const donorEmail = donation.donor?.email || '';

    const matchesSearch = donorName.toLowerCase().includes(donationSearchTerm.toLowerCase()) ||
                         donorEmail.toLowerCase().includes(donationSearchTerm.toLowerCase()) ||
                         donation.title?.toLowerCase().includes(donationSearchTerm.toLowerCase());
    const matchesStatus = donationStatusFilter === 'all' || donation.status === donationStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveDonation = async (donationId) => {
    setProcessing(donationId);
    try {
      console.log(`✅ Admin approving donation ${donationId}...`);
      
      const response = await api.put(`/donations/${donationId}/admin-approve`);
      
      // ✅ FIXED: Check response structure properly
      if (response.data && response.data.success) {
        const notifiedNGO = response.data.data?.notifiedNGO;
        
        // ✅ FIXED: Update state immediately
        setDonations(prev => prev.map(donation => 
          donation._id === donationId 
            ? { ...donation, status: 'approved', isFlagged: false }
            : donation
        ));
        
        if (notifiedNGO) {
          toast.success(`Donation approved! ${notifiedNGO.organization?.name || notifiedNGO.name} has been notified.`);
        } else {
          toast.success("Donation approved successfully!");
        }
        
        // ✅ FIXED: Close modal immediately
        setSelectedDonation(null);
      } else {
        toast.error(response.data?.message || "Failed to approve donation");
      }
    } catch (err) {
      console.error('❌ Error approving donation:', err);
      toast.error(err.response?.data?.message || "Failed to approve donation");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectDonation = async (donationId) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    
    setProcessing(donationId);
    try {
       const response = await adminService.moderateDonation(donationId, 'reject', rejectReason);
       
       // ✅ FIXED: Check response properly
       if (response && response.success) {
         // ✅ FIXED: Update state immediately
         setDonations(prev => prev.map(donation => 
           donation._id === donationId 
            ? { ...donation, status: 'rejected', moderation: { ...donation.moderation, rejectionReason: rejectReason } }
            : donation
         ));
         
         // ✅ FIXED: Close modals and reset state
         setRejectReason('');
         setRejectModalOpen(false);
         setSelectedDonation(null);
         setRejectType(null);
         
         toast.success("Donation Rejected");
       } else {
         toast.error(response?.message || "Failed to reject donation");     
       }
     } catch (err) {
       console.error('Error rejecting donation:', err);
       toast.error("Failed to reject donation");
     } finally {
       setProcessing(null);
     }
  };

  // ==================== REQUESTS ====================
  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      
      const response = await api.get('/requests?limit=100');
      
      let requestsData = [];
      
      if (response.data && response.data.data) {
        requestsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        requestsData = response.data;
      }
      
      const sortedData = requestsData.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setRequests(sortedData);
      
    } catch (err) {
      console.error('❌ Error fetching requests:', err);
      toast.error('Failed to load requests');
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const requesterName = request.requester?.name || request.requester?.organization?.name || '';
    const requesterEmail = request.requester?.email || '';

    const matchesSearch = requesterName.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                         requesterEmail.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                         request.title?.toLowerCase().includes(requestSearchTerm.toLowerCase());
    const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveRequest = async (requestId) => {
    setProcessing(requestId);
    try {
      console.log(`✅ Admin approving request ${requestId}...`);
      
      const response = await api.put(`/requests/${requestId}`, {
        status: 'active'
      });
      
      // ✅ FIXED: Check response structure
      if (response.data && (response.data.success || response.data.data)) {
        // ✅ FIXED: Update state immediately
        setRequests(prev => prev.map(request => 
          request._id === requestId 
            ? { ...request, status: 'active' }
            : request
        ));
        
        toast.success("Request approved and published!");
        
        // ✅ FIXED: Close modal immediately
        setSelectedRequest(null);
      } else {
        toast.error(response.data?.message || "Failed to approve request");
      }
    } catch (err) {
      console.error('❌ Error approving request:', err);
      toast.error(err.response?.data?.message || "Failed to approve request");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    
    setProcessing(requestId);
    try {
      const response = await api.put(`/requests/${requestId}`, {
        status: 'rejected',
        rejectionReason: rejectReason
      });
      
      // ✅ FIXED: Check response structure
      if (response.data && (response.data.success || response.data.data)) {
        // ✅ FIXED: Update state immediately
        setRequests(prev => prev.map(request => 
          request._id === requestId 
            ? { ...request, status: 'rejected', rejectionReason: rejectReason }
            : request
        ));
        
        // ✅ FIXED: Close modals and reset state
        setRejectReason('');
        setRejectModalOpen(false);
        setSelectedRequest(null);
        setRejectType(null);
        
        toast.success("Request Rejected");
      } else {
        toast.error(response.data?.message || "Failed to reject request");     
      }
    } catch (err) {
      console.error('❌ Error rejecting request:', err);
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessing(null);
    }
  };

  // ==================== SHARED FUNCTIONS ====================
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'accepted_by_ngo': return 'bg-blue-100 text-blue-800';
      case 'pickup_scheduled': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'matched': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200';
      case 'active': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskBadge = (donation) => {
    const score = donation.aiAnalysis?.fraudScore || donation.riskScore || 0;
    const isFlagged = donation.isFlagged || donation.status === 'flagged';

    if (isFlagged || score > 0.7) {
      return <Badge variant="destructive" className="flex gap-1"><ShieldAlert className="w-3 h-3" /> High Risk</Badge>;
    }
    if (score > 0.4) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 flex gap-1"><AlertTriangle className="w-3 h-3" /> Medium</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-200 flex gap-1"><ShieldCheck className="w-3 h-3" /> Verified</Badge>;
  };

  const getUrgencyBadge = (request) => {
    if (request.urgency === 'critical') {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (request.urgency === 'high') {
      return <Badge className="bg-orange-500">High</Badge>;
    }
    if (request.urgency === 'medium') {
      return <Badge variant="secondary">Medium</Badge>;
    }
    return <Badge variant="outline">Low</Badge>;
  };

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moderate Submissions</h1>
          <p className="text-gray-600 mt-1">Review and approve donations and requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 flex gap-1">
            <Package className="w-3 h-3" />
            {donations.filter(d => d.status === 'pending').length} Pending Donations
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 flex gap-1">
            <Users className="w-3 h-3" />
            {requests.filter(r => r.status === 'pending').length} Pending Requests
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="donations" className="flex gap-2">
            <Package className="h-4 w-4" />
            Donations ({filteredDonations.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex gap-2">
            <Users className="h-4 w-4" />
            Requests ({filteredRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* ==================== DONATIONS TAB ==================== */}
        <TabsContent value="donations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by donor, email, or title..."
                      value={donationSearchTerm}
                      onChange={(e) => setDonationSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={donationStatusFilter} onValueChange={setDonationStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="accepted_by_ngo">Accepted by NGO</SelectItem>
                    <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Donations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Donations ({filteredDonations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {donationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-32 text-gray-500">
                          No donations found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDonations.map((donation) => (
                        <TableRow key={donation._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 border-2 border-gray-200">
                                <AvatarImage 
                                  src={donation.images?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(donation.title || 'Item')}&background=4F46E5&color=fff&size=200`}
                                  alt={donation.title} 
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-700">
                                  {donation.title?.charAt(0)?.toUpperCase() || 'D'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{donation.title}</p>
                                <p className="text-xs text-gray-500 capitalize">{donation.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{donation.donor?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{donation.donor?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRiskBadge(donation)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(donation.status)}>
                              {donation.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedDonation(donation)}>
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== REQUESTS TAB ==================== */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by requester, email, or title..."
                      value={requestSearchTerm}
                      onChange={(e) => setRequestSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_donor">Pending Donor</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Requester (NGO)</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-32 text-gray-500">
                          No requests found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 border-2 border-blue-200">
                                <AvatarImage 
                                  src={request.requester?.profile?.profilePicture?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.requester?.organization?.name || request.requester?.name || 'NGO')}&background=10B981&color=fff&size=200`}
                                  alt={request.requester?.organization?.name || 'NGO'} 
                                />
                                <AvatarFallback className="bg-green-100 text-green-700">
                                  {(request.requester?.organization?.name || request.requester?.name)?.charAt(0)?.toUpperCase() || 'N'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{request.title}</p>
                                <p className="text-xs text-gray-500 capitalize">{request.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{request.requester?.organization?.name || request.requester?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{request.requester?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getUrgencyBadge(request)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(request)}>
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== DONATION DETAILS MODAL ==================== */}
      {selectedDonation && !rejectModalOpen && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) {
            setSelectedDonation(null);
            setRejectReason('');
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center pr-8">
                <span>{selectedDonation.title}</span>
                {getRiskBadge(selectedDonation)}
              </DialogTitle>
              <DialogDescription>Review donation details and take action</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* AI Risk Alert */}
              {(selectedDonation.isFlagged || (selectedDonation.aiAnalysis?.fraudScore > 0.4)) && (
                <Alert className="bg-red-50 border-red-300">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <AlertDescription>
                    <div>
                      <h4 className="font-semibold text-red-900 text-sm">AI Risk Alert</h4>
                      <p className="text-red-700 text-sm">
                        {selectedDonation.flagReason || "High probability of fraudulent activity detected."}
                      </p>
                      {selectedDonation.aiAnalysis?.fraudScore && (
                        <p className="text-xs text-red-600 mt-1">
                          Confidence Score: {(selectedDonation.aiAnalysis.fraudScore * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Targeted NGO Display */}
              {selectedDonation.preferences?.preferredRecipients && 
               selectedDonation.preferences.preferredRecipients.length > 0 && (
                <Alert className="bg-blue-50 border-blue-300">
                  <Info className="h-5 w-5 text-blue-600" />
                  <AlertDescription>
                    <div className="text-blue-900">
                      <p className="font-bold text-base mb-2 flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Donor Selected a Specific NGO
                      </p>
                      {selectedDonation.preferences.preferredRecipients.map((ngo, idx) => (
                        <div key={idx} className="space-y-1 text-sm mb-2">
                          <p>
                            <strong>NGO Name:</strong> {ngo.organization?.name || ngo.name}
                          </p>
                          <p>
                            <strong>Location:</strong> {ngo.location?.city}, {ngo.location?.state}
                          </p>
                          <p>
                            <strong>Email:</strong> {ngo.email}
                          </p>
                        </div>
                      ))}
                      <p className="mt-3 text-xs bg-blue-100 p-2 rounded">
                        ℹ️ <strong>Note:</strong> Upon approval, this NGO will be notified immediately and can accept the donation.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Images & Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src={selectedDonation.images?.[0]?.url || 'https://placehold.co/600x400/E2E8F0/4A5568?text=No+Image'} 
                  alt={selectedDonation.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Donor</label>
                    <p className="font-semibold">{selectedDonation.donor?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{selectedDonation.donor?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedDonation.status)}>
                        {selectedDonation.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-sm">{selectedDonation.location?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="font-semibold">{selectedDonation.quantity} items</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Condition</label>
                  <p className="font-semibold capitalize">{selectedDonation.condition}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="font-semibold capitalize">{selectedDonation.category}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedDonation.description}</p>
              </div>

              {/* Action Buttons */}
              {(selectedDonation.status === 'pending' || selectedDonation.status === 'flagged') && (
                <div className="flex space-x-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleApproveDonation(selectedDonation._id)} 
                    disabled={processing === selectedDonation._id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing === selectedDonation._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve & {selectedDonation.preferences?.preferredRecipients?.length > 0 ? 'Notify NGO' : 'Publish'}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    disabled={processing === selectedDonation._id}
                    onClick={() => {
                      setRejectType('donation');
                      setRejectModalOpen(true);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================== REQUEST DETAILS MODAL ==================== */}
      {selectedRequest && !rejectModalOpen && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setRejectReason('');
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center pr-8">
                <span>{selectedRequest.title}</span>
                {getUrgencyBadge(selectedRequest)}
              </DialogTitle>
              <DialogDescription>Review request details and take action</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Requester Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-green-300">
                      <AvatarImage 
                        src={selectedRequest.requester?.profile?.profilePicture?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRequest.requester?.organization?.name || 'NGO')}&background=10B981&color=fff`}
                        alt={selectedRequest.requester?.organization?.name} 
                      />
                      <AvatarFallback>
                        {selectedRequest.requester?.organization?.name?.charAt(0)?.toUpperCase() || 'N'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{selectedRequest.requester?.organization?.name || selectedRequest.requester?.name}</p>
                      <p className="text-sm text-gray-600">{selectedRequest.requester?.email}</p>
                      <p className="text-xs text-gray-500">{selectedRequest.requester?.location?.city}, {selectedRequest.requester?.location?.state}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity Needed</label>
                  <p className="font-semibold">{selectedRequest.quantity || selectedRequest.quantityNeeded} items</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="font-semibold capitalize">{selectedRequest.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Urgency</label>
                  <div className="mt-1">
                    {getUrgencyBadge(selectedRequest)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedRequest.description}</p>
              </div>

              {/* Purpose */}
              {selectedRequest.purpose && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Purpose</label>
                  <p className="mt-1 p-3 bg-blue-50 rounded text-sm">{selectedRequest.purpose}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleApproveRequest(selectedRequest._id)} 
                    disabled={processing === selectedRequest._id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing === selectedRequest._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve Request
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    disabled={processing === selectedRequest._id}
                    onClick={() => {
                      setRejectType('request');
                      setRejectModalOpen(true);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================== REJECT MODAL (SHARED) ==================== */}
      {rejectModalOpen && (selectedDonation || selectedRequest) && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRejectModalOpen(false);
              setRejectReason('');
              setRejectType(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setRejectModalOpen(false);
                setRejectReason('');
                setRejectType(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-2">
              Reject {rejectType === 'donation' ? 'Donation' : 'Request'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this {rejectType}
            </p>
            
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectReason('');
                  setRejectType(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (rejectReason.trim()) {
                    if (rejectType === 'donation' && selectedDonation) {
                      await handleRejectDonation(selectedDonation._id);
                    } else if (rejectType === 'request' && selectedRequest) {
                      await handleRejectRequest(selectedRequest._id);
                    }
                  }
                }}
                disabled={!rejectReason.trim() || processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDonations;
