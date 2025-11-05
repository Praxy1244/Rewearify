import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock, 
  MapPin,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import  aiService  from '../../services/aiService';

const AIInsightsCard = ({ userRole = 'admin' }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getAIInsights();
      if (data.error) {
        setError(data.error);
      } else {
        setInsights(data);
      }
    } catch (err) {
      setError('Failed to fetch AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2">Loading AI insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchInsights} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <span>AI Insights Dashboard</span>
        </CardTitle>
        <Button onClick={fetchInsights} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Match Accuracy</p>
                    <p className="text-2xl font-bold text-blue-900">94.2%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Fraud Detection</p>
                    <p className="text-2xl font-bold text-green-900">98.7%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Process Efficiency</p>
                    <p className="text-2xl font-bold text-purple-900">87.3%</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Routing Optimization</p>
                    <p className="text-2xl font-bold text-orange-900">91.5%</p>
                  </div>
                  <MapPin className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Key Insights
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm"><strong>Seasonal Trend:</strong> Winter clothing demand is expected to increase by 35% in the next 2 months.</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm"><strong>Matching Efficiency:</strong> AI matching has improved donation-NGO compatibility by 28% this quarter.</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm"><strong>Process Optimization:</strong> Average donation processing time reduced by 42% with AI workflow management.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                Demand Forecasting
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Next 30 Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Winter Clothing</span>
                        <Badge variant="secondary">+45%</Badge>
                      </div>
                      <Progress value={75} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Footwear</span>
                        <Badge variant="secondary">+22%</Badge>
                      </div>
                      <Progress value={60} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Blankets</span>
                        <Badge variant="secondary">+38%</Badge>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Supply Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Expected Donations</span>
                        <span className="text-sm font-medium">1,240</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Peak Days</span>
                        <span className="text-sm font-medium">Weekends</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Capacity Utilization</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-green-500" />
                Route Optimization
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">North Cluster</h5>
                  <p className="text-sm text-gray-600 mb-2">12 NGOs, 45km radius</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency</span>
                    <Badge variant="secondary">92%</Badge>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Central Cluster</h5>
                  <p className="text-sm text-gray-600 mb-2">18 NGOs, 38km radius</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency</span>
                    <Badge variant="secondary">89%</Badge>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">South Cluster</h5>
                  <p className="text-sm text-gray-600 mb-2">15 NGOs, 52km radius</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency</span>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                AI Alerts & Recommendations
              </h4>
              
              <div className="space-y-3">
                <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-red-900">High Risk Donor Detected</h5>
                      <p className="text-sm text-red-700 mt-1">Donor ID #1247 flagged with 89% fraud probability</p>
                    </div>
                    <Badge variant="destructive">High</Badge>
                  </div>
                </div>
                
                <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-yellow-900">Process Bottleneck</h5>
                      <p className="text-sm text-yellow-700 mt-1">Review stage averaging 3.2 days - 40% above target</p>
                    </div>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                </div>
                
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-blue-900">Optimization Opportunity</h5>
                      <p className="text-sm text-blue-700 mt-1">Rerouting 8 donations could save 120km in delivery distance</p>
                    </div>
                    <Badge variant="secondary">Info</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIInsightsCard;