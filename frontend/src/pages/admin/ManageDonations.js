import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, Package, Calendar, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
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
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    fetchDonations();
  }, []);
  
  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllDonations(); 
      
      if (response.success) {
        const sortedData = (response.data || []).sort((a, b) => {
           if (a.isFlagged !== b.isFlagged) return a.isFlagged ? -1 : 1;
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
            ? { ...donation, status: 'approved', isFlagged: false }
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
         setRejectModalOpen(false);
         setSelectedDonation(null);
         
         toast.success("Donation Rejected");
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const DonationDetailsModal = ({ donation, onClose }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex justify-between items-center pr-8">
          <span>{donation.title}</span>
          {getRiskBadge(donation)}
        </DialogTitle>
        <DialogDescription>
          Review donation details and take appropriate action
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        
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
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(donation._id);
              }} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve & Publish
            </Button>
            
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
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

      {/* Main Donation Details Modal */}
      {/* Main Details Modal - HIDE when reject modal is open */}
{selectedDonation && !rejectModalOpen && (
  <Dialog open={true} onOpenChange={(open) => {
    if (!open) {
      setSelectedDonation(null);
      setRejectReason('');
    }
  }}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex justify-between items-center pr-8">
          <span>{selectedDonation.title}</span>
          {getRiskBadge(selectedDonation)}
        </DialogTitle>
        <DialogDescription>Review donation details and take action</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {(selectedDonation.isFlagged || (selectedDonation.aiAnalysis?.fraudScore > 0.4)) && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 text-sm">AI Risk Alert</h4>
              <p className="text-red-700 text-sm">High probability of fraudulent activity.</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <img 
            src={selectedDonation.images?.[0]?.url || 'https://placehold.co/600x400'} 
            alt={selectedDonation.title}
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Donor</label>
              <p>{selectedDonation.donor?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{selectedDonation.donor?.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <Badge className={getStatusColor(selectedDonation.status)}>{selectedDonation.status}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Quantity</label>
            <p>{selectedDonation.quantity} items</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Condition</label>
            <p className="capitalize">{selectedDonation.condition}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Category</label>
            <p className="capitalize">{selectedDonation.category}</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Description</label>
          <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{selectedDonation.description}</p>
        </div>
        {(selectedDonation.status === 'pending' || selectedDonation.status === 'flagged') && (
          <div className="flex space-x-3 pt-4 border-t">
            <Button onClick={() => handleApprove(selectedDonation._id)} className="flex-1 bg-green-600">
              <Check className="h-4 w-4 mr-2" />Approve & Publish
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1" 
              onClick={() => setRejectModalOpen(true)}
            >
              <X className="h-4 w-4 mr-2" />Reject
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
)}

{/* Reject Modal - ONLY show when rejectModalOpen is true */}
{rejectModalOpen && selectedDonation && (
  <div 
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        setRejectModalOpen(false);
        setRejectReason('');
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
        }}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </button>

      <h2 className="text-xl font-bold mb-2">Reject Donation</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please provide a reason for rejecting this donation
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
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (rejectReason.trim()) {
              await handleReject(selectedDonation._id, rejectReason);
            }
          }}
          disabled={!rejectReason.trim()}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          Confirm Rejection
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default ManageDonations;
