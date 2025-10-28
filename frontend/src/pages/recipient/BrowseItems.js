import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../hooks/use-toast';
import { 
  Search, 
  MapPin, 
  Filter,
  Calendar,
  User,
  Package,
  Heart
} from 'lucide-react';
import { requestService } from '../../services';

const BrowseItems = () => {
  const { donationItems, addRequest } = useApp();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuality, setSelectedQuality] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');
  
  // Define categories, quality levels, and availability status
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'footwear', label: 'Footwear' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'household', label: 'Household Items' }
  ];
  
  const qualityLevels = [
    { value: 'all', label: 'All Quality Levels' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];
  
  const availabilityStatus = [
    { value: 'all', label: 'All Availability' },
    { value: 'available', label: 'Available' },
    { value: 'limited', label: 'Limited' },
    { value: 'reserved', label: 'Reserved' }
  ];

  // Filter and search items
  const filteredItems = useMemo(() => {
    return donationItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQuality = selectedQuality === 'all' || item.quality === selectedQuality;
      const matchesAvailability = selectedAvailability === 'all' || item.availability === selectedAvailability;
      
      return matchesSearch && matchesCategory && matchesQuality && matchesAvailability;
    });
  }, [donationItems, searchQuery, selectedCategory, selectedQuality, selectedAvailability]);

  const handleRequest = (item) => {
    setSelectedItem(item);
    setRequestQuantity(1);
    setRequestNotes('');
    setShowRequestModal(true);
  };

  const confirmRequest = () => {
    if (selectedItem) {
      addRequest({
        itemId: selectedItem.id,
        itemName: selectedItem.title,
        itemImage: selectedItem.image,
        quantity: requestQuantity,
        notes: requestNotes
      });
      
      toast({
        title: "Request Submitted",
        description: `Your request for "${selectedItem.title}" has been submitted successfully.`,
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

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'reserved': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
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
            
            <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                {availabilityStatus.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
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
            <Card key={item.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={getAvailabilityColor(item.availability)}>
                    {item.availability}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <Badge variant="secondary">{item.itemCount} items</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Quality:</span>
                    <Badge className={getQualityColor(item.quality)}>
                      {item.quality}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{item.donorName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Posted {new Date(item.datePosted).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => handleRequest(item)} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={item.availability === 'reserved'}
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
          <div className="text-center py-12">
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
                  src={selectedItem.image} 
                  alt={selectedItem.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{selectedItem.title}</h4>
                  <p className="text-sm text-gray-600">{selectedItem.location}</p>
                  <Badge className={getQualityColor(selectedItem.quality)}>
                    {selectedItem.quality}
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
                    max={selectedItem.itemCount}
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum available: {selectedItem.itemCount}
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