import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { useApp } from '../../contexts/AppContext'; // Using the live context
import { useToast } from '../../hooks/use-toast';
import { Spinner } from '../../components/ui/spinner'; // Import Spinner
import { Alert, AlertDescription } from '../../components/ui/alert'; // Import Alert
import { 
  Search, 
  MapPin, 
  Calendar,
  User,
  Package,
  Heart,
  AlertCircle
} from 'lucide-react';
// Note: requestService is not needed for Day 1, but will be for Day 2
// import { requestService } from '../../services'; 

const BrowseItems = () => {
  // Get live data and functions from AppContext
  const { 
    allDonations,     // This is the new prop from AppContext
    loadDonations,    // This is the function to fetch all donations
    loadingStates,  // This is the granular loading state
    errorStates,    // This is the granular error state
    addRequest      // We keep this for Day 2
  } = useApp();
  
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuality, setSelectedQuality] = useState('all');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');

  // --- DAY 1 TASK: Fetch live data ---
  useEffect(() => {
    // Fetch all "Approved" donations when the component mounts
    loadDonations({ status: 'approved' });
  }, [loadDonations]); // Dependency array ensures it runs once

  
  // Define categories, quality levels
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'children', label: "Children's" },
    { value: 'accessories', label: 'Accessories' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'household', label: 'Household' },
    { value: 'other', label: 'Other' },
  ];
  
  const qualityLevels = [
    { value: 'all', label: 'All Quality Levels' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  // Filter and search items using live data
  const filteredItems = useMemo(() => {
    // Use 'allDonations' from the context, not mock data
    return (allDonations || []).filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQuality = selectedQuality === 'all' || item.condition === selectedQuality; // Use 'condition' field
      
      return matchesSearch && matchesCategory && matchesQuality;
    });
  }, [allDonations, searchQuery, selectedCategory, selectedQuality]);

  const handleRequest = (item) => {
    setSelectedItem(item);
    setRequestQuantity(1);
    setRequestNotes('');
    setShowRequestModal(true);
  };

  // This function is ready for Day 2. 
  // It uses the local context 'addRequest' for now.
  const confirmRequest = () => {
    if (selectedItem) {
      // This uses the mock 'addRequest' from context for now
      // Day 2 will involve making this a real API call
      addRequest({
        donationId: selectedItem._id, // Use real _id from database
        itemName: selectedItem.title,
        itemImage: selectedItem.images?.[0]?.url || '',
        quantity: requestQuantity,
        notes: requestNotes
      });
      
      toast({
        title: "Request Submitted",
        description: `Your request for "${selectedItem.title}" has been submitted.`,
      });
      
      setShowRequestModal(false);
      setSelectedItem(null);
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

  // --- Loading and Error States ---
  if (loadingStates.donations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2 text-lg">Loading available donations...</span>
      </div>
    );
  }

  if (errorStates.donations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorStates.donations}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  // --- End Loading/Error States ---

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by title, description, or tags..."
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

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item._id} className="hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                <img 
                  src={item.images?.[0]?.url || 'https://placehold.co/400x300/e2e8f0/64748b?text=Donation'} 
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="mb-3 flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                </div>
                
                <div className="space-y-3">
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
                    {/* Use real data fields */}
                    <span>{item.location?.city || 'Unknown'}, {item.location?.state || ''}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                     {/* Use real data fields */}
                    <span>{item.donor?.name || 'Anonymous Donor'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                     {/* Use real data fields */}
                    <span>Posted {new Date(item.createdAt).toLocaleDateString()}</span>
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12 col-span-full">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <Search className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <img 
                  src={selectedItem.images?.[0]?.url || 'https://placehold.co/100x100/e2e8f0/64748b?text=Donation'} 
                  alt={selectedItem.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{selectedItem.title}</h4>
                  <p className="text-sm text-gray-600">{selectedItem.location?.city}</p>
                  <Badge className={getQualityColor(selectedItem.condition)}>
                    {selectedItem.condition}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="quantity">Quantity Needed</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedItem.quantity} // Use real quantity
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum available: {selectedItem.quantity}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Specify sizes, urgent need, or other details..."
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={confirmRequest} className="flex-1">
                  Submit Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRequestModal(false)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseItems;