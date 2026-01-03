import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService, authService } from '../services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import AchievementBadge from '../components/AchievementBadge';

import { 
  User, Shield, Key, Bell, Palette, Save, Loader2, 
  Brain, Sparkles, Building2, MapPin, Globe, Lock,
  Award, TrendingUp, Users, Package, Star, ArrowRight
} from 'lucide-react';

const Profile = () => {
  const { user, updateUserContext } = useAuth();
  const { toast } = useToast();
  

  const [loading, setLoading] = useState(false);
  
  const [aiProfile, setAIProfile] = useState(null);

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    locationAddress: '',
    locationCity: '',
    locationState: '',
    bio: '',
    timezone: 'UTC',
    language: 'English',
    // Recipient Specific
    organizationName: '',
    organizationType: '',
    organizationRegNumber: '',
    organizationWebsite: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: '30'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    donationAlerts: true,
    systemAlerts: true,
    weeklyReports: false
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true
  });

  

  // --- INITIALIZATION ---
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
        timezone: user.preferences?.timezone || 'America/Los_Angeles',
        language: user.preferences?.language || 'English',
        // Recipient Fields
        organizationName: user.organization?.name || '',
        organizationType: user.organization?.type || '',
        organizationRegNumber: user.organization?.registrationNumber || '',
        organizationWebsite: user.organization?.website || ''
      });

      // Merge existing preferences if they exist
      if (user.preferences?.notifications) {
        setNotificationSettings(prev => ({ ...prev, ...user.preferences.notifications }));
      }

      if (user.role === 'donor') {
        fetchAIProfile();
      }
    }
  }, [user]);

  const fetchAIProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/recommendations/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAIProfile(data.profile || {
          donation_frequency: 0,
          activity_level: "Starter",
          insights: "Start donating to see insights!"
        });
      }
    } catch (error) {
      console.error('AI Profile Error:', error);
    }
  };

  // --- HANDLERS ---

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('profilePicture', file);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/users/${user._id}/profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      
      const data = await response.json();
      if (data.success) {
        updateUserContext(data.data.user);
        toast({ title: "Success", description: "Profile picture updated!" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // Common Data
      const updateData = {
        name: formData.name,
        contact: { phone: formData.phone },
        location: { 
          address: formData.locationAddress, 
          city: formData.locationCity, 
          state: formData.locationState,
          country: 'India' 
        },
        profile: { bio: formData.bio },
        preferences: { 
            ...user.preferences,
            timezone: formData.timezone, 
            language: formData.language 
        }
      };

      if (user.role === 'recipient') {
        updateData.organization = {
          name: formData.organizationName,
          type: formData.organizationType,
          registrationNumber: formData.organizationRegNumber,
          website: formData.organizationWebsite
        };
      }

      const response = await userService.updateUserProfile(user._id, updateData);
      if (response.success) {
        updateUserContext(response.data.user);
        toast({ title: "Profile Updated", description: "Your profile details have been saved." });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await authService.changePassword(
        passwordData.currentPassword, 
        passwordData.newPassword
      );
      if (response.success) {
        toast({ title: "Success", description: "Password updated successfully." });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast({ title: "Error", description: response.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Generic handler for settings that might not be in backend yet
  const handleSettingsSave = (type) => {
    toast({ 
      title: `${type} Settings Saved`, 
      description: "Your preferences have been updated locally." 
    });
    // In a real app, you would dispatch an API call here to save 'preferences' object
  };

  if (!user) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'recipient' ? 'Organization Profile' : 'My Profile'}
          </h1>
          <p className="text-gray-600 mt-1">Manage your account, security, and preferences</p>
        </div>
      </div>

      {/* ✨ NEW: Donor Stats Dashboard */}
      {user.role === 'donor' && (
        <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 border-2 border-purple-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Award className="h-6 w-6 text-purple-600" />
                  Your Impact Dashboard
                </CardTitle>
                <CardDescription className="text-gray-700 mt-1">
                  Track your donations and the lives you've touched
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                onClick={() => window.location.href = '/donor/achievements'}
                data-testid="view-achievements-button"
              >
                View All Achievements
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div 
                className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                data-testid="completed-donations-stat"
              >
                <Package className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-blue-600">
                  {user.statistics?.completedDonations || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1 font-medium">Completed Donations</p>
              </div>
              
              <div 
                className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                data-testid="lives-helped-stat"
              >
                <Users className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-purple-600">
                  {user.statistics?.totalBeneficiariesHelped || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1 font-medium">Lives Helped</p>
              </div>
              
              <div 
                className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                data-testid="avg-rating-stat"
              >
                <Star className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-yellow-600">
                  {user.statistics?.rating?.toFixed(1) || '0.0'}
                </div>
                <p className="text-sm text-gray-600 mt-1 font-medium">Average Rating</p>
                <p className="text-xs text-gray-500">
                  {user.statistics?.totalRatings || 0} ratings
                </p>
              </div>
              
              <div 
                className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                data-testid="achievements-stat"
              >
                <Award className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-green-600">
                  {user.achievements?.length || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1 font-medium">Achievements</p>
              </div>
            </div>

            {/* Recent Achievements */}
            {user.achievements && user.achievements.length > 0 && (
              <div className="bg-white/80 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Recent Achievements
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {user.achievements.slice(-4).reverse().map((achievement, index) => (
                    <AchievementBadge 
                      key={index} 
                      achievement={achievement} 
                      size="sm" 
                      showDetails={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Motivational Message */}
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
              <p className="text-center text-purple-900 font-medium flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>
                  {user.statistics?.completedDonations === 0 
                    ? "Start your donation journey today and make a difference!" 
                    : user.statistics?.completedDonations < 5
                    ? "Great start! Keep donating to unlock more achievements!"
                    : user.statistics?.completedDonations < 10
                    ? "You're making a real impact! Keep up the amazing work!"
                    : "You're a donation hero! Thank you for changing lives!"}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* ================= PROFILE TAB ================= */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {user.role === 'recipient' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Profile Picture Upload */}
<div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 bg-gray-50 rounded-lg">
  <ProfilePictureUpload 
    currentImage={user?.profile?.profilePicture?.url}
    onUploadSuccess={(newUrl) => {
      // Update local user context
      updateUserContext({
        ...user,
        profile: {
          ...user.profile,
          profilePicture: { url: newUrl }
        }
      });
    }}
  />
  
  <div className="flex-1 text-center md:text-left">
    <h3 className="text-xl font-semibold">{user.name}</h3>
    <p className="text-sm text-gray-500">{user.email}</p>
    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
      <Badge variant="secondary" className="capitalize">{user.role}</Badge>
      {user.role === 'recipient' && (
        <Badge className={user.verification?.isOrganizationVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
          {user.verification?.isOrganizationVerified ? "Verified NGO" : "Pending Verification"}
        </Badge>
      )}
    </div>
  </div>
</div>


              <Separator />

              {/* Recipient Fields */}
              {user.role === 'recipient' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input value={formData.organizationName} onChange={(e) => handleInputChange('organizationName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.organizationType} onValueChange={(v) => handleInputChange('organizationType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGO">NGO</SelectItem>
                        <SelectItem value="Charity">Charity</SelectItem>
                        <SelectItem value="School">School</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reg. Number</Label>
                    <Input value={formData.organizationRegNumber} onChange={(e) => handleInputChange('organizationRegNumber', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={formData.organizationWebsite} onChange={(e) => handleInputChange('organizationWebsite', e.target.value)} placeholder="https://" />
                  </div>
                </div>
              )}

              {/* General Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formData.email} disabled className="bg-gray-100" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(v) => handleInputChange('timezone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-500"/> Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-3">
                    <Label>Street Address</Label>
                    <Input value={formData.locationAddress} onChange={(e) => handleInputChange('locationAddress', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={formData.locationCity} onChange={(e) => handleInputChange('locationCity', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={formData.locationState} onChange={(e) => handleInputChange('locationState', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => handleInputChange('bio', e.target.value)} 
                  rows={4} 
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Profile (Donor Only) */}
          {user.role === 'donor' && aiProfile && (
             <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-purple-700">
                   <Brain className="h-5 w-5" /> AI Donor Insights
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                   <div className="bg-white p-3 rounded shadow-sm text-center">
                     <div className="text-2xl font-bold text-purple-600">{aiProfile.donation_frequency}</div>
                     <div className="text-xs text-gray-500">Donations</div>
                   </div>
                   <div className="bg-white p-3 rounded shadow-sm text-center">
                     <div className="text-2xl font-bold text-green-600 truncate">{aiProfile.preferred_categories?.[0] || '-'}</div>
                     <div className="text-xs text-gray-500">Top Category</div>
                   </div>
                   <div className="bg-white p-3 rounded shadow-sm text-center">
                     <div className="text-2xl font-bold text-blue-600">{aiProfile.activity_level}</div>
                     <div className="text-xs text-gray-500">Activity</div>
                   </div>
                   <div className="bg-white p-3 rounded shadow-sm text-center">
                     <div className="text-2xl font-bold text-orange-600">{Math.round(aiProfile.avg_items_per_donation || 0)}</div>
                     <div className="text-xs text-gray-500">Avg Items</div>
                   </div>
                 </div>
                 <div className="p-3 bg-white/80 rounded border border-purple-100">
                   <p className="text-sm text-purple-800 flex items-start gap-2">
                     <Sparkles className="h-4 w-4 mt-0.5 shrink-0" /> 
                     <span>{aiProfile.insights}</span>
                   </p>
                 </div>
               </CardContent>
             </Card>
          )}
        </TabsContent>

        {/* ================= SECURITY TAB ================= */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>New Password</Label>
                  <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                </div>
                
                <div className="flex justify-end border-b pb-6">
                    <Button onClick={handlePasswordChange} disabled={loading}><Key className="h-4 w-4 mr-2" /> Update Password</Button>
                </div>

                {/* Expanded Security Options (Restored from Admin) */}
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security.</p>
                  </div>
                  <Switch checked={securitySettings.twoFactorAuth} onCheckedChange={(c) => setSecuritySettings({...securitySettings, twoFactorAuth: c})} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified of new sign-ins.</p>
                  </div>
                  <Switch checked={securitySettings.loginNotifications} onCheckedChange={(c) => setSecuritySettings({...securitySettings, loginNotifications: c})} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <Select value={securitySettings.sessionTimeout} onValueChange={(v) => setSecuritySettings({...securitySettings, sessionTimeout: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => handleSettingsSave("Security")}>Save Security Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= NOTIFICATIONS TAB ================= */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive updates via email.</p>
                  </div>
                  <Switch checked={notificationSettings.email} onCheckedChange={(c) => setNotificationSettings({...notificationSettings, email: c})} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Get real-time browser alerts.</p>
                  </div>
                  <Switch checked={notificationSettings.push} onCheckedChange={(c) => setNotificationSettings({...notificationSettings, push: c})} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Donation Alerts</Label>
                    <p className="text-sm text-gray-500">Updates on your items or requests.</p>
                  </div>
                  <Switch checked={notificationSettings.donationAlerts} onCheckedChange={(c) => setNotificationSettings({...notificationSettings, donationAlerts: c})} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System & Security</Label>
                    <p className="text-sm text-gray-500">Important account updates.</p>
                  </div>
                  <Switch checked={notificationSettings.systemAlerts} onCheckedChange={(c) => setNotificationSettings({...notificationSettings, systemAlerts: c})} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSettingsSave("Notification")}><Save className="h-4 w-4 mr-2" /> Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= APPEARANCE TAB (Restored) ================= */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={appearanceSettings.theme} onValueChange={(v) => setAppearanceSettings({...appearanceSettings, theme: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">Fit more content on the screen.</p>
                  </div>
                  <Switch checked={appearanceSettings.compactMode} onCheckedChange={(c) => setAppearanceSettings({...appearanceSettings, compactMode: c})} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-sm text-gray-500">Enable smooth transitions.</p>
                  </div>
                  <Switch checked={appearanceSettings.animationsEnabled} onCheckedChange={(c) => setAppearanceSettings({...appearanceSettings, animationsEnabled: c})} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSettingsSave("Appearance")}><Save className="h-4 w-4 mr-2" /> Save Appearance</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;