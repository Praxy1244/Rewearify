import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Search, Building2, Heart, Sparkles, Loader2 } from 'lucide-react';
import NGOCard from '../../components/NGOCard';
import RequestCard from '../../components/RequestCard'; // ✅ NEW: Import RequestCard
import { requestService } from '../../services'; 
import { toast } from 'sonner';

const BrowseNeeds = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('needs');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Data States
  const [needs, setNeeds] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');

    if (activeTab === 'needs') {
      // 1. Fetch general community requests (NOT donation-specific)
      const response = await requestService.getCommunityRequests();
      if (response.success) setNeeds(response.data || []);
      
    } else if (activeTab === 'suggested') {
      // 2. Fetch AI Recommendations
      const response = await fetch('http://localhost:5000/api/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data && data.data.recommendations) {
        setRecommendations(data.data.recommendations);
      }

    } else if (activeTab === 'ngos') {
      // 3. Fetch All NGOs
      const response = await fetch('http://localhost:5000/api/ngos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNgos(data.ngos || data.data || []);
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
    toast.error("Failed to load data");
  } finally {
    setLoading(false);
  }
};


  const handleDonate = (target) => {
    const targetNgo = target.requester || target;
    
    const ngoData = {
      id: targetNgo._id || targetNgo.id,
      name: targetNgo.organization?.name || targetNgo.name,
      city: targetNgo.location?.city
    };

    navigate('/donor/donate', { 
      state: { targetNgo: ngoData } 
    });
  };

  const handleViewDetails = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const filterItems = (items) => {
    return items.filter(item => {
      const name = item.title || item.name || item.organization?.name || '';
      const city = item.location?.city || item.city || '';
      const itemCats = item.categories || item.accepted_clothing_types?.split(';') || [item.category];
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
                              itemCats.some(cat => cat && cat.toLowerCase().includes(categoryFilter.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  };

  const categories = ['outerwear', 'casual', 'formal', 'children', 'shoes', 'household'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse & Match</h1>
        <p className="text-gray-600">Find specific requests, explore recommendations, or browse all NGOs.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, location, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="needs" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Community Needs
          </TabsTrigger>
          <TabsTrigger value="suggested" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Suggested For You
          </TabsTrigger>
          <TabsTrigger value="ngos" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Partner NGOs
          </TabsTrigger>
        </TabsList>

        {/* 1. Community Needs Tab - ✅ NOW USES RequestCard */}
        <TabsContent value="needs">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filterItems(needs).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filterItems(needs).map(need => (
  <RequestCard 
    key={need._id} 
    request={need}
    showDonorActions={true}
    onRespond={(request) => {
      // Extract NGO information from the request
      const ngoData = {
        id: request.requester._id,
        name: request.requester.organization?.name || request.requester.name,
        city: request.requester.location?.city
      };
      
      // Navigate to donation form with NGO pre-selected AND request ID
      navigate('/donor/donate', { 
        state: { 
          targetNgo: ngoData,
          requestId: request._id  // ✅ NEW: Pass request ID
        } 
      });
    }}
  />
))}

            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No pending requests for your donations.
            </div>
          )}
        </TabsContent>

        {/* 2. Suggested NGOs Tab */}
        <TabsContent value="suggested">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filterItems(recommendations).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItems(recommendations).map(ngo => (
                <NGOCard 
                  key={ngo._id || ngo.id} 
                  ngo={ngo} 
                  matchScore={ngo.recommendation_score}
                  onSelect={() => handleViewDetails(ngo, 'ngo')}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-purple-200 mb-3" />
              <p className="text-gray-600 font-medium">No specific recommendations yet.</p>
              <p className="text-gray-500 text-sm mt-1">
                Try making a few donations to help our AI understand your preferences!
              </p>
            </div>
          )}
        </TabsContent>

        {/* 3. Partner NGOs Tab */}
        <TabsContent value="ngos">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filterItems(ngos).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItems(ngos).map(ngo => (
                <NGOCard 
                  key={ngo._id} 
                  ngo={ngo} 
                  onSelect={() => handleViewDetails(ngo, 'ngo')}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No NGOs found matching your criteria.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {modalType === 'ngo' ? (
                <Building2 className="h-5 w-5 text-blue-600" />
              ) : (
                <Heart className="h-5 w-5 text-red-600" />
              )}
              {modalType === 'ngo' ? selectedItem?.name : selectedItem?.title}
            </DialogTitle>
            <DialogDescription>
              {modalType === 'ngo' ? selectedItem?.city : selectedItem?.requester?.organization?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 mt-2">
              {modalType === 'ngo' && selectedItem.recommendation_reason && (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-900 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-purple-600" />
                  <div>
                    <strong>AI Recommendation:</strong> {selectedItem.recommendation_reason}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                {selectedItem.description}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {modalType === 'need' ? (
                  <>
                    <div><strong>Quantity:</strong> {selectedItem.quantity} items</div>
                    <div><strong>Urgency:</strong> {selectedItem.urgency}</div>
                    <div><strong>Category:</strong> {selectedItem.category}</div>
                    <div><strong>Location:</strong> {selectedItem.location?.city}</div>
                  </>
                ) : (
                  <>
                    <div><strong>Trust Score:</strong> {selectedItem.trust_score}/5</div>
                    <div><strong>Impact:</strong> {selectedItem.impact_score}/5</div>
                    <div><strong>Verified:</strong> {selectedItem.verified ? 'Yes' : 'Pending'}</div>
                    {selectedItem.location && (
                      <div><strong>Location:</strong> {selectedItem.location.city || selectedItem.city}</div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <Button className="w-full" onClick={() => handleDonate(selectedItem)}>
                  {modalType === 'ngo' ? 'Donate to this NGO' : 'Fulfill this Request'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseNeeds;
