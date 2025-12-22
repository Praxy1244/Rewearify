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
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import aiService from '../../services/aiService';
import {
  transformDonationTrends,
  transformCategoryData,
  transformLocationData,
  calculateSummary
} from '../../utils/forecastTransforms';
import { toast } from 'react-hot-toast';

const Forecasting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('winter_wear');
  const [selectedCity, setSelectedCity] = useState('Bangalore');
  const [selectedPeriods, setSelectedPeriods] = useState(30);
  const [availableCategories, setAvailableCategories] = useState([
    'winter_wear',
    'summer_wear',
    'ethnic_wear',
    'kids_wear',
    'formal_wear'
  ]);
  const [availableCities, setAvailableCities] = useState([
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Chennai',
    'Kolkata',
    'Hyderabad',
    'Pune',
    'Mysuru'
  ]);
  
  // Data
  const [forecastData, setForecastData] = useState({
    donationTrends: [],
    demandPredictions: [],
    categoryForecasts: [],
    locationInsights: [],
    summary: {}
  });

  useEffect(() => {
    fetchForecastData();
    fetchCategories();
  }, []);

  /**
   * Fetch available categories and cities from backend
   */
  const fetchCategories = async () => {
    try {
      const response = await aiService.getForecastCategories();
      if (response.data.success) {
        const data = response.data.data || response.data;
        if (data.categories) setAvailableCategories(data.categories);
        if (data.cities) setAvailableCities(data.cities);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Use default categories if API fails
    }
  };

  /**
   * Fetch forecast data from backend
   */
 const fetchForecastData = async (isRefresh = false) => {
  if (isRefresh) {
    setRefreshing(true);
  } else {
    setLoading(true);
  }
  
  try {
    console.log('📊 Fetching forecast data for:', {
      clothing_type: selectedCategory,
      city: selectedCity,
      periods: selectedPeriods
    });

    const response = await aiService.getForecastSummary({
      clothing_type: selectedCategory,
      city: selectedCity,
      periods: selectedPeriods,
      current_supply: 100
    });
    
    console.log('✅ Full response:', response);
    
    // ✅ FIX: Check response.success (not response.data.success)
    if (response.success === true) {
      const apiData = response.data; // ✅ response.data is already the unwrapped data
      console.log('✅ Forecast data received:', apiData);
      
      // Verify we have the required data fields
      if (!apiData) {
        console.error('❌ No data in response');
        toast.error('No forecast data received');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('📊 apiData.forecast:', apiData.forecast ? 'EXISTS' : 'MISSING');
      console.log('📊 apiData.seasonal_trends:', apiData.seasonal_trends ? 'EXISTS' : 'MISSING');
      console.log('📊 apiData.supply_gap:', apiData.supply_gap ? 'EXISTS' : 'MISSING');
      
      // Transform the data
      const transformedData = {
        donationTrends: transformDonationTrends(apiData.forecast),
        demandPredictions: apiData.forecast?.forecasted_demands || [],
        categoryForecasts: transformCategoryData(apiData.seasonal_trends, apiData.forecast),
        locationInsights: transformLocationData(apiData.supply_gap, apiData.forecast),
        summary: calculateSummary(apiData)
      };
      
      console.log('✅ Transformed data:', transformedData);
      console.log('  - Donation Trends length:', transformedData.donationTrends.length);
      console.log('  - Category Forecasts length:', transformedData.categoryForecasts.length);
      console.log('  - Location Insights length:', transformedData.locationInsights.length);
      console.log('  - Summary:', transformedData.summary);
      
      setForecastData(transformedData);
      
      if (isRefresh) {
        toast.success('Forecast data refreshed!');
      }
    } else {
      console.error('❌ Response check failed');
      console.error('  - response exists?', !!response);
      console.error('  - response.success?', response?.success);
      toast.error('Failed to load forecast data');
    }
  } catch (error) {
    console.error('❌ Failed to fetch forecast:', error);
    console.error('Error details:', error.response?.data);
    toast.error(error.response?.data?.message || 'Failed to load forecast data');
    
    // Set empty data on error
    setForecastData({
      donationTrends: [],
      demandPredictions: [],
      categoryForecasts: [],
      locationInsights: [],
      summary: {}
    });
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};


  const handleRefresh = () => {
    fetchForecastData(true);
  };

  const handleFilterChange = () => {
    fetchForecastData(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing trends and generating forecasts...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="text-blue-600" />
                AI Forecasting & Trends
              </h1>
              <p className="text-gray-600 mt-2">
                Predictive analytics for the next {selectedPeriods} days
              </p>
            </div>
            
            <div className="flex gap-2">
              
              
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Clothing Type
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Forecast Period
                </label>
                <select
                  value={selectedPeriods}
                  onChange={(e) => setSelectedPeriods(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleFilterChange}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {forecastData.summary.donation_trend || 0}% vs last period
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
                  {forecastData.summary.demand_trend || 0}% vs last period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Category</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">
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
                <CardTitle>{selectedPeriods}-Day Donation Forecast</CardTitle>
                <p className="text-sm text-gray-600">
                  AI-predicted donation volumes by week
                </p>
              </CardHeader>
              <CardContent>
                {forecastData.donationTrends.length > 0 ? (
                  <div className="space-y-4">
                    {forecastData.donationTrends.map((trend, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{trend.period}</span>
                          </div>
                          <Badge className="bg-blue-600">
                            {trend.predicted_donations} donations
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((trend.predicted_donations / 150) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {trend.confidence}% confidence
                          </span>
                        </div>
                        {trend.insight && (
                          <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {trend.insight}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium">No forecast data available</p>
                    <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
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
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold capitalize">{category.category}</h4>
                              <p className="text-sm text-gray-600">
                                {category.predicted_demand} items needed
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
                                className={`h-2 rounded-full transition-all ${
                                  idx === 0 ? 'bg-red-600' :
                                  idx === 1 ? 'bg-orange-600' :
                                  idx === 2 ? 'bg-yellow-600' : 'bg-gray-600'
                                }`}
                                style={{ width: `${category.demand_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 min-w-[45px] text-right">
                              {category.demand_percentage}%
                            </span>
                          </div>
                          {category.trend !== undefined && (
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
                    <p className="font-medium">No category forecasts available</p>
                    <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
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
                      <div key={idx} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold">{location.city}</h4>
                              <p className="text-xs text-gray-600">{location.state}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {location.activity_score}% active
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-xs text-gray-600 mb-1">Expected Donations</p>
                            <p className="text-xl font-bold text-blue-600">
                              {location.predicted_donations}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-gray-600 mb-1">Expected Demand</p>
                            <p className="text-xl font-bold text-green-600">
                              {location.predicted_demand}
                            </p>
                          </div>
                        </div>

                        {location.top_category && (
                          <p className="text-xs text-gray-600 mb-2">
                            <strong>Top Need:</strong> {location.top_category}
                          </p>
                        )}

                        {location.alert && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800 flex items-start gap-1">
                              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
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
                    <p className="font-medium">No location insights available</p>
                    <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
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
              <Brain className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">About AI Forecasting</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This forecasting system uses machine learning to analyze historical patterns, 
                  seasonal trends, and current platform activity to predict future donation volumes 
                  and demand. The model is updated daily and achieves {forecastData.summary.confidence_score || 87}% accuracy. 
                  Predictions are based on {selectedCategory.replace(/_/g, ' ')} in {selectedCity} over the next {selectedPeriods} days.
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
