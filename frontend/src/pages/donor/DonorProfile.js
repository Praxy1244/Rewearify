import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { User, Mail, Phone, MapPin, Building, Save, Edit, X, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, BarChart } from 'lucide-react';

const DonorProfile = () => {
  const { user, updateUserContext } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // AI Profile states - NEW
  const [aiProfile, setAIProfile] = useState(null);
  const [loadingAI, setLoadingAI] = useState(true);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    locationAddress: '',
    locationCity: '',
    locationState: '',
    bio: '',
    organization: ''
  });

  // Load user data into form when component mounts or user object changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.contact?.phone || '',
        locationAddress: user.location?.address || '',
        locationCity: user.location?.city || '',
        locationState: user.location?.state || '',
        bio: user.profile?.bio || '',
        organization: user.organization?.name || ''
      });
    }
  }, [user]);

  // Fetch AI Profile - NEW
  useEffect(() => {
    fetchAIProfile();
  }, []);

  const fetchAIProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/recommendations/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAIProfile(data.profile);
        console.log('AI Profile:', data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch AI profile:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    const userId = user._id || user.id;
    if (!userId) {
      toast({
        title: "Error",
        description: "Could not find user ID. Please log in again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const profileData = {
      name: formData.name,
      contact: {
        phone: formData.phone
      },
      location: {
        address: formData.locationAddress,
        city: formData.locationCity,
        state: formData.locationState,
        country: user.location?.country || 'USA'
      },
      profile: {
        bio: formData.bio
      },
      organization: {
        name: formData.organization
      }
    };

    try {
      const response = await userService.updateUserProfile(userId, profileData);
      
      if (response.success) {
        updateUserContext(response.data.user);
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        });
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update profile.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "An Error Occurred",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.contact?.phone || '',
        locationAddress: user.location?.address || '',
        locationCity: user.location?.city || '',
        locationState: user.location?.state || '',
        bio: user.profile?.bio || '',
        organization: user.organization?.name || ''
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/donor-dashboard')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src={user.profile?.profilePicture?.url} alt={user.name} />
                <AvatarFallback className="text-4xl">
                  {user.name ? user.name.charAt(0) : 'D'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800 capitalize">
                {user.role}
              </Badge>
              <p className="text-gray-600 text-sm mt-4">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Profile Information</CardTitle>
                <CardDescription>Manage your personal details.</CardDescription>
              </div>
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                    placeholder="e.g., +1 555-123-4567"
                  />
                </div>
                {/* Organization */}
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                    placeholder="e.g., My Company"
                  />
                </div>
              </div>

              {/* Location Fields */}
              <div className="space-y-2">
                <Label htmlFor="locationAddress">Address</Label>
                <Input
                  id="locationAddress"
                  value={formData.locationAddress}
                  onChange={(e) => handleInputChange('locationAddress', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-100' : ''}
                  placeholder="e.g., 123 Main St"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="locationCity">City</Label>
                  <Input
                    id="locationCity"
                    value={formData.locationCity}
                    onChange={(e) => handleInputChange('locationCity', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                    placeholder="e.g., New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationState">State</Label>
                  <Input
                    id="locationState"
                    value={formData.locationState}
                    onChange={(e) => handleInputChange('locationState', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                    placeholder="e.g., NY"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-100' : ''}
                  placeholder="Tell us a little about yourself..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI DONOR PROFILE CARD - NEW */}
      {!loadingAI && aiProfile && (
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              Your AI Donor Profile
            </CardTitle>
            <CardDescription>
              Generated from your donation patterns and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {aiProfile.donation_frequency || 0}
                </div>
                <div className="text-sm text-gray-600">Total Donations</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {aiProfile.activity_level || 'New'}
                </div>
                <div className="text-sm text-gray-600">Activity Level</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {aiProfile.preferred_categories?.[0] || 'None'}
                </div>
                <div className="text-sm text-gray-600">Top Category</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {aiProfile.avg_items_per_donation || 0}
                </div>
                <div className="text-sm text-gray-600">Avg Items/Donation</div>
              </div>
            </div>

            {aiProfile.preferred_categories && aiProfile.preferred_categories.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Your Donation Preferences
                </h4>
                <div className="flex flex-wrap gap-2">
                  {aiProfile.preferred_categories.map((cat, idx) => (
                    <Badge key={idx} variant="secondary">{cat}</Badge>
                  ))}
                </div>
              </div>
            )}

            {aiProfile.insights && (
              <div className="mt-4 p-4 bg-purple-100 rounded-lg">
                <p className="text-sm text-purple-900">
                  <strong>💡 AI Insight:</strong> {aiProfile.insights}
                </p>
              </div>
            )}

            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/donor/ai-insights')}
              >
                <BarChart className="h-4 w-4 mr-2" />
                View Full AI Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message for new users - NEW */}
      {!loadingAI && !aiProfile && (
        <Card className="mt-8 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Brain className="h-12 w-12 mx-auto mb-3 text-blue-600" />
            <p className="text-gray-700 mb-2 font-semibold">
              Unlock Your AI Donor Profile
            </p>
            <p className="text-gray-600 text-sm">
              Make a few donations to get personalized insights and recommendations!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DonorProfile;
