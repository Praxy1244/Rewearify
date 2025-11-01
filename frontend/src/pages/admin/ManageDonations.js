import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, Package, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { adminService } from '../../services';
import { toast } from 'sonner'; // Use sonner
import { useToast } from '../../hooks/use-toast';

const ManageDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to 'pending'
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { toast } = useToast();
  
  useEffect(() => {
    fetchDonations();
  }, []); // Load once on mount
  
  const fetchDonations = async () => {
    try {
      setLoading(true);
      // --- FIX: Call the correct service function ---
      const response = await adminService.getAllDonations({
        // We can add params here, like status, later
      }); 
      
      if (response.success) {
        // Data is at response.data (which is an array)
        setDonations(response.data || []); 
      } else {
        setError('Failed to fetch donations');
        toast({ title: "Error", description: "Failed to load donations", variant: "destructive" });
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
    // Safety check for donor object
    const donorName = donation.donor?.name || '';
    const donorEmail = donation.donor?.email || '';

    const matchesSearch = donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- FIX: Use the correct moderateDonation service ---
  const handleApprove = async (donationId) => {
    try {
      // Call the unified moderation function
      const response = await adminService.moderateDonation(donationId, 'approve');
      
      if (response.success) {
        // Update local state to reflect the change
        setDonations(prev => prev.map(donation => 
          donation._id === donationId 
            ? { ...donation, status: 'approved' } // Use _id from MongoDB
            : donation
        ));
        toast({ title: "Donation Approved", description: "The donation is now visible to recipients." });
        setSelectedDonation(null);
      } else {
        toast({ title: "Error", description: response.message || "Failed to approve donation", variant: "destructive" });
      }
    } catch (err) {
      console.error('Error approving donation:', err);
      toast({ title: "Error", description: "Failed to approve donation", variant: "destructive" });
    }
  };

  // --- FIX: Use the correct moderateDonation service ---
  const handleReject = async (donationId) => {
    if (!rejectReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    
    try {
       // Call the unified moderation function
       const response = await adminService.moderateDonation(donationId, 'reject', rejectReason);
       
       if (response.success) {
         // Update local state
         setDonations(prev => prev.map(donation => 
           donation._id === donationId 
            ? { ...donation, status: 'rejected', moderation: { ...donation.moderation, rejectionReason } }
            : donation
         ));
         setRejectReason('');
         toast({ title: "Donation Rejected", description: "The donation has been rejected." });
         setSelectedDonation(null); // Close modal
       } else {

         toast({ title: "Error", description: response.message || "Failed to reject donation", variant: "destructive" });     

       }
     } catch (err) {
       console.error('Error rejecting donation:', err);
       toast({ title: "Error", description: "Failed to reject donation", variant: "destructive" });
     }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'matched': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // --- RENDER FUNCTIONS ---

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading donations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Donations</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDonations} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // This is the modal component
  const DonationDetailsModal = ({ donation, onClose }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{donation.title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
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
              <Badge className={getStatusColor(donation.status)}>
                {donation.status}
              </Badge>
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
            <p>{donation.condition}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Category</label>
            <p className="capitalize">{donation.category} / {donation.subcategory}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Description</label>
          <p className="mt-1">{donation.description}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Sizes</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {donation.sizes?.map((s, index) => (
              <Badge key={index} variant="outline">{s.size} (Qty: {s.quantity})</Badge>
            ))}
          </div>
        </div>

        {donation.status === 'pending' && (
          <div className="flex space-x-3 pt-4 border-t">
            <Button onClick={() => handleApprove(donation._id)} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Approve
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
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleReject(donation._id)} 
                      variant="destructive"
                      className="flex-1"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {donation.status === 'rejected' && donation.moderation?.rejectionReason && (
          <div className="bg-red-50 p-3 rounded-lg">
            <label className="text-sm font-medium text-red-800">Rejection Reason</label>
            <p className="text-red-700 mt-1">{donation.moderation.rejectionReason}</p>
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
          <p className="text-gray-600 mt-1">Review and manage all donation submissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-yellow-600">
            {donations.filter(d => d.status === 'pending').length} Pending Review
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{donations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{donations.filter(d => d.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{donations.filter(d => d.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{donations.filter(d => d.status === 'rejected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by donor name, email, or item title..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
                <TableHead>Status</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No donations found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDonations.map((donation) => (
                  <TableRow key={donation._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={donation.images?.[0]?.url || 'https://placehold.co/40x40/E2E8F0/4A5568?text=Img'} 
                          alt={donation.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{donation.title}</p>
                          <p className="text-sm text-gray-500 capitalize">{donation.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{donation.donor?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{donation.donor?.email || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(donation.status)}>
                        {donation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(donation.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{donation.quantity} items</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedDonation(donation)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {donation.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(donation._id)} className="bg-green-600 hover:bg-green-700">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setSelectedDonation(donation)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
          setRejectReason(''); // Clear reason on close
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