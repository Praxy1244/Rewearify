import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  TrendingDown
} from 'lucide-react';
import { aiService } from '../../services/aiService';

const FraudDetectionWidget = ({ donorId = null, showBatchResults = false }) => {
  const [fraudData, setFraudData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mockDonorData = {
    DonorID: donorId || 'D001',
    Donor_Reliability: 0.75,
    Past_Donations: 12,
    Avg_Quantity_Claimed: 8.5,
    Avg_Quantity_Received_Ratio: 0.92,
    Avg_Fulfillment_Delay: 5.2,
    Num_Manual_Rejects: 1,
    Num_Flagged: 0,
    Feedback_Mean: 4.2
  };

  const runFraudDetection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For demo purposes, we'll simulate the AI response
      // In production, this would call: await aiService.detectFraud(mockDonorData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse = {
        donor_id: mockDonorData.DonorID,
        fraud_probability: 0.23,
        is_flagged: false,
        risk_level: 'Low',
        explanation: 'Good reliability score (0.75); Reasonable fulfillment delay (5.2 days); High quantity delivery ratio (0.92)',
        recommendation: 'Auto-approve'
      };
      
      setFraudData(mockResponse);
    } catch (err) {
      setError('Failed to run fraud detection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (donorId) {
      runFraudDetection();
    }
  }, [donorId]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'very high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'very high': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <span>Fraud Detection</span>
        </CardTitle>
        <Button 
          onClick={runFraudDetection} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Running AI fraud detection...</p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {fraudData && !loading && (
          <div className="space-y-4">
            {/* Risk Assessment */}
            <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Risk Assessment</h4>
                <Badge className={getRiskColor(fraudData.risk_level)}>
                  {getRiskIcon(fraudData.risk_level)}
                  <span className="ml-1">{fraudData.risk_level}</span>
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fraud Probability</span>
                  <span className="text-sm font-mono">
                    {(fraudData.fraud_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={fraudData.fraud_probability * 100} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Recommendation */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                {fraudData.is_flagged ? (
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                )}
                Recommendation
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>{fraudData.recommendation}</strong>
              </p>
              {fraudData.is_flagged && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This donor requires manual review before approval.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Explanation */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Analysis Details</h4>
              <p className="text-sm text-gray-700">
                {fraudData.explanation}
              </p>
            </div>

            {/* Donor Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Reliability Score</p>
                <p className="text-lg font-semibold">{mockDonorData.Donor_Reliability}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Past Donations</p>
                <p className="text-lg font-semibold">{mockDonorData.Past_Donations}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Avg Rating</p>
                <p className="text-lg font-semibold">{mockDonorData.Feedback_Mean}/5</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant={fraudData.is_flagged ? "destructive" : "default"}
                className="flex-1"
              >
                {fraudData.is_flagged ? 'Flag for Review' : 'Approve Donor'}
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Batch Results Summary */}
        {showBatchResults && (
          <div className="mt-6 p-4 border-t">
            <h4 className="font-semibold mb-3 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-purple-500" />
              Batch Analysis Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">847</p>
                <p className="text-xs text-gray-600">Low Risk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">23</p>
                <p className="text-xs text-gray-600">Medium Risk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">8</p>
                <p className="text-xs text-gray-600">High Risk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">2</p>
                <p className="text-xs text-gray-600">Flagged</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FraudDetectionWidget;