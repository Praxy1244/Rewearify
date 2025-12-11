import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  AlertTriangle, CheckCircle, Shield, Eye, ThumbsUp, ThumbsDown, Clock, ArrowLeft, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const FraudDetection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [stats, setStats] = useState({
    total: 0, flagged: 0, safe: 0, pending: 0, avgFraudScore: 0
  });

  useEffect(() => {
    fetchDonationsWithFraudCheck();
  }, []);

  const fetchDonationsWithFraudCheck = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Fetch pending donations
      const donationsRes = await fetch('http://localhost:5000/api/donations?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!donationsRes.ok) throw new Error('Failed to fetch donations');
      const donationsData = await donationsRes.json();
      const donationsList = donationsData.donations || donationsData.data || [];
      
      // 2. Run AI Check for each
      const donationsWithFraud = await Promise.all(
        donationsList.map(async (donation) => {
          try {
            // FIX: Use the Correct Route and Nested Payload
            const fraudRes = await fetch('http://localhost:5000/api/ai/fraud-check', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                donor_id: donation.donor?._id || "unknown",
                donation_data: {
                  quantity: donation.quantity,
                  condition: donation.condition,
                  category: donation.category,
                  description: donation.description,
                  location: donation.location || {}
                },
                donor_data: {
                  reliability_score: donation.donor?.statistics?.rating || 0.8,
                  past_donations: donation.donor?.statistics?.totalDonations || 0,
                  flagged: false
                },
                model_name: "random_forest"
              })
            });
            
            if (fraudRes.ok) {
              const resData = await fraudRes.json();
              const fraudData = resData.data || {};
              
              return {
                ...donation,
                fraudScore: fraudData.fraud_score || 0,
                fraudReason: (fraudData.fraud_flags || []).join(', ') || 'AI Analysis',
                isFlagged: fraudData.risk_level === 'high' || fraudData.is_suspicious,
                fraudFeatures: fraudData.analysis || {}
              };
            }
          } catch (err) {
            console.error('Fraud check failed:', err);
          }
          return { ...donation, fraudScore: 0, isFlagged: false, fraudReason: 'Analysis Failed' };
        })
      );
      
      setDonations(donationsWithFraud);
      calculateStats(donationsWithFraud);
      
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
    const safe = donationsList.filter(d => !d.isFlagged && d.fraudScore < 0.4).length;
    const pending = donationsList.filter(d => !d.isFlagged && d.fraudScore >= 0.4).length;
    const avgFraudScore = donationsList.reduce((sum, d) => sum + (d.fraudScore || 0), 0) / (total || 1);
    
    setStats({ total, flagged, safe, pending, avgFraudScore });
  };

  const handleApprove = async (donationId) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      // Using unflag route to ensure clean state transition
      const response = await fetch(`http://localhost:5000/api/donations/${donationId}/unflag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Manually approved by admin' })
      });
      
      if (response.ok) {
        toast.success('Donation approved successfully');
        setDonations(donations.filter(d => d._id !== donationId));
        setSelectedDonation(null);
      } else {
        toast.error('Failed to approve donation');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (donationId) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/donations/${donationId}/transition`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          toState: 'rejected',
          metadata: { reason: 'Flagged by fraud detection' }
        })
      });
      
      if (response.ok) {
        toast.success('Donation rejected');
        setDonations(donations.filter(d => d._id !== donationId));
        setSelectedDonation(null);
      } else {
        toast.error('Failed to reject donation');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getFraudBadge = (score, isFlagged) => {
    if (isFlagged || score > 0.7) {
      return <Badge className="bg-red-600">High Risk</Badge>;
    } else if (score > 0.4) {
      return <Badge className="bg-yellow-600">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-green-600">Low Risk</Badge>;
    }
  };

  const filteredDonations = donations.filter(donation => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'flagged') return donation.isFlagged;
    if (filterStatus === 'safe') return !donation.isFlagged && donation.fraudScore < 0.4;
    if (filterStatus === 'pending') return !donation.isFlagged && donation.fraudScore >= 0.4;
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin-dashboard')} className="mb-4 pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="text-blue-600" /> AI Fraud Detection
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-6 text-center"><p className="text-sm text-gray-600">Pending</p><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
          <Card className="bg-red-50 border-red-100"><CardContent className="p-6 text-center"><p className="text-sm text-red-700">High Risk</p><p className="text-3xl font-bold text-red-600">{stats.flagged}</p></CardContent></Card>
          <Card className="bg-yellow-50 border-yellow-100"><CardContent className="p-6 text-center"><p className="text-sm text-yellow-700">Medium Risk</p><p className="text-3xl font-bold text-yellow-600">{stats.pending}</p></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><p className="text-sm text-gray-600">Avg Score</p><p className="text-3xl font-bold">{(stats.avgFraudScore * 100).toFixed(1)}%</p></CardContent></Card>
        </div>

        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
            <TabsTrigger value="pending">Review</TabsTrigger>
            <TabsTrigger value="safe">Safe</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filteredDonations.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">No donations found.</Card>
            ) : (
              filteredDonations.map((donation) => (
                <Card 
                  key={donation._id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedDonation?._id === donation._id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedDonation(donation)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{donation.title}</h3>
                        <p className="text-sm text-gray-600">by {donation.donor?.name || 'Unknown'}</p>
                      </div>
                      {getFraudBadge(donation.fraudScore, donation.isFlagged)}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                      <span>{donation.category}</span>
                      <span>•</span>
                      <span>{donation.quantity} items</span>
                      <span>•</span>
                      <span>Score: {(donation.fraudScore * 100).toFixed(0)}%</span>
                    </div>
                    {donation.isFlagged && (
                      <div className="mt-3 bg-red-50 text-red-800 text-sm p-2 rounded flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4"/> {donation.fraudReason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedDonation ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{selectedDonation.title}</h4>
                    <p className="text-sm text-gray-600">{selectedDonation.description}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between mb-2 text-sm font-medium">
                      <span>Fraud Probability</span>
                      <span>{(selectedDonation.fraudScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${selectedDonation.fraudScore > 0.5 ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${selectedDonation.fraudScore * 100}%` }}></div>
                    </div>
                  </div>
                  {selectedDonation.fraudFeatures && (
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Risk Factors:</p>
                      <ul className="list-disc pl-5 text-gray-600">
                        {Object.entries(selectedDonation.fraudFeatures).map(([key, val]) => (
                          <li key={key}>{key}: {val}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="pt-4 flex gap-3">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedDonation._id)} disabled={processing}><ThumbsUp className="h-4 w-4 mr-2" /> Approve</Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedDonation._id)} disabled={processing}><ThumbsDown className="h-4 w-4 mr-2" /> Reject</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-64 flex items-center justify-center text-gray-400">Select a donation</Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudDetection;