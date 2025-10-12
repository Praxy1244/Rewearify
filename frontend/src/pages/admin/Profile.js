import React, { useState } from 'react';
import { User, Mail, MapPin, Calendar, Shield, Key, Bell, Palette, Globe, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';

const Profile = () => {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: 'Platform Admin',
    email: 'admin@rewearify.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'System administrator managing the ReWearify platform to connect donations with those in need.',
    timezone: 'America/Los_Angeles',
    language: 'English',
    role: 'Admin'
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    loginNotifications: true,
    sessionTimeout: '30',
    passwordLastChanged: '2024-10-15'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    donationAlerts: true,
    userActivityAlerts: false,
    systemAlerts: true,
    weeklyReports: true,
    marketingEmails: false
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true
  });

  const handleProfileSave = () => {
    // Here you would make an API call to update profile
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  const handleSecuritySave = () => {
    toast({
      title: "Security Settings Updated",
      description: "Your security preferences have been saved.",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Notification Settings Updated", 
      description: "Your notification preferences have been saved.",
    });
  };

  const handleAppearanceSave = () => {
    toast({
      title: "Appearance Settings Updated",
      description: "Your appearance preferences have been saved.",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-xl">PA</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{profileData.name}</h3>
                  <p className="text-gray-600">{profileData.role}</p>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profileData.timezone} onValueChange={(value) => setProfileData({...profileData, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={profileData.language} onValueChange={(value) => setProfileData({...profileData, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, loginNotifications: checked})}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select value={securitySettings.sessionTimeout} onValueChange={(value) => setSecuritySettings({...securitySettings, sessionTimeout: value})}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Password</Label>
                      <p className="text-sm text-gray-500">Last changed on {new Date(securitySettings.passwordLastChanged).toLocaleDateString()}</p>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSecuritySave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Donation Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified about new donations requiring approval</p>
                  </div>
                  <Switch
                    checked={notificationSettings.donationAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, donationAlerts: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>User Activity Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified about suspicious user activities</p>
                  </div>
                  <Switch
                    checked={notificationSettings.userActivityAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, userActivityAlerts: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified about system status and maintenance</p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-gray-500">Receive weekly analytics reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-500">Receive updates about new features and improvements</p>
                  </div>
                  <Switch
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, marketingEmails: checked})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={appearanceSettings.theme} onValueChange={(value) => setAppearanceSettings({...appearanceSettings, theme: value})}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">Use a more compact layout to fit more content</p>
                  </div>
                  <Switch
                    checked={appearanceSettings.compactMode}
                    onCheckedChange={(checked) => setAppearanceSettings({...appearanceSettings, compactMode: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Avatars</Label>
                    <p className="text-sm text-gray-500">Display user avatars throughout the interface</p>
                  </div>
                  <Switch
                    checked={appearanceSettings.showAvatars}
                    onCheckedChange={(checked) => setAppearanceSettings({...appearanceSettings, showAvatars: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Animations</Label>
                    <p className="text-sm text-gray-500">Enable smooth animations and transitions</p>
                  </div>
                  <Switch
                    checked={appearanceSettings.animationsEnabled}
                    onCheckedChange={(checked) => setAppearanceSettings({...appearanceSettings, animationsEnabled: checked})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAppearanceSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;