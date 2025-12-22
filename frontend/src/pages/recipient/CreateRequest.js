import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Save, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { requestService } from '../../services';
import aiService from '../../services/aiService';

// Category mapping (same as donation form)
const categoryMap = {
  outerwear: ['Jacket', 'Coat', 'Sweater', 'Vest'],
  formal: ['Suit', 'Dress Shirt', 'Blouse', 'Trousers', 'Skirt'],
  casual: ['T-Shirt', 'Jeans', 'Kurta', 'Shorts', 'Polo Shirt'],
  children: ['Infant Set', 'Toddler Outfit', 'Youth T-Shirt', 'Youth Jeans'],
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

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Various'];

const CreateRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    urgency: 'medium',
    quantityNeeded: 1,
    sizes: [],
    preferredConditions: ['good', 'fair'],
    beneficiaries: 1,
    deadline: ''
  });

  const [subcategoryOptions, setSubcategoryOptions] = useState([]);

  // ✅ NEW: AI Suggestions State
  const [aiSuggestions, setAISuggestions] = useState({
    titles: [],
    descriptions: [],
    subcategories: [],
    tags: []
  });
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    { value: 'household', label: 'Household Items' },
    { value: 'linens', label: 'Linens' },
    { value: 'maternity', label: 'Maternity' },
    { value: 'plus-size', label: 'Plus-Size' },
    { value: 'other', label: 'Other' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Can wait', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium - Needed soon', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High - Urgent need', color: 'bg-red-100 text-red-800' }
  ];

  const conditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  useEffect(() => {
    if (formData.category && categoryMap[formData.category]) {
      setSubcategoryOptions(categoryMap[formData.category]);
    } else {
      setSubcategoryOptions([]);
    }
    setFormData(prev => ({ ...prev, subcategory: '' }));
  }, [formData.category]);

  // ✅ NEW: Fetch AI Suggestions when category changes
useEffect(() => {
    const fetchAISuggestions = async () => {
      if (!formData.category) {
        setAISuggestions({ titles: [], descriptions: [], subcategories: [], tags: [] });
        return;
      }

      setFetchingSuggestions(true);
      try {
        // ✅ UPDATED: Pass mode: 'request'
        const response = await aiService.analyzeDonation({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: 'good',
          mode: 'request'  // ✅ THIS IS THE KEY CHANGE
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
  }, [formData.category]);


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

  const validateForm = () => {
    if (formData.title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return false;
    }
    if (formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return false;
    }
    if (!formData.category || !formData.subcategory) {
      toast.error('Please select category and subcategory');
      return false;
    }
    if (formData.quantityNeeded < 1) {
      toast.error('Quantity must be at least 1');
      return false;
    }
    if (formData.beneficiaries < 1) {
      toast.error('Number of beneficiaries must be at least 1');
      return false;
    }
    if (formData.preferredConditions.length === 0) {
      toast.error('Please select at least one preferred condition');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Format sizes as array of objects
      const formattedSizes = formData.sizes.length > 0 
        ? formData.sizes.map(size => ({
            size: size,
            quantity: Math.floor(formData.quantityNeeded / formData.sizes.length) || 1
          }))
        : [{ size: 'Various', quantity: formData.quantityNeeded }];

      // Calculate deadline (default to 30 days if not provided)
      const neededByDate = formData.deadline 
        ? new Date(formData.deadline)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Map to backend expected structure
      const requestPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        urgency: formData.urgency,
        quantity: formData.quantityNeeded,
        sizes: formattedSizes,
        condition: {
          acceptable: formData.preferredConditions,
          minimum: formData.preferredConditions.includes('fair') ? 'fair' : 'good'
        },
        beneficiaries: {
          count: formData.beneficiaries,
          ageGroup: 'mixed',
          gender: 'mixed'
        },
        location: {
          address: user?.location?.address || 'Not specified',
          city: user?.location?.city || 'Not specified',
          state: user?.location?.state || 'Not specified',
          country: user?.location?.country || 'India',
          coordinates: user?.location?.coordinates || {
            type: 'Point',
            coordinates: [0, 0]
          }
        },
        timeline: {
          neededBy: neededByDate,
          flexible: !formData.deadline
        },
        logistics: {
          canPickup: true,
          pickupRadius: 25,
          needsDelivery: false,
          hasTransport: false
        }
      };

      console.log('Sending request payload:', requestPayload);

      const response = await requestService.createRequest(requestPayload);

      if (response.success) {
        toast.success('Request created successfully!');
        navigate('/recipient/my-requests');
      } else {
        toast.error(response.message || 'Failed to create request');
      }
    } catch (error) {
      console.error('Create request error:', error);
      
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'Failed to create request');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Render AI Suggestion Components
  const renderTitleSuggestions = () => {
    if (!showSuggestions || aiSuggestions.titles.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3 w-3 text-purple-600" />
          <span className="text-xs text-purple-600 font-medium">AI Suggestions:</span>
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
              className="text-xs h-7 px-2 hover:bg-purple-50 hover:border-purple-300"
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
          <Sparkles className="h-3 w-3 text-purple-600" />
          <span className="text-xs text-purple-600 font-medium">AI Suggestions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {aiSuggestions.descriptions.map((suggestion, idx) => (
            <Button
              key={idx}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleInputChange('description', suggestion)}
              className="text-xs h-auto py-1 px-2 whitespace-normal text-left hover:bg-purple-50 hover:border-purple-300"
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
    
    // Filter suggestions to only show ones that exist in dropdown
    const validSuggestions = aiSuggestions.subcategories.filter(suggestion =>
      subcategoryOptions.includes(suggestion)
    );
    
    if (validSuggestions.length === 0) return null;
    
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3 w-3 text-purple-600" />
          <span className="text-xs text-purple-600 font-medium">Suggested sub-categories:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {validSuggestions.map((suggestion, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="cursor-pointer hover:bg-purple-100"
              onClick={() => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/recipient-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Create New Request
            <Sparkles className="h-6 w-6 text-purple-600" />
          </h1>
          <p className="text-gray-600 mt-2">Let donors know what items you need for your beneficiaries</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Winter Clothing for Children"
                  className="mt-1"
                  required
                />
                {renderTitleSuggestions()}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you need and why. Include details about your beneficiaries..."
                  rows={4}
                  className="mt-1"
                  required
                />
                {renderDescriptionSuggestions()}
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory *</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => handleInputChange('subcategory', value)}
                    disabled={!formData.category}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoryOptions.map(subcat => (
                        <SelectItem key={subcat} value={subcat}>
                          {subcat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderSubcategorySuggestions()}
                </div>
              </div>

              {/* Urgency and Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgency Level *</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity Needed *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantityNeeded}
                    onChange={(e) => handleInputChange('quantityNeeded', parseInt(e.target.value) || 1)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <Label>Sizes Needed (Optional - Select all that apply)</Label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-2">
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

              {/* Preferred Conditions */}
              <div>
                <Label>Preferred Conditions * (Select at least one)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {conditions.map(condition => (
                    <Button
                      key={condition.value}
                      type="button"
                      variant={formData.preferredConditions.includes(condition.value) ? "default" : "outline"}
                      onClick={() => handleMultiSelect('preferredConditions', condition.value)}
                    >
                      {condition.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Beneficiaries and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="beneficiaries">Number of Beneficiaries *</Label>
                  <Input
                    id="beneficiaries"
                    type="number"
                    min="1"
                    value={formData.beneficiaries}
                    onChange={(e) => handleInputChange('beneficiaries', parseInt(e.target.value) || 1)}
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many people will benefit from this donation?
                  </p>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When do you need these items by?
                  </p>
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Your request will be visible to all verified donors</p>
                  <p>Donors can browse active requests and choose to donate items that match your needs. You'll be notified when donors respond to your request.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/recipient-dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRequest;
