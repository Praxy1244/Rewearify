import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Sparkles, Search, Filter, Building2, Package, TrendingUp, MapPin, Users, Loader2 } from 'lucide-react';
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
  
  // AI Filter states - NEW
  const [showAIRecommended, setShowAIRecommended] = useState(false);
  const [aiRecommendedIds, setAIRecommendedIds] = useState([]);
  
  // Loading states
  const [loadingNGOs, setLoadingNGOs] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Stats state - FIXED
  const [stats, setStats] = useState({
    totalNGOs: 0,
    totalItems: 0,
    smartMatches: 0
  });

  // Calculate stats - NEW FUNCTION
  const calculateStats = (ngoData, donationData, matchData) => {
  const totalNGOs = Array.isArray(ngoData) ? ngoData.length : 0;
  const totalItems = Array.isArray(donationData) 
    ? donationData.reduce((sum, d) => sum + (d.quantity || 0), 0) 
    : 0;
  const smartMatches = Array.isArray(matchData) ? matchData.length : 0;
  
  setStats({
    totalNGOs,
    totalItems,
    smartMatches
  });
  
  console.log('Stats calculated:', { totalNGOs, totalItems, smartMatches });
};


  // Fetch NGOs
 // Fetch real NGOs from backend
useEffect(() => {
  const fetchNGOs = async () => {
    setLoadingNGOs(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch from real backend API
      const response = await fetch('http://localhost:5000/api/ngos', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        const ngoData = data.ngos || data.data || data || [];
        
        // Format NGOs for consistency
        const formattedNGOs = ngoData.map(ngo => ({
          id: ngo._id || ngo.id,
          name: ngo.name || ngo.organizationName,
          city: ngo.location?.city || ngo.city || 'Unknown',
          state: ngo.location?.state || ngo.state || '',
          categories: ngo.acceptedCategories || ngo.categories || [],
          capacity: ngo.capacity || 100,
          urgentNeed: ngo.urgentNeed || false,
          description: ngo.description || '',
          contact: ngo.contact || {},
          // Keep original object for NGOCard component
          ...ngo
        }));
        
        setNgos(formattedNGOs);
        console.log('Real NGOs loaded:', formattedNGOs.length);
      } else {
        console.error('Failed to fetch NGOs:', response.status);
        toast.error('Failed to load NGOs');
      }
    } catch (error) {
      console.error('Error fetching NGOs:', error);
      toast.error('Could not connect to server');
    } finally {
      setLoadingNGOs(false);
    }
  };

  fetchNGOs();
}, []);


  // Fetch approved donations
  useEffect(() => {
    const fetchDonations = async () => {
      
      
      setLoadingDonations(true);
      try {
        const response = await donationService.getDonations({ status: 'approved', limit: 50 });
        if (response.success) {
          const donationData = response.data || [];
          setDonations(donationData);
          
          // Recalculate stats - FIXED
          calculateStats(ngos, donationData, matches);
        }
      } catch (error) {
        console.error('Error fetching donations:', error);
        toast.error('Failed to load donations');
      } finally {
        setLoadingDonations(false);
      }
    };

    fetchDonations();
  }, []);

  // Recalculate stats whenever data changes - ADD THIS NEW
useEffect(() => {
  calculateStats(ngos, donations, matches);
}, [ngos, donations, matches]); // ✅ Runs whenever any data updates

  // Fetch AI recommendations from backend - UPDATED
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (!user) return;
      
      setLoadingAI(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const recommendations = data.recommendations || [];
          
          // Set AI recommendations for display
          setAiRecommendations(recommendations.slice(0, 3));
          
          // Extract NGO IDs for filtering - NEW
          const ids = recommendations.map(ngo => ngo.id || ngo._id);
          setAIRecommendedIds(ids);
          
          console.log('AI Recommendations loaded:', recommendations.length);
          console.log('AI NGO IDs:', ids);
        } else {
          // Fallback to mock if API not ready
          const mockRecommendations = ngos.slice(0, 3).map(ngo => ({
            ...ngo,
            matchScore: Math.random() * 0.4 + 0.6,
            reason: `Based on your ${Math.random() > 0.5 ? 'previous donations' : 'location'}`
          }));
          setAiRecommendations(mockRecommendations);
          setAIRecommendedIds(mockRecommendations.map(n => n.id));
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        // Fallback to mock
        const mockRecommendations = ngos.slice(0, 3).map(ngo => ({
          ...ngo,
          matchScore: Math.random() * 0.4 + 0.6,
          reason: `Based on your ${Math.random() > 0.5 ? 'previous donations' : 'location'}`
        }));
        setAiRecommendations(mockRecommendations);
        setAIRecommendedIds(mockRecommendations.map(n => n.id));
      } finally {
        setLoadingAI(false);
      }
    };

    fetchAIRecommendations();
  }, [user, ngos]);

  // Generate smart matches
 // Generate smart matches from real data
useEffect(() => {
  const generateMatches = async () => {
    // Wait for both NGOs and donations to load
    if (donations.length === 0 || ngos.length === 0) {
      console.log('Waiting for data...', { donations: donations.length, ngos: ngos.length });
      return;
    }

    try {
      console.log('Generating matches from real data...');
      
      const generatedMatches = donations
        .filter(donation => donation.status === 'approved') // Only approved donations
        .map(donation => {
          // Find NGOs that accept this donation category
          const matchingNGOs = ngos.filter(ngo => {
            const ngoCategories = ngo.categories || ngo.acceptedCategories || [];
            return ngoCategories.some(cat => 
              cat.toLowerCase() === donation.category?.toLowerCase()
            );
          });
          
          if (matchingNGOs.length === 0) return null;
          
          // Calculate match scores based on multiple factors
          const scoredNGOs = matchingNGOs.map(ngo => {
            let score = 0.5; // Base score
            
            // Same city bonus
            if (ngo.city?.toLowerCase() === donation.location?.city?.toLowerCase()) {
              score += 0.2;
            }
            
            // Same state bonus
            if (ngo.state?.toLowerCase() === donation.location?.state?.toLowerCase()) {
              score += 0.1;
            }
            
            // Urgent need bonus
            if (ngo.urgentNeed && donation.urgentNeeded) {
              score += 0.15;
            }
            
            // Capacity check
            if (ngo.capacity && ngo.capacity >= donation.quantity) {
              score += 0.05;
            }
            
            return { ngo, score: Math.min(score, 1.0) };
          });
          
          // Sort by score and pick the best match
          scoredNGOs.sort((a, b) => b.score - a.score);
          const bestMatch = scoredNGOs[0];
          
          return {
            donation,
            ngo: bestMatch.ngo,
            matchScore: bestMatch.score,
            reason: generateMatchReason(donation, bestMatch.ngo, bestMatch.score)
          };
        })
        .filter(Boolean); // Remove null matches

      setMatches(generatedMatches);
      console.log('Matches generated:', generatedMatches.length);
      
      // Update stats
      calculateStats(ngos, donations, generatedMatches);
    } catch (error) {
      console.error('Error generating matches:', error);
    }
  };

  generateMatches();
}, [donations, ngos]); // ✅ Changed: Run whenever data updates, not just on tab change

// Helper function to generate match reason
const generateMatchReason = (donation, ngo, score) => {
  const reasons = [];
  
  if (ngo.city?.toLowerCase() === donation.location?.city?.toLowerCase()) {
    reasons.push('same city');
  }
  
  if (ngo.urgentNeed && donation.urgentNeeded) {
    reasons.push('urgent need');
  }
  
  if (ngo.capacity >= donation.quantity) {
    reasons.push('sufficient capacity');
  }
  
  const categoryName = donation.category || 'items';
  reasons.push(`accepts ${categoryName}`);
  
  if (reasons.length > 0) {
    return `${ngo.name} is a great match: ${reasons.join(', ')}`;
  }
  
  return `${ngo.name} accepts ${categoryName} donations`;
};


  // Filter NGOs - UPDATED WITH AI FILTER
  const filteredNGOs = ngos.filter(ngo => {
    const matchesSearch = !searchQuery || 
      ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || 
      ngo.categories.includes(categoryFilter);
    
    const matchesLocation = !locationFilter || 
      ngo.city.toLowerCase() === locationFilter.toLowerCase();
    
    // AI Filter - NEW
    const matchesAI = !showAIRecommended || aiRecommendedIds.includes(ngo.id);

    return matchesSearch && matchesCategory && matchesLocation && matchesAI;
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

      {/* Stats Cards - FIXED */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total NGOs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalNGOs}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Smart Matches</p>
                <p className="text-3xl font-bold text-gray-900">{stats.smartMatches}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* AI Filter Button - NEW */}
        <Card className={showAIRecommended ? 'border-2 border-purple-500 bg-purple-50' : ''}>
          <CardContent className="p-6">
            <Button
              variant={showAIRecommended ? "default" : "outline"}
              onClick={() => setShowAIRecommended(!showAIRecommended)}
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              disabled={loadingAI}
            >
              {loadingAI ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-6 w-6" />
                  <span className="text-sm text-center">
                    {showAIRecommended ? 'Showing AI Matches' : 'Show AI Matches'}
                  </span>
                  {aiRecommendedIds.length > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {aiRecommendedIds.length} matches
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations Section */}
      {aiRecommendations.length > 0 && !showAIRecommended && (
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

          {(searchQuery || categoryFilter || locationFilter || showAIRecommended) && (
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
              {showAIRecommended && (
                <Badge variant="default" className="cursor-pointer bg-purple-600" onClick={() => setShowAIRecommended(false)}>
                  AI Recommended ×
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setLocationFilter('');
                  setShowAIRecommended(false);
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
              {filteredNGOs.map((ngo, idx) => {
                const isAIRecommended = aiRecommendedIds.includes(ngo.id);
                return (
                  <div key={idx} className="relative">
                    {isAIRecommended && (
                      <Badge className="absolute top-2 right-2 z-10 bg-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Match
                      </Badge>
                    )}
                    <NGOCard ngo={ngo} />
                  </div>
                );
              })}
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
