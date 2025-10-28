import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, TrendingUp, AlertTriangle, Users, BarChart } from 'lucide-react';
import aiService from '../../services/aiService';

const AIInsightsCard = ({ type = 'donation', id }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      switch (type) {
        case 'donation':
          data = await aiService.getMatchingSuggestions(id);
          break;
        case 'fraud':
          data = await aiService.performFraudDetection({ id });
          break;
        case 'demand':
          data = await aiService.getDemandPrediction();
          break;
        default:
          data = await aiService.getInsights();
      }
      setInsights(data.data);
    } catch (err) {
      setError('Failed to load AI insights. Please try again.');
      console.error('AI Insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id || type === 'demand') {
      fetchInsights();
    }
  }, [id, type]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">AI is analyzing data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchInsights}>
            Try Again
          </Button>
        </div>
      );
    }

    if (!insights) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Button variant="default" onClick={fetchInsights}>
            Generate AI Insights
          </Button>
        </div>
      );
    }

    // Render different content based on insight type
    switch (type) {
      case 'donation':
        return renderMatchingInsights();
      case 'fraud':
        return renderFraudInsights();
      case 'demand':
        return renderDemandInsights();
      default:
        return renderGeneralInsights();
    }
  };

  const renderMatchingInsights = () => {
    return (
      <div className="space-y-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <h4 className="font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            Match Confidence
          </h4>
          <div className="mt-2 text-2xl font-bold">
            {insights?.matchConfidence || 0}%
          </div>
        </div>
        
        {insights?.recommendations && (
          <div>
            <h4 className="font-medium mb-2">Top Matches</h4>
            <div className="space-y-2">
              {insights.recommendations.slice(0, 3).map((match, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm p-2 rounded-lg flex justify-between">
                  <span>{match.name}</span>
                  <span className="font-medium">{match.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFraudInsights = () => {
    return (
      <div className="space-y-4">
        <div className={`p-3 rounded-lg ${insights?.riskScore > 70 ? 'bg-destructive/20' : 'bg-primary/10'}`}>
          <h4 className="font-medium flex items-center">
            <AlertTriangle className={`h-4 w-4 mr-2 ${insights?.riskScore > 70 ? 'text-destructive' : 'text-primary'}`} />
            Risk Assessment
          </h4>
          <div className="mt-2 text-2xl font-bold">
            {insights?.riskScore || 0}% Risk
          </div>
        </div>
        
        {insights?.factors && (
          <div>
            <h4 className="font-medium mb-2">Risk Factors</h4>
            <div className="space-y-2">
              {insights.factors.map((factor, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                  {factor}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDemandInsights = () => {
    return (
      <div className="space-y-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <h4 className="font-medium flex items-center">
            <BarChart className="h-4 w-4 mr-2 text-primary" />
            Predicted Demand
          </h4>
          <div className="mt-2">
            {insights?.topCategories?.map((category, idx) => (
              <div key={idx} className="flex justify-between items-center mt-2">
                <span className="text-sm">{category.name}</span>
                <div className="w-2/3 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary/60 h-2.5 rounded-full" 
                    style={{ width: `${category.demand}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {insights?.forecast && (
          <div>
            <h4 className="font-medium mb-2">30-Day Forecast</h4>
            <div className="text-sm text-muted-foreground">
              Expected increase of <span className="text-primary font-medium">{insights.forecast.growth}%</span> in donations
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGeneralInsights = () => {
    return (
      <div className="space-y-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <h4 className="font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            Community Impact
          </h4>
          <div className="mt-2 text-2xl font-bold">
            {insights?.impact || 0} people helped
          </div>
        </div>
        
        {insights?.trends && (
          <div>
            <h4 className="font-medium mb-2">Emerging Trends</h4>
            <div className="space-y-2">
              {insights.trends.map((trend, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                  {trend}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-lg flex items-center">
          <div className="bg-primary/20 p-1.5 rounded-full mr-2">
            {type === 'donation' && <TrendingUp className="h-4 w-4 text-primary" />}
            {type === 'fraud' && <AlertTriangle className="h-4 w-4 text-primary" />}
            {type === 'demand' && <BarChart className="h-4 w-4 text-primary" />}
            {type === 'general' && <Users className="h-4 w-4 text-primary" />}
          </div>
          {type === 'donation' && 'AI Matching Insights'}
          {type === 'fraud' && 'Fraud Detection Analysis'}
          {type === 'demand' && 'Demand Prediction'}
          {type === 'general' && 'AI Community Insights'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default AIInsightsCard;