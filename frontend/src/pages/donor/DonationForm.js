import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ArrowLeft, ArrowRight, Info, Clock, CheckCircle, Sparkles, MapPin, Loader2, Heart, Search } from 'lucide-react';
import { toast } from 'sonner';
import { donationService, userService } from '../../services';
import aiService from '../../services/aiService';
import axios from 'axios';
import api from '../../lib/api';

// Category to subcategory mapping
const categoryMap = {
  outerwear: ['Jacket', 'Coat', 'Sweater', 'Vest'],
  formal: ['Suit', 'Dress Shirt', 'Blouse', 'Trousers', 'Skirt'],
  casual: ['T-Shirt', 'Jeans', 'Kurta', 'Shorts', 'Polo Shirt'],
  children: ["Infant Set", "Toddler Outfit", "Youth T-Shirt", "Youth Jeans"],
  accessories: ['Hat', 'Scarf', 'Belt', 'Handbag', 'Tie'],
  shoes: ['Sneakers', 'Boots', 'Sandals', 'Formal Shoes'],
  activewear: ['Sportswear', 'Tracksuit', 'Swimwear'],
  undergarments: ['New Underwear', 'New Socks', 'New Bras'],
  traditional: ['Saree', 'Kurta Pajama', 'Lehenga', 'Sherwani'],
  household: ['Blanket', 'Bedsheet', 'Towel', 'Curtain'],
  linens: ['Bed Linens', 'Table Linens'],
  maternity: ['Maternity Top', 'Maternity Bottoms'],
  'plus-size': ['Plus-Size Top', 'Plus-Size Bottoms'],
  other: ['Other'],
};

const sizeMap = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'],
  children: ['0-3M', '6-12M', '1-2Y', '3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y', '13-14Y'],
  shoes: ['5', '6', '7', '8', '9', '10', '11', '12+'],
  household: ['Twin', 'Full', 'Queen', 'King', 'Standard', 'Free Size'],
  default: ['One Size', 'N/A']
};

const getSizingCategory = (category) => {
  if (['outerwear', 'formal', 'casual', 'activewear', 'traditional', 'maternity', 'plus-size', 'undergarments'].includes(category)) {
    return 'clothing';
  }
  if (category === 'children') return 'children';
  if (category === 'shoes') return 'shoes';
  if (['household', 'linens'].includes(category)) return 'household';
  return 'default';
};

const DonationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState(1);
  const [recommendedNGOs, setRecommendedNGOs] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  const [nearbyNGOs, setNearbyNGOs] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [selectedNgoId, setSelectedNgoId] = useState(null);

  const [loading, setLoading] = useState(false);
  
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [targetNgo, setTargetNgo] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    season: 'All Season',
    condition: '',
    quantity: 1,
    sizes: [],
    // 💡 REMOVED: colors state
    location: user?.location?.address || '',
    coordinates: user?.location?.coordinates?.coordinates || null,
    pickupAvailable: true,
    deliveryRadius: 10,
    urgentNeeded: false,
    tags: []
  });

  const [aiSuggestions, setAISuggestions] = useState({
    titles: [],
    descriptions: [],
    subcategories: [],
    tags: []
  });
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [currentSizeOptions, setCurrentSizeOptions] = useState(sizeMap.default);

  // ✅ NEW: Track if fulfilling an NGO request
  const [fulfillingRequestId, setFulfillingRequestId] = useState(null);

  useEffect(() => {
    if (location.state?.targetNgo) {
      setTargetNgo(location.state.targetNgo);
      setSelectedNgoId(location.state.targetNgo.id);
      
      // ✅ NEW: If coming from Browse Needs with a request ID
      if (location.state.requestId) {
        setFulfillingRequestId(location.state.requestId);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (formData.category && categoryMap[formData.category]) {
      setSubcategoryOptions(categoryMap[formData.category]);
    } else {
      setSubcategoryOptions([]);
    }
    handleInputChange('subcategory', '');

    const sizingCategory = getSizingCategory(formData.category);
    setCurrentSizeOptions(sizeMap[sizingCategory]);
    handleInputChange('sizes', []);
  }, [formData.category]);

  useEffect(() => {
    const fetchAISuggestions = async () => {
      if (!formData.category) {
        setAISuggestions({ titles: [], descriptions: [], subcategories: [], tags: [] });
        return;
      }

      setFetchingSuggestions(true);
      try {
        const response = await aiService.analyzeDonation({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition
        });
        
        if (response.success && response.data && response.data.suggestions) {
          setAISuggestions(response.data.suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("AI Suggestion error:", error);
      } finally {
        setFetchingSuggestions(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAISuggestions();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.category, formData.condition]);

  const handleLocationSearch = (query) => {
    handleInputChange('location', query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    setIsSearchingAddress(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { q: query, format: 'json', addressdetails: 1, limit: 5, countrycodes: 'in' },
         
        });
        setAddressSuggestions(response.data);
        setShowAddressDropdown(true);
      } catch (error) {
        console.error('Address search failed:', error);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 500);
  };

  const selectAddress = (address) => {
  const displayName = address.display_name;
  const lng = parseFloat(address.lon);
  const lat = parseFloat(address.lat);
  
  console.log(`✅ Selected address: ${displayName}`);
  console.log(`   Coordinates: [${lng}, ${lat}]`);
  
  setFormData(prev => ({
    ...prev,
    location: displayName,
    coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
  }));
  
  setAddressSuggestions([]);
  setShowAddressDropdown(false);
};


  const categories = [
    { value: 'outerwear', label: 'Outerwear & Coats' },
    { value: 'formal', label: 'Formal & Business' },
    { value: 'casual', label: 'Casual Wear' },
    { value: 'children', label: "Children's Clothing" },
    { value: 'accessories', label: 'Accessories' },
    { value: 'shoes', label: 'Footwear' },
    { value: 'activewear', label: 'Activewear & Sports' },
    { value: 'undergarments', label: 'Undergarments (New)' },
    { value: 'traditional', label: 'Traditional Wear' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'maternity', label: 'Maternity' },
    { value: 'plus-size', label: 'Plus-Size' },
    { value: 'household', label: 'Household (Blankets, etc.)' },
    { value: 'linens', label: 'Linens' },
    { value: 'other', label: 'Other' },
  ];

  const conditions = [
    { value: 'excellent', label: 'Excellent - Like new' },
    { value: 'good', label: 'Good - Minor wear' },
    { value: 'fair', label: 'Fair - Some wear but usable' }
  ];
const fetchRecommendations = async () => {
  setLoadingRecommendations(true);
  try {
    console.log('🎁 Fetching recommendations for donation');
    
    const response = await api.get('/recommendations', {
      params: { limit: 10 }
    });
    
    console.log('✅ Full recommendations response:', response);
    
    // ✅ FIX: Backend returns data.data.recommendations, not data.recommendations
    const recommendations = response?.data?.recommendations || response?.recommendations || [];
    
    if (recommendations.length > 0) {
      // ✅ THIS IS WHERE fixedRecommendations IS
      const fixedRecommendations = recommendations.map((ngo, index) => {
        const uniqueId = ngo._id || ngo.id || `rec-${index}-${ngo.name?.replace(/\s/g, '-').toLowerCase()}`;
        
        // ✅ Extract location string from object
        const locationString = typeof ngo.location === 'string' 
          ? ngo.location 
          : (ngo.location?.city || ngo.location?.address || ngo.city || 'Unknown');
        
        console.log(`[${index}] ${ngo.name} -> ID: ${uniqueId}`);
        
        return {
          ...ngo,
          _id: uniqueId,
          id: uniqueId,
          name: ngo.name || 'Unknown NGO',
          location: locationString,  // ✅ Now it's a string, not object
          city: ngo.location?.city || ngo.city || 'Unknown',
          trust_score: ngo.trust_score || 4.0,
          impact_score: ngo.impact_score || 4.0,
          score: ngo.score || 0.8,
          distance: ngo.distance || null,
          reason: ngo.reason || `Recommended based on your donation history`
        };
      });
      
      setRecommendedNGOs(fixedRecommendations);
      console.log(`✅ Got ${fixedRecommendations.length} recommended NGOs with fixed IDs`);
    } else {
      console.log('⚠️ No recommendations in response');
      setRecommendedNGOs([]);
    }
  } catch (error) {
    console.error('❌ Failed to fetch recommendations:', error);
    setRecommendedNGOs([]);
  } finally {
    setLoadingRecommendations(false);
  }
};


  const fetchNearbyNGOs = async () => {
  if (!formData.coordinates || !Array.isArray(formData.coordinates) || formData.coordinates.length !== 2) {
    console.log('⚠️ No valid coordinates for nearby search');
    setNearbyNGOs([]);
    return;
  }
  
  setLoadingNearby(true);
  try {
    const [lng, lat] = formData.coordinates; // GeoJSON format: [longitude, latitude]
    
    console.log(`📍 Fetching nearby NGOs at [${lat}, ${lng}]`);
    
    const response = await userService.getNearbyUsers(
      lat, 
      lng, 
      Math.max(25, formData.deliveryRadius), 
      'recipient'
    );
    
    console.log('✅ Nearby NGOs response:', response);
    
    if (response.success && response.data && response.data.users) {
      const ngos = response.data.users.map(ngo => ({
        ...ngo,
        _id: ngo._id || ngo.id,
        name: ngo.organization?.name || ngo.name || 'Unknown NGO',
        city: ngo.location?.city || 'Unknown',
        trust_score: ngo.trust_score || 4.0,
        impact_score: ngo.impact_score || 4.0
      }));
      
      setNearbyNGOs(ngos);
      console.log(`✅ Got ${ngos.length} nearby NGOs`);
    } else {
      setNearbyNGOs([]);
      console.log('⚠️ No nearby NGOs found');
    }
  } catch (error) {
    console.error("Failed to fetch nearby NGOs:", error);
    setNearbyNGOs([]);
  } finally {
    setLoadingNearby(false);
  }
};


  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value) 
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return formData.title.trim().length >= 5 && 
               formData.description.trim().length >= 5 &&
               formData.category && 
               formData.subcategory && 
               formData.condition;
                formData.season; // ✅ ADD THIS
      case 2:
        // 💡 REMOVED: Color check
        return formData.sizes.length > 0;
      case 3:
        return formData.location.trim().length > 3;
      default:
        return true;
    }
  };

  const handleNext = () => {
  if (validateStep(step)) {
    if (step === 4) {
      // Fetch both AI recommendations and nearby NGOs
      fetchRecommendations();
      if (formData.coordinates && formData.coordinates.length === 2) {
        fetchNearbyNGOs();
      } else {
        console.log('⚠️ No coordinates available for nearby search');
      }
    }
    setStep(step + 1);
  } else {
    toast.error("Please complete all required fields");
  }
};


  const handleSubmit = async () => {
    setLoading(true);

    const locationParts = formData.location.split(',').map(s => s.trim());
    const city = locationParts[0] || formData.location;
    const state = locationParts[1] || 'Unknown';

    const formattedLocation = {
      address: formData.location,
      city: city,
      state: state,
      country: 'India',
      zipCode: '',
      coordinates: formData.coordinates ? { type: 'Point', coordinates: formData.coordinates } : undefined
    };

    const formattedSizes = formData.sizes.map(size => ({
      size: size,
      quantity: Math.floor(formData.quantity / formData.sizes.length) || 1
    }));
    
    if (formattedSizes.length === 0) {
      formattedSizes.push({ 
        size: 'One Size', 
        quantity: formData.quantity 
      });
    }

    const donationPayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      subcategory: formData.subcategory,
      condition: formData.condition,
      season: formData.season, 
      quantity: formData.quantity,
      sizes: formattedSizes,
      // 💡 REMOVED: colors: formData.colors
      location: formattedLocation,
      availability: {
        pickupAvailable: formData.pickupAvailable,
        deliveryRadius: formData.deliveryRadius,
      },
      preferences: {
        urgentNeeded: formData.urgentNeeded,
        preferredRecipients: selectedNgoId ? [selectedNgoId] : []
      },
      tags: [formData.category, formData.subcategory], // Removed colors from tags
      images: [],
      // ✅ NEW: Link to NGO request if fulfilling one
      ...(fulfillingRequestId && { fulfillingRequest: fulfillingRequestId })
    };

    try {
      const response = await donationService.createDonation(donationPayload);

      if (response.success) {
        toast.success("Donation submitted successfully!");
        navigate('/donor/my-donations');
      } else {
        toast.error(response.message || "Failed to create donation");
      }
    } catch (error) {
      console.error("Error creating donation:", error);
      let errorMessage = "Please check your connection and try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ... (Render helper functions) ...
  const renderTitleSuggestions = () => {
    if (!showSuggestions || aiSuggestions.titles.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-600 font-medium">AI Suggestions:</span>
          {fetchingSuggestions && <span className="text-xs text-gray-500">(loading...)</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {aiSuggestions.titles.map((suggestion, idx) => (
            <Button
              key={idx}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleInputChange('title', suggestion)}
              className="text-xs h-7 px-2 hover:bg-blue-50 hover:border-blue-300"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderDescriptionSuggestions = () => {
    if (!showSuggestions || aiSuggestions.descriptions.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-600 font-medium">AI Suggestions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {aiSuggestions.descriptions.map((suggestion, idx) => (
            <Button
              key={idx}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleInputChange('description', suggestion)}
              className="text-xs h-auto py-1 px-2 whitespace-normal text-left hover:bg-blue-50 hover:border-blue-300"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    );
  };

const renderSubcategorySuggestions = () => {
  if (!showSuggestions || aiSuggestions.subcategories.length === 0) return null;
  
  // ✅ Filter suggestions to only show ones that exist in dropdown
  const validSuggestions = aiSuggestions.subcategories.filter(suggestion =>
    subcategoryOptions.includes(suggestion)
  );
  
  if (validSuggestions.length === 0) return null;
  
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3 w-3 text-blue-600" />
        <span className="text-xs text-blue-600 font-medium">Suggested sub-categories:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {validSuggestions.map((suggestion, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="cursor-pointer hover:bg-blue-100"
            onClick={() => {
              // ✅ Only set if suggestion exists in dropdown
              if (subcategoryOptions.includes(suggestion)) {
                handleInputChange('subcategory', suggestion);
              }
            }}
          >
            {suggestion}
          </Badge>
        ))}
      </div>
    </div>
  );
};


  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Step {step} of 5</span>
        <span className="text-sm text-gray-600">{Math.round((step / 5) * 100)}% Complete</span>
      </div>
      <Progress value={(step / 5) * 100} className="h-2" />
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Tell us about the items you're donating</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Donation Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Warm Winter Coats, King Size Blanket"
            className="mt-1"
          />
          {renderTitleSuggestions()}
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the items, their condition, and any special notes..."
            rows={4}
            className="mt-1"
          />
          {renderDescriptionSuggestions()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subcategory">Sub-Category *</Label>
            <Select 
              value={formData.subcategory} 
              onValueChange={(value) => handleInputChange('subcategory', value)}
              disabled={subcategoryOptions.length === 0}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select sub-category" />
              </SelectTrigger>
              <SelectContent>
                {subcategoryOptions.map(subcat => (
                  <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderSubcategorySuggestions()}
          </div>

          <div>
            <Label htmlFor="condition">Condition *</Label>
            <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map(cond => (
                  <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
  <Label htmlFor="season">Season/Usage *</Label>
  <Select value={formData.season} onValueChange={(value) => handleInputChange('season', value)}>
    <SelectTrigger className="mt-1">
      <SelectValue placeholder="Select season" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Summer">Summer</SelectItem>
      <SelectItem value="Winter">Winter</SelectItem>
      <SelectItem value="Monsoon">Monsoon/Rainy</SelectItem>
      <SelectItem value="All Season">All Season/Year-Round</SelectItem>
    </SelectContent>
  </Select>
</div>


          <div>
            <Label htmlFor="quantity">Total Number of Items *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="urgent"
            checked={formData.urgentNeeded}
            onCheckedChange={(checked) => handleInputChange('urgentNeeded', checked)}
          />
          <Label htmlFor="urgent" className="text-sm">
            Mark as urgent need (items will be prioritized)
          </Label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Details</h2>
        <p className="text-gray-600">Specify sizes</p>
      </div>

      <div>
        <Label className="text-base font-medium">Available Sizes *</Label>
        <p className="text-sm text-gray-500 mb-2">Select all that apply. Select at least one.</p>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
          {currentSizeOptions.map(size => (
            <Button
              key={size}
              type="button"
              variant={formData.sizes.includes(size) ? "default" : "outline"}
              size="sm"
              onClick={() => handleMultiSelect('sizes', size)}
              className="h-10"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* 💡 REMOVED: Colors Section */}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pickup & Delivery</h2>
        <p className="text-gray-600">How can recipients get these items?</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="location">Pickup Location *</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleLocationSearch(e.target.value)}
              placeholder="Start typing your address (India)..."
              className="pl-10"
              autoComplete="off"
            />
            {isSearchingAddress && (
              <div className="absolute right-3 top-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {showAddressDropdown && addressSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 text-sm"
                  onClick={() => selectAddress(suggestion)}
                >
                  <p className="font-medium text-gray-900">{suggestion.display_name.split(',')[0]}</p>
                  <p className="text-gray-500 text-xs truncate">{suggestion.display_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="pickup"
            checked={formData.pickupAvailable}
            onCheckedChange={(checked) => handleInputChange('pickupAvailable', checked)}
          />
          <Label htmlFor="pickup">Pickup available at location</Label>
        </div>

        <div>
          <Label htmlFor="delivery">Delivery Radius (km)</Label>
          <Input
            id="delivery"
            type="number"
            min="0"
            max="100"
            value={formData.deliveryRadius}
            onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value))}
            className="mt-1 max-w-32"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">Review your donation details before submitting</p>
      </div>

      {targetNgo && (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Heart className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You are donating directly to <strong>{targetNgo.name}</strong>. 
            They will be notified immediately upon approval.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{formData.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>Category:</strong> {categories.find(c => c.value === formData.category)?.label}</div>
            <div><strong>Condition:</strong> {conditions.find(c => c.value === formData.condition)?.label}</div>
            <div><strong>Quantity:</strong> {formData.quantity} items</div>
            <div><strong>Location:</strong> {formData.location}</div>
          </div>
          <div><strong>Description:</strong> <p className="text-gray-600 mt-1">{formData.description}</p></div>
          <div>
            <strong>Sizes:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.sizes.length > 0 ? formData.sizes.map(size => (
                <Badge key={size} variant="secondary">{size}</Badge>
              )) : <Badge variant="outline">Various</Badge>}
            </div>
          </div>
          {/* 💡 REMOVED: Colors display */}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-purple-600" />
          Select an NGO
        </h2>
        <p className="text-gray-600">Choose an NGO to notify directly (Optional)</p>
      </div>

      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Recommended
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Browse Nearby
          </TabsTrigger>
        </TabsList>

      <TabsContent value="recommended">
  {loadingRecommendations ? (
    <div className="text-center py-12">
      <Clock className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
      <p className="text-gray-600">Finding the perfect NGOs for your donation...</p>
    </div>
  ) : recommendedNGOs.length > 0 ? (
    <div className="space-y-4">
      {recommendedNGOs.slice(0, 5).map((ngo, idx) => {
        // ✅ FIX: Get consistent ID
        const ngoId = ngo._id || ngo.id;
        const isSelected = selectedNgoId === ngoId;
        
        console.log('NGO Card:', {
          name: ngo.name,
          ngoId: ngoId,
          selectedNgoId: selectedNgoId,
          isSelected: isSelected
        });
        
        return (
          <Card 
            key={ngoId || idx} 
            className={`cursor-pointer transition-all border-2 ${
              isSelected 
                ? 'border-green-500 bg-green-50' 
                : 'border-transparent hover:border-blue-300'
            }`}
            onClick={() => {
              console.log('Clicked NGO:', ngo.name, 'ID:', ngoId);
              setSelectedNgoId(ngoId);
            }}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
  <h3 className="text-lg font-bold text-gray-900">{ngo.name}</h3>
  <p className="text-sm text-gray-600">
    {ngo.location?.city || ngo.city || ngo.location?.address || 'Unknown'}
  </p>
</div>

                {isSelected ? (
                  <Badge className="bg-green-600 flex gap-1">
                    <CheckCircle className="h-3 w-3"/> Selected
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-blue-600">
                    {(ngo.score * 100).toFixed(0)}% Match
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-2 text-sm">
                <div><span className="font-medium">Trust:</span> {ngo.trust_score}/5 ⭐</div>
                <div><span className="font-medium">Impact:</span> {ngo.impact_score}/5</div>
                <div><span className="font-medium">Distance:</span> {ngo.distance ? `${ngo.distance.toFixed(1)}km` : 'N/A'}</div>
              </div>

              {ngo.reason && (
                <div className="bg-white/50 p-2 rounded text-sm text-blue-900">
                  <strong>Why:</strong> {ngo.reason}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  ) : (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>No specific AI matches found. Try the Nearby tab.</AlertDescription>
    </Alert>
  )}
</TabsContent>


<TabsContent value="nearby">
  {loadingNearby ? (
    <div className="text-center py-12">
      <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400 mb-4" />
      <p className="text-gray-600">Searching for NGOs in your area...</p>
    </div>
  ) : nearbyNGOs.length > 0 ? (
    <div className="space-y-4">
      {nearbyNGOs.map((ngo, idx) => {
        // ✅ FIX: Get consistent ID
        const ngoId = ngo._id || ngo.id;
        const isSelected = selectedNgoId === ngoId;
        
        return (
          <Card 
            key={ngoId || idx} 
            className={`cursor-pointer transition-all border-2 ${
              isSelected 
                ? 'border-green-500 bg-green-50' 
                : 'border-transparent hover:border-blue-300'
            }`}
            onClick={() => {
              console.log('Clicked Nearby NGO:', ngo.name, 'ID:', ngoId);
              setSelectedNgoId(ngoId);
            }}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{ngo.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ngo.city || ngo.location?.city}, {ngo.location?.state || 'India'}
                  </p>
                </div>
                {isSelected && (
                  <Badge className="bg-green-600 flex gap-1">
                    <CheckCircle className="h-3 w-3"/> Selected
                  </Badge>
                )}
              </div>
              
              {ngo.organization?.name && (
                <p className="text-sm text-gray-500 mb-2">{ngo.organization.name}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <span className="font-medium">Trust Score:</span> {ngo.trust_score || 'N/A'}/5 ⭐
                </div>
                <div>
                  <span className="font-medium">Impact Score:</span> {ngo.impact_score || 'N/A'}/5
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
      <p className="text-gray-600 font-medium">No registered NGOs found nearby.</p>
      {!formData.coordinates || formData.coordinates.length !== 2 ? (
        <div className="mt-3">
          <p className="text-sm text-red-500">⚠️ Please select a valid address in Step 3</p>
          <p className="text-xs text-gray-500 mt-1">
            Current location: {formData.location || 'Not set'}
          </p>
          <p className="text-xs text-gray-500">
            Coordinates: {formData.coordinates ? `[${formData.coordinates[0]}, ${formData.coordinates[1]}]` : 'Not set'}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mt-2">
          Try increasing the delivery radius or check a different location
        </p>
      )}
    </div>
  )}
</TabsContent>

      </Tabs>

      <Alert className="bg-blue-50 border-blue-200 mt-4">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          Selecting an NGO is optional. If you don't select one, your donation will be visible to all verified NGOs.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/donor-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Donation</h1>
          <p className="text-gray-600 mt-2">Help others by donating items you no longer need</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderProgressBar()}
            
            {targetNgo && step === 1 && (
               <Alert className="bg-blue-50 border-blue-200 mb-6">
                <Heart className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Donating to: <strong>{targetNgo.name}</strong>
                </AlertDescription>
              </Alert>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              ) : <div></div>}
              
              <div className="ml-auto">
                {step < 5 ? (
                  <Button onClick={handleNext} disabled={!validateStep(step)}>
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Submit Donation
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonationForm;