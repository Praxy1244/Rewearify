import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, Package, Calendar, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { adminService } from '../../services';
import { toast } from 'sonner';

const ManageDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchDonations();
  }, []);
  
  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllDonations(); 
      
      if (response.success) {
        // Sort by risk score (descending) then date
        const sortedData = (response.data || []).sort((a, b) => {
           // Prioritize flagged items
           if (a.isFlagged !== b.isFlagged) return a.isFlagged ? -1 : 1;
           // Then by date
           return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setDonations(sortedData); 
      } else {
        setError('Failed to fetch donations');
        toast.error("Failed to load donations");
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError(err.message || 'Failed to fetch donations');
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = donations.filter(donation => {
    const donorName = donation.donor?.name || '';
    const donorEmail = donation.donor?.email || '';

    const matchesSearch = donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (donationId) => {
    try {
      const response = await adminService.moderateDonation(donationId, 'approve');
      
      if (response.success) {
        setDonations(prev => prev.map(donation => 
          donation._id === donationId 
            ? { ...donation, status: 'approved', isFlagged: false } // Clear flag on approval
            : donation
        ));
        toast.success("Donation Approved & Published");
        setSelectedDonation(null);
      } else {
        toast.error(response.message || "Failed to approve donation");
      }
    } catch (err) {
      console.error('Error approving donation:', err);
      toast.error("Failed to approve donation");
    }
  };

  const handleReject = async (donationId) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    
    try {
       const response = await adminService.moderateDonation(donationId, 'reject', rejectReason);
       
       if (response.success) {
         setDonations(prev => prev.map(donation => 
           donation._id === donationId 
            ? { ...donation, status: 'rejected', moderation: { ...donation.moderation, rejectionReason: rejectReason } }
            : donation
         ));
         setRejectReason('');
         toast.success("Donation Rejected");
         setSelectedDonation(null);
       } else {
         toast.error(response.message || "Failed to reject donation");     
       }
     } catch (err) {
       console.error('Error rejecting donation:', err);
       toast.error("Failed to reject donation");
     }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'matched': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 💡 NEW: Risk Score Badge Helper
  const getRiskBadge = (donation) => {
    // Use AI analysis risk score if available, or fallback to 0
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Donation Details Modal Content
  const DonationDetailsModal = ({ donation, onClose }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex justify-between items-center pr-8">
          <span>{donation.title}</span>
          {getRiskBadge(donation)}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        
        {/* 💡 NEW: Fraud/Risk Alert Box */}
        {(donation.isFlagged || (donation.aiAnalysis?.fraudScore > 0.4)) && (
           <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3">
             <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
             <div>
               <h4 className="font-semibold text-red-900 text-sm">AI Risk Alert</h4>
               <p className="text-red-700 text-sm">
                 {donation.flagReason || donation.aiAnalysis?.fraudScore > 0.7 ? "High probability of fraudulent activity." : "Potential anomalies detected."}
               </p>
               {donation.aiAnalysis?.fraudScore && (
                 <p className="text-xs text-red-600 mt-1">Confidence Score: {(donation.aiAnalysis.fraudScore * 100).toFixed(0)}%</p>
               )}
             </div>
           </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <img 
              src={donation.images?.[0]?.url || 'https://placehold.co/600x400/E2E8F0/4A5568?text=No+Image'} 
              alt={donation.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Donor</label>
              <p>{donation.donor?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{donation.donor?.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="flex gap-2 mt-1">
                <Badge className={getStatusColor(donation.status)}>
                  {donation.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Location</label>
              <p>{donation.location?.address || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Quantity</label>
            <p>{donation.quantity} items</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Condition</label>
            <p className="capitalize">{donation.condition}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Category</label>
            <p className="capitalize">{donation.category}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Description</label>
          <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{donation.description}</p>
        </div>

        {(donation.status === 'pending' || donation.status === 'flagged') && (
          <div className="flex space-x-3 pt-4 border-t">
            <Button onClick={() => handleApprove(donation._id)} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Approve & Publish
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Donation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Please provide a reason for rejecting this donation:</p>
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <Button 
                    onClick={() => handleReject(donation._id)} 
                    variant="destructive"
                    className="w-full"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </DialogContent>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Donations</h1>
          <p className="text-gray-600 mt-1">Review, approve, or reject incoming donations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
            {donations.filter(d => d.status === 'pending').length} Pending Review
          </Badge>
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            {donations.filter(d => d.isFlagged).length} Flagged
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by donor, email, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
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
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                          <img 
                            src={donation.images?.[0]?.url || 'https://placehold.co/40x40/E2E8F0/4A5568?text=Img'} 
                            alt={donation.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
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
                        {donation.status}
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
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={!!selectedDonation} onOpenChange={(open) => {
        if (!open) {
          setSelectedDonation(null);
          setRejectReason('');
        }
      }}>
        {selectedDonation && (
          <DonationDetailsModal 
            donation={selectedDonation} 
            onClose={() => setSelectedDonation(null)} 
          />
        )}
      </Dialog>
    </div>
  );
};

export default ManageDonations;