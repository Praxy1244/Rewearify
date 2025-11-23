import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowLeft,
  Calendar,
  Package,
  Users,
  MapPin,
  AlertCircle,
  Brain,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Forecasting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState({
    donationTrends: [],
    demandPredictions: [],
    categoryForecasts: [],
    locationInsights: [],
    summary: {}
  });

  useEffect(() => {
    fetchForecastData();
  }, []);

  const fetchForecastData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Call your AI forecasting endpoint
      const response = await fetch('http://localhost:8000/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          period: '30days', // Next 30 days
          include_categories: true,
          include_locations: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setForecastData({
          donationTrends: data.donation_trends || [],
          demandPredictions: data.demand_predictions || [],
          categoryForecasts: data.category_forecasts || [],
          locationInsights: data.location_insights || [],
          summary: data.summary || {}
        });
        console.log('Forecast data loaded:', data);
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 10) return 'text-green-600';
    if (trend < -10) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing trends and generating forecasts...</p>
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
            <TrendingUp className="text-blue-600" />
            AI Forecasting & Trends
          </h1>
          <p className="text-gray-600 mt-2">
            Predictive analytics for the next 30 days
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Predicted Donations</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {forecastData.summary.predicted_donations || 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(forecastData.summary.donation_trend || 0)}
                <span className={`text-sm font-medium ${getTrendColor(forecastData.summary.donation_trend || 0)}`}>
                  {forecastData.summary.donation_trend > 0 ? '+' : ''}
                  {forecastData.summary.donation_trend || 0}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expected Demand</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {forecastData.summary.expected_demand || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(forecastData.summary.demand_trend || 0)}
                <span className={`text-sm font-medium ${getTrendColor(forecastData.summary.demand_trend || 0)}`}>
                  {forecastData.summary.demand_trend > 0 ? '+' : ''}
                  {forecastData.summary.demand_trend || 0}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Category</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {forecastData.summary.top_category || 'N/A'}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Highest predicted demand
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confidence Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {forecastData.summary.confidence_score || 0}%
                  </p>
                </div>
                <Brain className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Model accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="donations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="donations">
              <Package className="h-4 w-4 mr-2" />
              Donation Trends
            </TabsTrigger>
            <TabsTrigger value="categories">
              <BarChart3 className="h-4 w-4 mr-2" />
              Category Forecasts
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPin className="h-4 w-4 mr-2" />
              Location Insights
            </TabsTrigger>
          </TabsList>

          {/* Donation Trends Tab */}
          <TabsContent value="donations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>30-Day Donation Forecast</CardTitle>
                <p className="text-sm text-gray-600">
                  AI-predicted donation volumes by week
                </p>
              </CardHeader>
              <CardContent>
                {forecastData.donationTrends.length > 0 ? (
                  <div className="space-y-4">
                    {forecastData.donationTrends.map((trend, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{trend.period || `Week ${idx + 1}`}</span>
                          </div>
                          <Badge className="bg-blue-600">
                            {trend.predicted_donations || 0} donations
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min((trend.predicted_donations / 100) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {trend.confidence || 85}% confidence
                          </span>
                        </div>
                        {trend.insight && (
                          <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5" />
                            {trend.insight}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No forecast data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Forecasts Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Demand Predictions</CardTitle>
                <p className="text-sm text-gray-600">
                  Which categories will be in highest demand
                </p>
              </CardHeader>
              <CardContent>
                {forecastData.categoryForecasts.length > 0 ? (
                  <div className="space-y-3">
                    {forecastData.categoryForecasts
                      .sort((a, b) => (b.predicted_demand || 0) - (a.predicted_demand || 0))
                      .map((category, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold capitalize">{category.category}</h4>
                              <p className="text-sm text-gray-600">
                                {category.predicted_demand || 0} items needed
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                className={
                                  idx === 0 ? 'bg-red-600' :
                                  idx === 1 ? 'bg-orange-600' :
                                  idx === 2 ? 'bg-yellow-600' : 'bg-gray-600'
                                }
                              >
                                #{idx + 1}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  idx === 0 ? 'bg-red-600' :
                                  idx === 1 ? 'bg-orange-600' :
                                  idx === 2 ? 'bg-yellow-600' : 'bg-gray-600'
                                }`}
                                style={{ width: `${(category.demand_percentage || 0)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{category.demand_percentage || 0}%</span>
                          </div>
                          {category.trend && (
                            <div className="flex items-center gap-1 text-sm">
                              {getTrendIcon(category.trend)}
                              <span className={getTrendColor(category.trend)}>
                                {category.trend > 0 ? 'Increasing' : category.trend < 0 ? 'Decreasing' : 'Stable'} demand
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No category forecasts available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Insights Tab */}
          <TabsContent value="locations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Demand Patterns</CardTitle>
                <p className="text-sm text-gray-600">
                  Regional donation and demand forecasts
                </p>
              </CardHeader>
              <CardContent>
                {forecastData.locationInsights.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {forecastData.locationInsights.map((location, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold">{location.city || location.location}</h4>
                              <p className="text-xs text-gray-600">{location.state || 'N/A'}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {location.activity_score || 0}% active
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Expected Donations</p>
                            <p className="text-lg font-bold text-blue-600">
                              {location.predicted_donations || 0}
                            </p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Expected Demand</p>
                            <p className="text-lg font-bold text-green-600">
                              {location.predicted_demand || 0}
                            </p>
                          </div>
                        </div>

                        {location.top_category && (
                          <p className="text-xs text-gray-600">
                            <strong>Top Need:</strong> {location.top_category}
                          </p>
                        )}

                        {location.alert && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800 flex items-start gap-1">
                              <AlertCircle className="h-3 w-3 mt-0.5" />
                              {location.alert}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No location insights available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Model Info */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Brain className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">About AI Forecasting</h3>
                <p className="text-sm text-blue-800">
                  This forecasting system uses machine learning to analyze historical patterns, 
                  seasonal trends, and current platform activity to predict future donation volumes 
                  and demand. The model is updated daily and achieves {forecastData.summary.confidence_score || 85}% accuracy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Forecasting;
