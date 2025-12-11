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
import { 
  User, Shield, Key, Bell, Palette, Save, Camera, Loader2, 
  Brain, Sparkles, Building2, MapPin, Globe, Lock
} from 'lucide-react';

const Profile = () => {
  const { user, updateUserContext } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  // Helper to fix image URLs
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

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
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                    <AvatarImage src={getImageUrl(user.profile?.profilePicture?.url)} />
                    <AvatarFallback className="text-2xl bg-green-100 text-green-700">
                      {user.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon" variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full shadow-md h-8 w-8"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                    {user.role === 'recipient' && (
                      <Badge className={user.organization?.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {user.organization?.verified ? "Verified NGO" : "Pending Verification"}
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