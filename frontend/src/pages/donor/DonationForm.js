import React, { useState } from 'react';
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
import donationService from '../../services/donationService';

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
    condition: '',
    quantity: 1,
    sizes: [],
    colors: [],
    location: user?.location || '',
    pickupAvailable: true,
    deliveryRadius: 10,
    urgentNeeded: false,
    tags: []
  });

  const categories = [
    { value: 'outerwear', label: 'Outerwear & Coats' },
    { value: 'formal', label: 'Formal & Business' },
    { value: 'casual', label: 'Casual Wear' },
    { value: 'children', label: "Children's Clothing" },
    { value: 'accessories', label: 'Accessories' },
    { value: 'shoes', label: 'Footwear' },
    { value: 'activewear', label: 'Activewear & Sports' }
  ];

  const conditions = [
    { value: 'excellent', label: 'Excellent - Like new' },
    { value: 'good', label: 'Good - Minor wear' },
    { value: 'fair', label: 'Fair - Some wear but usable' }
  ];

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y'];
  const colorOptions = ['Black', 'White', 'Gray', 'Navy', 'Brown', 'Red', 'Blue', 'Green', 'Pink', 'Purple', 'Yellow', 'Orange'];

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
        return formData.title && formData.description && formData.category && formData.condition;
      case 2:
        return formData.sizes.length > 0 && formData.colors.length > 0;
      case 3:
        return formData.location;
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

  // The NEW and IMPROVED handleSubmit function
const handleSubmit = async () => {
  setLoading(true);

  // We no longer create the full donation object here.
  // The backend will handle setting the donorId, status, createdAt, etc.
  const donationPayload = {
    title: formData.title,
    description: formData.description,
    category: formData.category,
    condition: formData.condition,
    quantity: formData.quantity,
    sizes: formData.sizes,
    colors: formData.colors,
    location: formData.location,
    pickupAvailable: formData.pickupAvailable,
    deliveryRadius: formData.deliveryRadius,
    urgentNeeded: formData.urgentNeeded,
    tags: formData.tags
  };

  try {
    //
    // THIS IS THE KEY CHANGE!
    // We call our service to send the data to the backend API.
    //
    const response = await donationService.createDonation(donationPayload);

    if (response.success) {
      toast({
        title: "Donation Submitted Successfully!",
        description: "Your donation is now pending admin approval.",
      });
      navigate('/donor/my-donations');
    } else {
      // Handle errors returned from the backend
      toast({
        title: "Submission Failed",
        description: response.error || "Could not create the donation.",
        variant: "destructive"
      });
    }
  } catch (error) {
    // Handle network errors or other exceptions
    console.error("Error creating donation:", error);
    toast({
      title: "An Error Occurred",
      description: "Please check your connection and try again.",
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
            placeholder="e.g., Winter Coats Collection, Business Attire Set"
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
        </div>

        <div>
          <Label htmlFor="quantity">Number of Items</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
            className="mt-1 max-w-32"
          />
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Clothing Details</h2>
        <p className="text-gray-600">Specify sizes, colors, and quantity</p>
      </div>

      <div>
        <Label className="text-base font-medium">Available Sizes *</Label>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
          {sizeOptions.map(size => (
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

      <div>
        <Label className="text-base font-medium">Colors *</Label>
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

  // Step 3: Pickup & Delivery
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
            placeholder="City, State/Country"
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
              {formData.sizes.map(size => (
                <Badge key={size} variant="secondary">{size}</Badge>
              ))}
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
          <p className="text-gray-600 mt-2">Help others by donating clothes you no longer need</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderProgressBar()}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
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
