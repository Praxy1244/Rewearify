import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Building, User, Save, Loader2 } from 'lucide-react';
import RewearifyLogo from '../../components/Layout/RewearifyLogo';
import { useToast } from '../../hooks/use-toast';
import { userService } from '../../services'; // We need the user service

const SelectRole = () => {
  const { user, updateUserProfile } = useAuth(); // Get user and update function
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [role, setRole] = useState('donor');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'recipient' && !organizationName.trim()) {
      setError('Organization name is required to register as an NGO.');
      return;
    }

    setLoading(true);

    try {
      const updatedData = {
        role: role,
        organization: {
          name: organizationName
        }
      };

      // We'll use the updateUserProfile from AuthContext, which updates the user locally
      // but first, we need to make an API call. Let's use userService.
      const response = await userService.updateUserProfile(user._id, updatedData);

      if (response.success) {
        // Manually update the user in AuthContext with the new data
        updateUserProfile(response.data.user); 
        toast({
          title: "Profile Updated!",
          description: "Your role has been set. Welcome to Rewearify!",
        });
        navigate('/'); // Redirect to the main landing page
      } else {
        setError(response.message || 'Failed to update role.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <RewearifyLogo />
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">One Last Step</CardTitle>
            <CardDescription className="text-center">
              Welcome, {user?.name}! Please tell us who you are.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <RadioGroup value={role} onValueChange={setRole}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="donor" id="donor" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="donor" className="font-medium text-gray-900 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        I am a Donor
                      </Label>
                      <p className="text-sm text-gray-600">I want to donate clothes and help others.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="recipient" id="recipient" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="recipient" className="font-medium text-gray-900 flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        I am an NGO/Organization
                      </Label>
                      <p className="text-sm text-gray-600">I represent an organization that needs donations.</p>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              {role === 'recipient' && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="organization">Organization Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="organization"
                      name="organization"
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="pl-10"
                      placeholder="Your organization's official name"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Complete Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelectRole;
