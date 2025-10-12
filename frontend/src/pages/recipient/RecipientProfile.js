import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Shield,
  Camera,
  Save,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecipientProfile = () => {
  const { user, updateUserProfile } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    ngoName: user.ngo.name,
    ngoLocation: user.ngo.location,
    ngoAddress: user.ngo.address,
    ngoDescription: user.ngo.description
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const updatedProfile = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      ngo: {
        ...user.ngo,
        name: formData.ngoName,
        location: formData.ngoLocation,
        address: formData.ngoAddress,
        description: formData.ngoDescription
      }
    };

    updateUserProfile(updatedProfile);
    setIsEditing(false);
    
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      ngoName: user.ngo.name,
      ngoLocation: user.ngo.location,
      ngoAddress: user.ngo.address,
      ngoDescription: user.ngo.description
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/recipient-dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-1">Manage your personal and organization information</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <Avatar className="w-32 h-32 mx-auto">
                      <AvatarImage src={user.profilePicture} alt={user.name} />
                      <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button 
                        size="sm" 
                        className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                        variant="secondary"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                    <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                      <div className="text-center">
                        <div className="font-semibold text-lg text-gray-900">{user.stats.totalRequests}</div>
                        <div>Total Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-gray-900">{user.stats.itemsReceived}</div>
                        <div>Items Received</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-gray-900">{user.stats.peopleHelped}</div>
                        <div>People Helped</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Organization Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Organization Information</span>
                  {user.ngo.verified && (
                    <Badge className="bg-green-100 text-green-800 ml-auto">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified NGO
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ngoName">Organization Name</Label>
                  <Input
                    id="ngoName"
                    value={formData.ngoName}
                    onChange={(e) => handleInputChange('ngoName', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ngoLocation">Location</Label>
                    <Input
                      id="ngoLocation"
                      value={formData.ngoLocation}
                      onChange={(e) => handleInputChange('ngoLocation', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="ngoAddress">Full Address</Label>
                  <Input
                    id="ngoAddress"
                    value={formData.ngoAddress}
                    onChange={(e) => handleInputChange('ngoAddress', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ngoDescription">Organization Description</Label>
                  <Textarea
                    id="ngoDescription"
                    value={formData.ngoDescription}
                    onChange={(e) => handleInputChange('ngoDescription', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                    rows={4}
                    placeholder="Describe your organization's mission and activities..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Verification Status</h4>
                      <p className="text-sm text-gray-600">
                        Your organization is {user.ngo.verified ? 'verified' : 'pending verification'}
                      </p>
                    </div>
                    {user.ngo.verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="w-4 h-4 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Partner Status</h4>
                      <p className="text-sm text-gray-600">
                        {user.ngo.activePartner ? 'Active partner in the network' : 'Not an active partner'}
                      </p>
                    </div>
                    {user.ngo.activePartner ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        Active Partner
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientProfile;