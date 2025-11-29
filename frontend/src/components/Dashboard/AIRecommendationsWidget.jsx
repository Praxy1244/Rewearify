import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Sparkles, TrendingUp, MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIRecommendationsWidget = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data.recommendations)) {
        setRecommendations(data.data.recommendations.slice(0, 3));
      } else {
        setRecommendations([]);
      }
      
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // 💡 NEW: Handle navigation with state
  const handleDonateToNgo = (ngo) => {
    navigate('/donor/donate', { 
      state: { 
        targetNgo: {
          id: ngo._id || ngo.id,
          name: ngo.name,
          city: ngo.city
        } 
      } 
    });
    setSelectedNgo(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Recommended NGOs for You
          </CardTitle>
          <p className="text-sm text-gray-600">Based on your donation history and preferences</p>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((ngo, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{ngo.name}</h4>
                    <Badge className="bg-green-600">
                      {(ngo.recommendation_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ngo.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Trust: {ngo.trust_score}/5
                    </span>
                  </div>

                  {ngo.accepted_clothing_types && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ngo.accepted_clothing_types.split(';').slice(0, 3).map((type, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => setSelectedNgo(ngo)}
                  >
                    View Their Needs
                  </Button>
                </div>
              ))}

              <Button 
                variant="ghost" 
                className="w-full text-purple-600 hover:text-purple-700"
                onClick={() => navigate('/donor/ai-insights')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View All AI Insights
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Make a few donations to get personalized recommendations!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NGO Details Modal */}
      <Dialog open={!!selectedNgo} onOpenChange={(open) => !open && setSelectedNgo(null)}>
        <DialogContent className="max-w-md">
          {selectedNgo && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  {selectedNgo.name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {selectedNgo.city}, {selectedNgo.state || 'India'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Why this match?</h4>
                  <p className="text-sm text-green-700">{selectedNgo.recommendation_reason}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Accepted Items:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNgo.accepted_clothing_types?.split(';').map((type, i) => (
                      <Badge key={i} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{selectedNgo.trust_score}/5</div>
                      <div className="text-xs text-gray-500">Trust Score</div>
                   </div>
                   <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">{selectedNgo.impact_score}/5</div>
                      <div className="text-xs text-gray-500">Impact Score</div>
                   </div>
                </div>
              </div>

              <div className="flex gap-3">
                {/* 💡 FIX: Use handleDonateToNgo instead of generic navigate */}
                <Button className="flex-1" onClick={() => handleDonateToNgo(selectedNgo)}>
                  Donate Now
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setSelectedNgo(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIRecommendationsWidget;