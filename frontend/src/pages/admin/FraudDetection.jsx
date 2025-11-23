import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield, 
  TrendingUp,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ArrowLeft,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const FraudDetection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all'); // all, flagged, safe, pending
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    flagged: 0,
    safe: 0,
    pending: 0,
    avgFraudScore: 0
  });

  useEffect(() => {
    fetchDonationsWithFraudCheck();
  }, []);

  const fetchDonationsWithFraudCheck = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all donations (pending approval)
      const donationsRes = await fetch('http://localhost:5000/api/donations?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!donationsRes.ok) throw new Error('Failed to fetch donations');
      
      const donationsData = await donationsRes.json();
      const donationsList = donationsData.donations || donationsData.data || donationsData || [];
      
      // Get fraud scores from AI service
      const donationsWithFraud = await Promise.all(
        donationsList.map(async (donation) => {
          try {
            const fraudRes = await fetch('http://localhost:8000/api/fraud/check', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                donation_id: donation._id,
                title: donation.title,
                description: donation.description,
                quantity: donation.quantity,
                category: donation.category,
                donor_id: donation.donor?._id || donation.donor,
                location: donation.location?.city || 'Unknown'
              })
            });
            
            if (fraudRes.ok) {
              const fraudData = await fraudRes.json();
              return {
                ...donation,
                fraudScore: fraudData.fraud_score || 0,
                fraudReason: fraudData.reason || '',
                isFlagged: fraudData.is_fraud || false,
                fraudFeatures: fraudData.features || {}
              };
            }
          } catch (err) {
            console.error('Fraud check failed for donation:', donation._id, err);
          }
          
          // Default if AI service fails
          return {
            ...donation,
            fraudScore: 0,
            fraudReason: 'Not analyzed',
            isFlagged: false,
            fraudFeatures: {}
          };
        })
      );
      
      setDonations(donationsWithFraud);
      calculateStats(donationsWithFraud);
      console.log('Donations with fraud scores loaded:', donationsWithFraud.length);
      
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (donationsList) => {
    const total = donationsList.length;
    const flagged = donationsList.filter(d => d.isFlagged).length;
    const safe = donationsList.filter(d => !d.isFlagged && d.fraudScore < 0.3).length;
    const pending = donationsList.filter(d => !d.isFlagged && d.fraudScore >= 0.3).length;
    const avgFraudScore = donationsList.reduce((sum, d) => sum + (d.fraudScore || 0), 0) / (total || 1);
    
    setStats({ total, flagged, safe, pending, avgFraudScore });
  };

  const handleApprove = async (donationId) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/donations/${donationId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Donation approved successfully');
        // Remove from list
        setDonations(donations.filter(d => d._id !== donationId));
        setSelectedDonation(null);
      } else {
        toast.error('Failed to approve donation');
      }
    } catch (error) {
      console.error('Error approving donation:', error);
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (donationId) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/donations/${donationId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Flagged by fraud detection' })
      });
      
      if (response.ok) {
        toast.success('Donation rejected');
        setDonations(donations.filter(d => d._id !== donationId));
        setSelectedDonation(null);
      } else {
        toast.error('Failed to reject donation');
      }
    } catch (error) {
      console.error('Error rejecting donation:', error);
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getFraudBadge = (score, isFlagged) => {
    if (isFlagged || score > 0.7) {
      return <Badge className="bg-red-600">High Risk</Badge>;
    } else if (score > 0.3) {
      return <Badge className="bg-yellow-600">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-green-600">Low Risk</Badge>;
    }
  };

  const filteredDonations = donations.filter(donation => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'flagged') return donation.isFlagged;
    if (filterStatus === 'safe') return !donation.isFlagged && donation.fraudScore < 0.3;
    if (filterStatus === 'pending') return !donation.isFlagged && donation.fraudScore >= 0.3;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing donations for fraud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="text-blue-600" />
            AI Fraud Detection
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered analysis of donation submissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-red-700">High Risk</p>
                <p className="text-3xl font-bold text-red-600">{stats.flagged}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-yellow-700">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-green-700">Low Risk</p>
                <p className="text-3xl font-bold text-green-600">{stats.safe}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Fraud Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats.avgFraudScore * 100).toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="flagged">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Flagged ({stats.flagged})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  <Clock className="h-4 w-4 mr-2" />
                  Review ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="safe">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Safe ({stats.safe})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Donations List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List View */}
          <div className="lg:col-span-2 space-y-4">
            {filteredDonations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No donations to review</p>
                </CardContent>
              </Card>
            ) : (
              filteredDonations.map((donation) => (
                <Card 
                  key={donation._id}
                  className={`cursor-pointer transition-shadow hover:shadow-lg ${
                    selectedDonation?._id === donation._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedDonation(donation)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{donation.title}</h3>
                        <p className="text-sm text-gray-600">
                          by {donation.donor?.name || 'Unknown'}
                        </p>
                      </div>
                      {getFraudBadge(donation.fraudScore, donation.isFlagged)}
                    </div>

                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {donation.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{donation.category}</span>
                      <span>•</span>
                      <span>{donation.quantity} items</span>
                      <span>•</span>
                      <span>Score: {(donation.fraudScore * 100).toFixed(1)}%</span>
                    </div>

                    {donation.isFlagged && (
                      <Alert className="mt-3 bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {donation.fraudReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Detail View */}
          <div className="lg:col-span-1">
            {selectedDonation ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Fraud Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedDonation.title}</h4>
                    <p className="text-sm text-gray-600">{selectedDonation.description}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Fraud Score</span>
                      {getFraudBadge(selectedDonation.fraudScore, selectedDonation.isFlagged)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedDonation.fraudScore > 0.7 ? 'bg-red-600' :
                          selectedDonation.fraudScore > 0.3 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${selectedDonation.fraudScore * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedDonation.fraudScore * 100).toFixed(2)}% probability of fraud
                    </p>
                  </div>

                  {selectedDonation.fraudReason && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900 mb-1">
                        <Info className="h-4 w-4 inline mr-1" />
                        Reason
                      </p>
                      <p className="text-sm text-yellow-800">{selectedDonation.fraudReason}</p>
                    </div>
                  )}

                  {selectedDonation.fraudFeatures && Object.keys(selectedDonation.fraudFeatures).length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">AI Analysis Factors:</h5>
                      <div className="space-y-1">
                        {Object.entries(selectedDonation.fraudFeatures).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedDonation._id)}
                      disabled={processing}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approve Donation
                    </Button>
                    <Button 
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleReject(selectedDonation._id)}
                      disabled={processing}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Reject Donation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Select a donation to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudDetection;
