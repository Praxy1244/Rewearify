import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Brain, Sparkles } from 'lucide-react';
import aiService from '../../services/aiService';

const AIPredictionWidget = ({ userId, userType }) => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  
  const fetchPredictions = async () => {
    setLoading(true);
    try {
      // Different predictions based on user type
      let data;
      if (userType === 'donor') {
        data = await aiService.getDemandPrediction();
      } else if (userType === 'recipient') {
        data = await aiService.getMatchingSuggestions(userId);
      } else {
        data = await aiService.getInsights();
      }
      setPredictions(data.data);
    } catch (error) {
      console.error("Error fetching AI predictions:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPredictions();
  }, [userId, userType]);
  
  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">AI is analyzing your data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-lg flex items-center">
          <div className="bg-primary/20 p-1.5 rounded-full mr-2">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {predictions ? (
          <div className="space-y-4">
            {userType === 'donor' && predictions.topCategories && (
              <div>
                <h4 className="font-medium mb-2">Most Needed Items</h4>
                <div className="space-y-2">
                  {predictions.topCategories.slice(0, 3).map((category, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center">
                      <Sparkles className="h-4 w-4 text-primary mr-2" />
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-muted-foreground">High demand in your area</div>
                      </div>
                      <div className="text-sm font-medium">{category.demand}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {userType === 'recipient' && predictions.recommendations && (
              <div>
                <h4 className="font-medium mb-2">Recommended For You</h4>
                <div className="space-y-2">
                  {predictions.recommendations.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center">
                      <Sparkles className="h-4 w-4 text-primary mr-2" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.match}% match to your needs</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {predictions.insights && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <h4 className="font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-primary" />
                  AI Insight
                </h4>
                <p className="text-sm mt-2">{predictions.insights}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <Button variant="default" onClick={fetchPredictions} className="flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPredictionWidget;