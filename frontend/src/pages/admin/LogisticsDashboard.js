import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Truck, MapPin, Calendar, CheckCircle, Package, Clock, ArrowRight } from 'lucide-react';
import { donationService } from '../../services';
import { toast } from 'sonner';
import api from '../../lib/api';

const LogisticsDashboard = () => {
  const [pickups, setPickups] = useState([]);
  const [transitItems, setTransitItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    setLoading(true);
    try {
      // 1. Get items scheduled for pickup
      const scheduledRes = await donationService.getDonations({ status: 'pickup_scheduled' });
      if (scheduledRes.success) setPickups(scheduledRes.data);

      // 2. Get items currently in transit
      const transitRes = await donationService.getDonations({ status: 'in_transit' });
      if (transitRes.success) setTransitItems(transitRes.data);

    } catch (error) {
      console.error("Failed to load logistics data", error);
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  };

  // Function to advance the status
  const handleStatusUpdate = async (donationId, nextStatus) => {
    try {
      // Using the transition endpoint to update status securely
      const response = await api.put(`/donations/${donationId}/transition`, {
        toState: nextStatus,
        metadata: {
          updatedAt: new Date().toISOString(),
          note: `Status updated to ${nextStatus} by Admin`
        }
      });

      if (response.success) {
        toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`);
        fetchLogisticsData(); // Refresh the lists to move the item
      }
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Logistics Management</h1>
          <p className="text-gray-600 mt-1">Manage donation pickups and deliveries.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Pickups</p>
                <p className="text-3xl font-bold text-blue-600">{pickups.length}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-100" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Transit</p>
                <p className="text-3xl font-bold text-orange-600">{transitItems.length}</p>
              </div>
              <Package className="h-10 w-10 text-orange-100" />
            </CardContent>
          </Card>
        </div>

        {/* Main Management Tabs */}
        <Tabs defaultValue="pickups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pickups">Scheduled Pickups ({pickups.length})</TabsTrigger>
            <TabsTrigger value="transit">In Transit ({transitItems.length})</TabsTrigger>
          </TabsList>

          {/* Tab 1: Pickups */}
          <TabsContent value="pickups">
            {pickups.length > 0 ? (
              pickups.map(item => (
                <Card key={item._id} className="mb-4">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="bg-blue-50 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.location?.address}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">{item.quantity} items</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleStatusUpdate(item._id, 'in_transit')}
                    >
                      Start Transit <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No pickups scheduled.</p>
            )}
          </TabsContent>

          {/* Tab 2: In Transit */}
          <TabsContent value="transit">
            {transitItems.length > 0 ? (
              transitItems.map(item => (
                <Card key={item._id} className="mb-4 border-l-4 border-l-orange-500">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="bg-orange-50 p-3 rounded-full">
                        <Truck className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600">Destination: {item.location?.city}</p>
                        <p className="text-xs text-gray-400 mt-1">Picked up from: {item.donor?.name}</p>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusUpdate(item._id, 'delivered')}
                    >
                      Mark Delivered <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No items currently in transit.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LogisticsDashboard;