import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, ArrowRight, Info, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { donationService } from '../../services'; // Correct import from services/index.js

// --- Data maps for dynamic fields ---
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
// --- END: Data maps ---


const DonationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '', // <-- NEW FIELD
    condition: '',
    quantity: 1,
    sizes: [], 
    colors: [],
    location: user?.location?.address || '',
    pickupAvailable: true,
    deliveryRadius: 10,
    urgentNeeded: false,
    tags: []
  });

  // --- State for dynamic options ---
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [currentSizeOptions, setCurrentSizeOptions] = useState(sizeMap.default);

  // --- Effect to update dynamic fields when category changes ---
  useEffect(() => {
    // Update sub-categories
    if (formData.category && categoryMap[formData.category]) {
      setSubcategoryOptions(categoryMap[formData.category]);
    } else {
      setSubcategoryOptions([]);
    }
    // Reset subcategory if category changes
    handleInputChange('subcategory', ''); 

    // Update size options
    const sizingCategory = getSizingCategory(formData.category);
    setCurrentSizeOptions(sizeMap[sizingCategory]);
    // Reset sizes if category changes
    handleInputChange('sizes', []); 

  }, [formData.category]);
  // --- END: New state and effect ---


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
    { value: 'household', label: 'Household (Blankets, etc.)' }, // <-- NEW
    { value: 'linens', label: 'Linens' }, // <-- NEW
    { value: 'other', label: 'Other' }, // <-- NEW
  ];

  const conditions = [
    { value: 'excellent', label: 'Excellent - Like new' },
    { value: 'good', label: 'Good - Minor wear' },
    { value: 'fair', label: 'Fair - Some wear but usable' }
  ];

  const colorOptions = ['Black', 'White', 'Gray', 'Navy', 'Brown', 'Red', 'Blue', 'Green', 'Pink', 'Purple', 'Yellow', 'Orange', 'Multi-color'];

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

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        // --- THIS IS THE FIX ---
        // We now check the length of title and description
        return formData.title.trim().length >= 5 && 
               formData.description.trim().length >= 5 && // Changed from 10 to 5
               formData.category && 
               formData.subcategory && 
               formData.condition;
        // --- END OF FIX ---
      case 2:
        return formData.sizes.length > 0 && formData.colors.length > 0;
      case 3:
        return formData.location.trim();
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in the required information to continue",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    // 1. --- DATA TRANSFORMATION ---
    // Parse the location string "City, State"
    const locationParts = formData.location.split(',').map(s => s.trim());
    const city = locationParts[0] || formData.location;
    const state = locationParts[1] || 'Unknown';

    const formattedLocation = {
      address: formData.location, 
      city: city,
      state: state,
      country: 'USA', // Assuming USA for now
      zipCode: ''
    };

    // Convert flat size array to object array
    const formattedSizes = formData.sizes.map(size => ({
      size: size,
      quantity: 1 // Simple assumption to pass validation
    }));
    
    // If no sizes were selected, use the total quantity for a "Various" size
    if (formattedSizes.length === 0 && formData.quantity > 0) {
        formattedSizes.push({ size: 'Various', quantity: formData.quantity });
    }

    // 2. --- CREATE FINAL PAYLOAD ---
    // This object matches the `donationValidations.create` in your backend
    const donationPayload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory, // <-- SEND NEW FIELD
      condition: formData.condition,
      quantity: formData.quantity,
      sizes: formattedSizes,
      colors: formData.colors,
      location: formattedLocation,
      
      availability: {
        pickupAvailable: formData.pickupAvailable,
        deliveryRadius: formData.deliveryRadius,
      },
      preferences: {
        urgentNeeded: formData.urgentNeeded,
      },
      tags: [formData.category, formData.subcategory, ...formData.colors] 
    };

    // 3. --- API CALL ---
    try {
      // We use the imported donationService
      const response = await donationService.createDonation(donationPayload);

      if (response.success) {
        toast({
          title: "Donation Submitted Successfully!",
          description: "Your donation is now pending admin approval.",
        });
        navigate('/donor/my-donations'); 
      } else {
        // Handle backend errors (e.g., validation errors)
        toast({
          title: "Submission Failed",
          description: response.message || "Could not create the donation. Please check your fields.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Handle network errors
      console.error("Error creating donation:", error);
      toast({
        title: "An Error Occurred",
        description: error.message || "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Step {step} of 4</span>
        <span className="text-sm text-gray-600">{Math.round((step / 4) * 100)}% Complete</span>
      </div>
      <Progress value={(step / 4) * 100} className="h-2" />
    </div>
  );

  // Step 1: Basic Info
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

          {/* --- NEW SUB-CATEGORY FIELD --- */}
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
          {/* --- END NEW FIELD --- */}

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
            Mark as urgent need (items will be prioritized)
          </Label>
        </div>
      </div>
    </div>
  );

  // Step 2: Sizes & Colors
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Details</h2>
        <p className="text-gray-600">Specify sizes and colors</p>
      </div>

      {/* --- DYNAMIC SIZES --- */}
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
      {/* --- END DYNAMIC SIZES --- */}


      <div>
        <Label className="text-base font-medium">Colors *</Label>
        <p className="text-sm text-gray-500 mb-2">Select all that apply. Select at least one.</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
          {colorOptions.map(color => (
            <Button
              key={color}
              type="button"
              variant={formData.colors.includes(color) ? "default" : "outline"}
              size="sm"
              onClick={() => handleMultiSelect('colors', color)}
              className="h-10"
            >
              {color}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  // Step 3: Pickup & Delivery (No changes needed)
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pickup & Delivery</h2>
        <p className="text-gray-600">How can recipients get these items?</p>
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
          <p className="text-sm text-gray-600 mt-1">
            How far are you willing to deliver? (0 = pickup only)
          </p>
        </div>
      </div>
    </div>
  );

  // Step 4: Review & Submit
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">Review your donation details before submitting</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formData.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Category:</strong> {categories.find(c => c.value === formData.category)?.label}
            </div>
            {/* --- NEW: Show Sub-Category --- */}
            <div>
              <strong>Sub-Category:</strong> {formData.subcategory}
            </div>
            <div>
              <strong>Condition:</strong> {conditions.find(c => c.value === formData.condition)?.label}
            </div>
            <div>
              <strong>Quantity:</strong> {formData.quantity} items
            </div>
            <div>
              <strong>Location:</strong> {formData.location}
            </div>
          </div>
          
          <div>
            <strong>Description:</strong>
            <p className="text-gray-600 mt-1">{formData.description}</p>
          </div>
          
          <div>
            <strong>Sizes:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.sizes.length > 0 ? formData.sizes.map(size => (
                <Badge key={size} variant="secondary">{size}</Badge>
              )) : <Badge variant="outline">Various</Badge>}
            </div>
          </div>
          
          <div>
            <strong>Colors:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.colors.map(color => (
                <Badge key={color} variant="secondary">{color}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your donation will be reviewed by our admin team and will be visible to recipients once approved. 
          This usually takes 24-48 hours.
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

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              ) : (
                 <div></div> // Empty div to keep "Next" button on the right
              )}
              
              <div className="ml-auto">
                {step < 4 ? (
                  <Button onClick={handleNext} disabled={!validateStep(step)}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Creating Donation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Donation
                      </>
                    )}
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