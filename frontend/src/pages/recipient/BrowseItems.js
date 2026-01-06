import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext'; 
import { Spinner } from '../../components/ui/spinner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner'; 
import { 
  Search, 
  MapPin, 
  Package,
  Heart,
  AlertCircle,
  Calendar
} from 'lucide-react';

// ✅ IMPORT SERVICES
import { donationService, requestService } from '../../services'; 

const BrowseItems = () => {
  const { user } = useAuth();
  
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuality, setSelectedQuality] = useState('all');
  
  // ✅ EXACT STATE FROM DASHBOARD
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '', 
    quantity: 1,
    urgency: 'medium',
    justification: '',
    deliveryAddress: ''
  });

  // ✅ FETCH DATA USING EXISTING SERVICE
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        // ✅ FIX: Add availableOnly=true to only show donations that haven't been accepted
        const response = await donationService.getDonations({ 
          status: 'approved',
          availableOnly: true // Only show donations not yet accepted by any NGO
        });
        
        let items = [];
        if (Array.isArray(response)) {
           items = response;
        } else if (response.data && Array.isArray(response.data)) {
           items = response.data; 
        } else if (response.success && Array.isArray(response.data?.data)) {
           items = response.data.data;
        } else if (Array.isArray(response.data?.items)) {
           items = response.data.items;
        } else if (response.data && Array.isArray(response.data.donations)) {
           items = response.data.donations;
        }
        
        // ✅ ADDITIONAL FILTER: Client-side check to ensure no acceptedBy
        items = items.filter(item => !item.acceptedBy);
        
        setDonations(items);
      } catch (err) {
        console.error("Failed to load donations", err);
        setError("Failed to load available donations.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'children', label: "Children's" },
    { value: 'household', label: 'Household' },
    { value: 'other', label: 'Other' },
  ];
  
  const qualityLevels = [
    { value: 'all', label: 'All Quality Levels' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  const filteredItems = useMemo(() => {
    return donations.filter(item => {
      const matchesSearch = (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQuality = selectedQuality === 'all' || item.condition === selectedQuality;
      
      return matchesSearch && matchesCategory && matchesQuality;
    });
  }, [donations, searchQuery, selectedCategory, selectedQuality]);

  // ✅ OPEN MODAL (Logic from Dashboard)
 // ✅ OPEN MODAL (Logic from Dashboard)
const handleRequest = (item) => {
  console.log('🔵 handleRequest called with item:', item);
  console.log('🔵 User data:', user);
  
  setSelectedItem(item);
  setRequestForm({
    title: `Request for ${item.title}`,
    quantity: 1,
    urgency: 'medium',
    justification: '',
    deliveryAddress: user?.location?.address || ''
  });
  setShowRequestModal(true);
  
  console.log('🔵 Modal should open now, showRequestModal:', true);
};


  // ✅ SUBMIT LOGIC (Exact Copy from Dashboard to fix 422 Error)
 const handleRequestSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedItem) {
    toast.error('No item selected');
    return;
  }
  
  if (!user?._id) {
    toast.error('User not logged in');
    return;
  }
  
  try {
    setSubmitting(true);
    
    // ✅ FIXED: Match CreateRequest payload structure
    const requestPayload = {
      title: requestForm.title.trim(),
      description: requestForm.justification.trim(),
      category: selectedItem.category,
      subcategory: selectedItem.subcategory || 'Other', // ✅ ADD subcategory
      urgency: requestForm.urgency,
      quantity: parseInt(requestForm.quantity),
      
      // ✅ ADD sizes (optional, default to Various)
      sizes: selectedItem.sizes || [{ size: 'Various', quantity: parseInt(requestForm.quantity) }],
      
      // ✅ ADD condition preferences
      condition: {
        acceptable: [selectedItem.condition || 'good', 'fair'],
        minimum: 'fair'
      },
      
      beneficiaries: {
        count: parseInt(requestForm.quantity),
        ageGroup: 'mixed',
        gender: 'mixed'
      },
      
      location: {
        address: requestForm.deliveryAddress || user.location?.address || 'Not specified',
        city: user.location?.city || 'Not specified',
        state: user.location?.state || 'Not specified',
        country: user.location?.country || 'India',
        coordinates: user.location?.coordinates || {
          type: 'Point',
          coordinates: [0, 0]
        }
      },
      
      timeline: {
        neededBy: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        flexible: true
      },
      
      // ✅ ADD logistics
      logistics: {
        canPickup: true,
        pickupRadius: 25,
        needsDelivery: false,
        hasTransport: false
      },
      
      // ✅ OPTIONAL: Link to donation (if backend supports it)
      donation: selectedItem._id
    };
    
    console.log('📦 Submitting request payload:', requestPayload);
    
    const response = await requestService.createRequest(requestPayload);
    
    if (response.success) {
      toast.success('Donation accepted successfully! The donor will schedule pickup. 🎉');
      setShowRequestModal(false);
      setSelectedItem(null);
      setRequestForm({
        title: '',
        quantity: 1,
        urgency: 'medium',
        justification: '',
        deliveryAddress: ''
      });
      
      // ✅ REFRESH THE LIST - Remove the accepted item immediately
      setDonations(prev => prev.filter(d => d._id !== selectedItem._id));
    } else {
      throw new Error(response.message || 'Failed to submit request');
    }
  } catch (error) {
    console.error('❌ Error submitting request:', error);
    
    let errorMsg = error.message || 'Failed to submit request.';
    
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach(err => {
        toast.error(`${err.field}: ${err.message}`);
      });
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error.data?.message) {
      errorMsg = error.data.message;
    }
    
    toast.error(errorMsg);
  } finally {
    setSubmitting(false);
  }
};


  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2 text-lg">Loading available donations...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Available Items</h1>
              <p className="text-gray-600 mt-1">Discover donation items available in your area</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Package className="w-4 h-4" />
              <span>{filteredItems.length} items available</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedQuality} onValueChange={setSelectedQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                {qualityLevels.map(quality => (
                  <SelectItem key={quality.value} value={quality.value}>
                    {quality.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item._id} className="hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                <img 
                  src={item.images?.[0]?.url || 'https://placehold.co/400x300/e2e8f0/64748b?text=Donation'} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
  <div className="mb-3 flex-1">
    <h3 className="font-semibold text-lg mb-2 text-gray-900">{item.title}</h3>
    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
  </div>
  
  <div className="space-y-3">
    {/* ✅ ADD: Donor Information */}
    {item.donor && (
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-xs text-gray-600 mb-1">Donated by</p>
        <div className="flex items-center gap-2">
          {item.donor.profile?.profilePicture?.url ? (
            <img 
              src={item.donor.profile.profilePicture.url} 
              alt={item.donor.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
              <span className="text-blue-700 font-semibold text-sm">
                {item.donor.name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-gray-900">{item.donor.name}</p>
            {item.donor.location?.city && (
              <p className="text-xs text-gray-600">{item.donor.location.city}</p>
            )}
          </div>
        </div>
      </div>
    )}
    
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">Quantity:</span>
      <Badge variant="secondary">{item.quantity} items</Badge>
    </div>
    
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">Quality:</span>
      <Badge className={getQualityColor(item.condition)}>
        {item.condition}
      </Badge>
    </div>

    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <MapPin className="w-4 h-4" />
      <span>{item.location?.city || 'Unknown'}</span>
    </div>
  </div>
  
  <div className="mt-6">
    <Button 
      onClick={() => handleRequest(item)} 
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Heart className="w-4 h-4 mr-2" />
      Request Item
    </Button>
  </div>
</CardContent>

            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12 col-span-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* ✅ UNIFIED POPUP MODAL (Same as Dashboard) */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Item</DialogTitle>
            <DialogDescription>
              Submit a request for: <strong>{selectedItem?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder={`Request for ${selectedItem?.title || 'item'}`}
                value={requestForm.title}
                onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                required
                minLength={5}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                5-200 characters describing your request
              </p>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity Needed *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedItem?.quantity || 999}
                value={requestForm.quantity}
                onChange={(e) => setRequestForm({...requestForm, quantity: e.target.value})}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {selectedItem?.quantity || 0}
              </p>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency Level *</Label>
              <Select 
                value={requestForm.urgency}
                onValueChange={(value) => setRequestForm({...requestForm, urgency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Can wait</SelectItem>
                  <SelectItem value="medium">Medium - Needed soon</SelectItem>
                  <SelectItem value="high">High - Urgent need</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="justification">Justification/Reason *</Label>
              <Textarea
                id="justification"
                placeholder="Explain why you need this item and how it will be used..."
                value={requestForm.justification}
                onChange={(e) => setRequestForm({...requestForm, justification: e.target.value})}
                required
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                placeholder={user?.location?.address || "Enter delivery address"}
                value={requestForm.deliveryAddress}
                onChange={(e) => setRequestForm({...requestForm, deliveryAddress: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use your organization address
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowRequestModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseItems;
