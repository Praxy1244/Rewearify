import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Sparkles, Search, Filter, Building2, Package, TrendingUp, MapPin } from 'lucide-react';
import NGOCard from '../../components/NGOCard';
import DonationCard from '../../components/DonationCard';
import aiService from '../../services/aiService';
import { donationService } from '../../services';
import { toast } from 'sonner';

const BrowseNeeds = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ngos');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  // Data states
  const [ngos, setNgos] = useState([]);
  const [donations, setDonations] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [matches, setMatches] = useState([]);
  
  // Loading states
  const [loadingNGOs, setLoadingNGOs] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // Fetch NGOs (mock data for now - replace with real API)
  useEffect(() => {
    const fetchNGOs = async () => {
      setLoadingNGOs(true);
      try {
        // Mock NGO data - Replace with real API call
        const mockNGOs = [
          {
            id: 'ngo001',
            name: 'Hope Foundation',
            city: 'Delhi',
            state: 'Delhi',
            categories: ['outerwear', 'casual', 'children'],
            capacity: 100,
            urgentNeed: true
          },
          {
            id: 'ngo002',
            name: 'Helping Hands',
            city: 'Mumbai',
            state: 'Maharashtra',
            categories: ['formal', 'shoes', 'accessories'],
            capacity: 150,
            urgentNeed: false
          },
          {
            id: 'ngo003',
            name: 'Community Care',
            city: 'Bengaluru',
            state: 'Karnataka',
            categories: ['children', 'household', 'casual'],
            capacity: 80,
            urgentNeed: true
          },
          {
            id: 'ngo004',
            name: 'Care & Share',
            city: 'Delhi',
            state: 'Delhi',
            categories: ['traditional', 'formal', 'accessories'],
            capacity: 120,
            urgentNeed: false
          },
          {
            id: 'ngo005',
            name: 'Seva Trust',
            city: 'Chennai',
            state: 'Tamil Nadu',
            categories: ['activewear', 'shoes', 'casual'],
            capacity: 90,
            urgentNeed: true
          }
        ];
        setNgos(mockNGOs);
      } catch (error) {
        console.error('Error fetching NGOs:', error);
        toast.error('Failed to load NGOs');
      } finally {
        setLoadingNGOs(false);
      }
    };

    fetchNGOs();
  }, []);

  // Fetch approved donations
  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab !== 'donations') return;
      
      setLoadingDonations(true);
      try {
        const response = await donationService.getDonations({ status: 'approved', limit: 50 });
        if (response.success) {
          setDonations(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching donations:', error);
        toast.error('Failed to load donations');
      } finally {
        setLoadingDonations(false);
      }
    };

    fetchDonations();
  }, [activeTab]);

  // Fetch AI recommendations
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (!user) return;
      
      setLoadingAI(true);
      try {
        // Get recommendations based on user's donation history
        const mockRecommendations = ngos.slice(0, 3).map(ngo => ({
          ...ngo,
          matchScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
          reason: `Based on your ${Math.random() > 0.5 ? 'previous donations' : 'location'}`
        }));
        setAiRecommendations(mockRecommendations);
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchAIRecommendations();
  }, [user, ngos]);

  // Generate smart matches
  useEffect(() => {
    const generateMatches = async () => {
      if (activeTab !== 'matches' || donations.length === 0 || ngos.length === 0) return;

      try {
        // Create matches between donations and NGOs
        const generatedMatches = donations.slice(0, 10).map(donation => {
          // Find NGOs that accept this donation category
          const matchingNGOs = ngos.filter(ngo => 
            ngo.categories.some(cat => cat === donation.category)
          );
          
          if (matchingNGOs.length === 0) return null;
          
          const bestNGO = matchingNGOs[0];
          return {
            donation,
            ngo: bestNGO,
            matchScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
            reason: `${bestNGO.name} accepts ${donation.category} and has capacity`
          };
        }).filter(Boolean);

        setMatches(generatedMatches);
      } catch (error) {
        console.error('Error generating matches:', error);
      }
    };

    generateMatches();
  }, [activeTab, donations, ngos]);

  // Filter NGOs
  const filteredNGOs = ngos.filter(ngo => {
    const matchesSearch = !searchQuery || 
      ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || 
      ngo.categories.includes(categoryFilter);
    
    const matchesLocation = !locationFilter || 
      ngo.city.toLowerCase() === locationFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Filter donations
  const filteredDonations = donations.filter(donation => {
    const matchesSearch = !searchQuery || 
      donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || donation.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    'outerwear', 'casual', 'formal', 'children', 'shoes', 
    'accessories', 'household', 'traditional', 'activewear'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse & Match</h1>
        <p className="text-gray-600">Discover NGOs, available items, and AI-powered matches</p>
      </div>

      {/* AI Recommendations Section */}
      {aiRecommendations.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI-Recommended NGOs for You
            </CardTitle>
            <p className="text-sm text-gray-600">Based on your donation history and preferences</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiRecommendations.map((ngo, idx) => (
                <NGOCard 
                  key={idx} 
                  ngo={ngo} 
                  matchScore={ngo.matchScore}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
<Card className="mb-6">
  <CardContent className="pt-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={categoryFilter || "all"} onValueChange={(val) => setCategoryFilter(val === "all" ? "" : val)}>
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

      <Input
        placeholder="Filter by city"
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
      />
    </div>

    {(searchQuery || categoryFilter || locationFilter) && (
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Active filters:</span>
        {searchQuery && (
          <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
            Search: {searchQuery} ×
          </Badge>
        )}
        {categoryFilter && (
          <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategoryFilter('')}>
            Category: {categoryFilter} ×
          </Badge>
        )}
        {locationFilter && (
          <Badge variant="secondary" className="cursor-pointer" onClick={() => setLocationFilter('')}>
            Location: {locationFilter} ×
          </Badge>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSearchQuery('');
            setCategoryFilter('');
            setLocationFilter('');
          }}
        >
          Clear all
        </Button>
      </div>
    )}
  </CardContent>
</Card>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ngos">
            <Building2 className="h-4 w-4 mr-2" />
            NGOs ({filteredNGOs.length})
          </TabsTrigger>
          <TabsTrigger value="donations">
            <Package className="h-4 w-4 mr-2" />
            Available Items ({filteredDonations.length})
          </TabsTrigger>
          <TabsTrigger value="matches">
            <TrendingUp className="h-4 w-4 mr-2" />
            Smart Matches ({matches.length})
          </TabsTrigger>
        </TabsList>

        {/* NGOs Tab */}
        <TabsContent value="ngos" className="mt-6">
          {loadingNGOs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading NGOs...</p>
            </div>
          ) : filteredNGOs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No NGOs found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNGOs.map((ngo, idx) => (
                <NGOCard key={idx} ngo={ngo} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Donations Tab */}
        <TabsContent value="donations" className="mt-6">
          {loadingDonations ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading donations...</p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No donations found</h3>
              <p className="text-gray-600">Check back later for available items</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDonations.map((donation, idx) => (
                <DonationCard key={idx} donation={donation} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-6">
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
              <p className="text-gray-600">AI will find the best matches between items and NGOs</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {match.donation.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{match.donation.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{match.donation.category}</Badge>
                          <Badge variant="outline">{match.donation.quantity} items</Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            {Math.round(match.matchScore * 100)}%
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {match.ngo.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">{match.reason}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {match.ngo.city}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrowseNeeds;
