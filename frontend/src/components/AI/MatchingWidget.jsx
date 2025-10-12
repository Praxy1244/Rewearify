import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Target, 
  MapPin, 
  Clock, 
  Heart, 
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { aiService } from '../../services/aiService';

const MatchingWidget = ({ donationId = null, showTopMatches = true }) => {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mockDonationData = {
    id: donationId || 'DON001',
    itemType: 'Winter Jacket',
    quantity: 5,
    location: 'Mumbai',
    season: 'Winter',
    donorName: 'John Doe'
  };

  const runMatching = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For demo purposes, we'll simulate the AI response
      // In production: await aiService.getMatches(donationId, 5);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockMatches = [
        {
          NGO_ID: 'NGO001',
          ngoName: 'Hope Foundation',
          Match_Score: 0.94,
          Distance_km: 3.2,
          Explanation: 'Perfect clothing type match; Very close proximity; NGO has urgent need',
          urgency: 'High',
          acceptanceRate: 0.96,
          capacity: 85,
          cause: 'Children Welfare'
        },
        {
          NGO_ID: 'NGO002',
          ngoName: 'Care & Share',
          Match_Score: 0.87,
          Distance_km: 8.5,
          Explanation: 'Good clothing type compatibility; Reasonable distance; High NGO acceptance rate',
          urgency: 'Medium',
          acceptanceRate: 0.91,
          capacity: 70,
          cause: 'Homeless Support'
        },
        {
          NGO_ID: 'NGO003',
          ngoName: 'Community Aid',
          Match_Score: 0.82,
          Distance_km: 12.1,
          Explanation: 'Seasonal need alignment; Standard match criteria met',
          urgency: 'Low',
          acceptanceRate: 0.88,
          capacity: 60,
          cause: 'General Welfare'
        }
      ];
      
      setMatches(mockMatches);
    } catch (err) {
      setError('Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (donationId) {
      runMatching();
    }
  }, [donationId]);

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-green-500" />
          <span>AI Matching</span>
        </CardTitle>
        <Button 
          onClick={runMatching} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Target className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Matching...' : 'Find Matches'}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Donation Info */}
        <div className="p-4 bg-blue-50 rounded-lg border">
          <h4 className="font-semibold mb-2">Donation Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Item:</span>
              <p className="font-medium">{mockDonationData.itemType}</p>
            </div>
            <div>
              <span className="text-gray-600">Quantity:</span>
              <p className="font-medium">{mockDonationData.quantity}</p>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <p className="font-medium">{mockDonationData.location}</p>
            </div>
            <div>
              <span className="text-gray-600">Season:</span>
              <p className="font-medium">{mockDonationData.season}</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Finding best NGO matches...</p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <Target className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {matches && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Top Matches Found</h4>
              <Badge variant="secondary">{matches.length} NGOs</Badge>
            </div>

            <div className="space-y-3">
              {matches.map((match, index) => (
                <div key={match.NGO_ID} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold">{match.ngoName}</h5>
                        <Badge className={getUrgencyColor(match.urgency)}>
                          {match.urgency} Priority
                        </Badge>
                        {index === 0 && (
                          <Badge variant="default" className="bg-green-500">
                            <Star className="h-3 w-3 mr-1" />
                            Best Match
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{match.cause}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getMatchScoreColor(match.Match_Score)}`}>
                        {(match.Match_Score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{match.Distance_km}km away</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{(match.acceptanceRate * 100).toFixed(0)}% acceptance</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{match.capacity}% capacity</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{match.Explanation}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Match Donation
                    </Button>
                    <Button size="sm" variant="outline">
                      View NGO
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Matching Statistics */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3">Matching Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {matches.length > 0 ? (matches[0].Match_Score * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-xs text-gray-600">Best Match</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {matches.length > 0 ? matches[0].Distance_km.toFixed(1) : 0}km
                  </p>
                  <p className="text-xs text-gray-600">Nearest NGO</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {matches.filter(m => m.urgency === 'High').length}
                  </p>
                  <p className="text-xs text-gray-600">Urgent Needs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">
                    {matches.length > 0 ? Math.round(matches.reduce((acc, m) => acc + m.acceptanceRate, 0) / matches.length * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-600">Avg Acceptance</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchingWidget;