import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft, Save, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { donationService } from '../../services';

// --- Data maps (same as DonationForm) ---
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

const DonationEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    condition: '',
    quantity: 1,
    sizes: [], 
    // 💡 REMOVED: colors
    location: '',
    pickupAvailable: true,
    deliveryRadius: 10,
    urgentNeeded: false,
    tags: []
  });

  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [currentSizeOptions, setCurrentSizeOptions] = useState(sizeMap.default);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setPageLoading(true);
        const response = await donationService.getDonationById(id);
        if (response.success) {
          const donation = response.data.donation;
          
          const userId = user._id || user.id;
          if (donation.donor._id !== userId) {
             toast({ 
               title: "Access Denied", 
               description: "You are not authorized to edit this donation.",
               variant: "destructive" 
             });
             setError("You are not authorized to edit this donation.");
             navigate('/donor/my-donations');
             return;
          }

          setFormData({
            title: donation.title,
            description: donation.description,
            category: donation.category,
            subcategory: donation.subcategory || '',
            condition: donation.condition,
            quantity: donation.quantity,
            sizes: donation.sizes.map(s => s.size), 
            // 💡 REMOVED: colors
            location: donation.location.address,
            pickupAvailable: donation.availability?.pickupAvailable || true,
            deliveryRadius: donation.availability?.deliveryRadius || 10,
            urgentNeeded: donation.preferences?.urgentNeeded || false,
            tags: donation.tags || []
          });
        } else {
          toast({ 
            title: "Failed to load donation", 
            description: response.message,
            variant: "destructive" 
          });
          setError("Failed to load donation data.");
        }
      } catch (err) {
        toast({ 
          title: "An error occurred", 
          description: err.message,
          variant: "destructive" 
        });
        setError("An error occurred while loading the donation.");
      } finally {
        setPageLoading(false);
      }
    };
    
    if (id && user) {
      fetchDonation();
    }
  }, [id, user, navigate, toast]);

  useEffect(() => {
    if (formData.category) {
      setSubcategoryOptions(categoryMap[formData.category] || []);
      const sizingCategory = getSizingCategory(formData.category);
      setCurrentSizeOptions(sizeMap[sizingCategory] || sizeMap.default);
    }
  }, [formData.category]);

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

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value) 
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
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
      zipCode: ''
    };

    const formattedSizes = formData.sizes.map(size => ({
      size: size,
      quantity: 1 
    }));
    
    if (formattedSizes.length === 0 && formData.quantity > 0) {
        formattedSizes.push({ size: 'Various', quantity: formData.quantity });
    }

    const donationPayload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      condition: formData.condition,
      quantity: formData.quantity,
      sizes: formattedSizes,
      // 💡 REMOVED: colors
      location: formattedLocation,
      availability: {
        pickupAvailable: formData.pickupAvailable,
        deliveryRadius: formData.deliveryRadius,
      },
      preferences: {
        urgentNeeded: formData.urgentNeeded,
      },
      tags: [formData.category, formData.subcategory] // Removed colors from tags
    };

    try {
      const response = await donationService.updateDonation(id, donationPayload);

      if (response.success) {
        toast({
          title: "Donation Updated!",
          description: "Your changes have been saved.",
        });
        navigate(`/donor/donations/${id}`);
      } else {
        toast({
          title: "Update Failed",
          description: response.message || "Could not update the donation.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating donation:", error);
      toast({
        title: "An Error Occurred",
        description: error.message || "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/donor/my-donations')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Donations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/donor/donations/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Donation</h1>
          <p className="text-gray-600 mt-2">Update the details for your donation</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-6">
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
                  Mark as urgent need
                </Label>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Available Sizes *</Label>
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

            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Pickup Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State (e.g., New York, NY)"
                  className="mt-1"
                />
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
            
            <div className="flex justify-end mt-8 pt-6 border-t">
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonationEdit;