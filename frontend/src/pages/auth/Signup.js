import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Building, Globe, Hash } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import RewearifyLogo from '../../components/Layout/RewearifyLogo';
import GoogleIcon from '../../components/icons/GoogleIcon';
import { Separator } from '../../components/ui/separator';

const Signup = () => {
  const [step, setStep] = useState(1);
// ... (state and other functions remain the same) ...
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
    location: '',
    organization: '', // Organization Name
    phone: '',
    bio: '',
    organizationType: '', 
    organizationRegNumber: '',
    organizationWebsite: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e) => {
// ... (this function remains the same) ...
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (name === 'role' && value === 'donor') {
      setErrors({ ...errors, organization: '' });
    }
  };

  const handleValueChange = (name, value) => {
// ... (this function remains the same) ...
    setFormData({ ...formData, [name]: value });
    if (errors[name] || errors.organization) {
      setErrors({ ...errors, [name]: '', organization: '' });
    }
  };

  const validateStep1 = () => {
// ... (this function remains the same) ...
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.role) newErrors.role = 'Please select a role';
    if (formData.role === 'recipient' && !formData.organization.trim()) {
      newErrors.organization = 'Organization name is required for recipients';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
// ... (this function remains the same) ...
    const newErrors = {};
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.organizationWebsite && !/^https?:\/\/.+\..+/.test(formData.organizationWebsite)) {
       newErrors.organizationWebsite = 'Please enter a valid URL (e.g., https://example.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
// ... (this function remains the same) ...
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  // Handle the final form submission
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // --- 💡 THE FIX IS HERE ---
      const { 
        confirmPassword, 
        organization, 
        phone, 
        bio, 
        location,
        organizationType,
        organizationRegNumber,
        organizationWebsite,
        role, // Destructure role to check it
        ...rest 
      } = formData;
      
      // Start with the basic data for ALL users
      const signupData = {
        ...rest,
        role, // Pass the role
        location: {
          address: location 
        },
        contact: {
          phone: phone
        },
        profile: {
          bio: bio
        }
      };

      // --- 💡 ONLY add organization object if the role is 'recipient' ---
      if (role === 'recipient') {
        signupData.organization = {
          name: organization,
          type: organizationType,
          registrationNumber: organizationRegNumber,
          website: organizationWebsite
        };
      }
      // If the role is 'donor', the organization key won't be sent at all.
      // --- END OF FIX ---

      const result = await signup(signupData);
      
      if (result.success) {
// ... (rest of the function remains the same) ...
        toast({
          title: "Welcome to ReWearify!",
          description: "Please check your inbox to verify your email.",
        });
        navigate('/login');
      } else {
        if (result.errors) {
          const backendErrors = result.errors.reduce((acc, err) => {
            const field = err.field.includes('.') ? err.field.split('.')[0] : err.field;
            acc[field] = err.message;
            return acc;
          }, {});
          setErrors(backendErrors);
        } else {
          setErrors({ general: result.message || 'Registration failed.'  });
        }
      }
    } catch (err) {
      setErrors({ general: err.message || 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
// ... (rest of the JSX component remains the same) ...
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <RewearifyLogo />
          <p className="mt-2 text-gray-600">Join the sustainable giving community</p>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create your account</CardTitle>
            <CardDescription className="text-center">Step {step} of 2: {step === 1 ? 'Basic Information' : 'Profile Details'}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">I want to join as: *</Label>
                  <RadioGroup 
                    value={formData.role} 
                    onValueChange={(value) => handleValueChange('role', value)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="donor" id="donor" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="donor" className="font-medium text-gray-900">Donor</Label>
                          <p className="text-sm text-gray-600">I want to donate clothes and help others</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="recipient" id="recipient" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="recipient" className="font-medium text-gray-900">NGO/Organization</Label>
                          <p className="text-sm text-gray-600">I represent an organization that needs donations</p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                  {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                </div>

                {formData.role === 'recipient' && (
                  <div className="space-y-2 animate-fade-in"> 
                    <Label htmlFor="organization">Organization Name *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="organization" name="organization" type="text"
                        required={formData.role === 'recipient'}
                        value={formData.organization} onChange={handleInputChange}
                        className="pl-10" placeholder="Your organization's official name"
                      />
                    </div>
                    {errors.organization && <p className="text-sm text-red-600">{errors.organization}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Your Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name" name="name" type="text" required
                      value={formData.name} onChange={handleInputChange}
                      className="pl-10" placeholder="Your contact name"
                    />
                  </div>
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email" name="email" type="email" required
                      value={formData.email} onChange={handleInputChange}
                      className="pl-10" placeholder="Your contact email"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password" name="password" type={showPassword ? 'text' : 'password'} required
                      value={formData.password} onChange={handleInputChange}
                      className="pl-10 pr-10" placeholder="Create a password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400"><EyeOff className="h-4 w-4" /></button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required
                      value={formData.confirmPassword} onChange={handleInputChange}
                      className="pl-10 pr-10" placeholder="Confirm password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400"><EyeOff className="h-4 w-4" /></button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {/* --- NGO-SPECIFIC FIELDS --- */}
                {formData.role === 'recipient' && (
                  <div className="space-y-4 p-4 border rounded-lg animate-fade-in">
                    <h4 className="font-medium text-gray-800">Organization Details</h4>
                    <div className="space-y-2">
                      <Label htmlFor="organizationType">Organization Type</Label>
                      <Select onValueChange={(value) => handleValueChange('organizationType', value)} defaultValue={formData.organizationType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type (e.g., NGO, Charity)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGO">NGO</SelectItem>
                          <SelectItem value="Charity">Charity</SelectItem>
                          <SelectItem value="Community Group">Community Group</SelectItem>
                          <SelectItem value="School">School</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationRegNumber">Registration Number (Optional)</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="organizationRegNumber" name="organizationRegNumber" type="text"
                          value={formData.organizationRegNumber} onChange={handleInputChange}
                          className="pl-10" placeholder="e.g., 12345/2024"
                        />
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="organizationWebsite">Website (Optional)</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="organizationWebsite" name="organizationWebsite" type="url"
                          value={formData.organizationWebsite} onChange={handleInputChange}
                          className="pl-10" placeholder="https://your-ngo.org"
                        />
                      </div>
                      {errors.organizationWebsite && <p className="text-sm text-red-600">{errors.organizationWebsite}</p>}
                    </div>
                  </div>
                )}
                
                {/* Fields for ALL users */}
                <div className="space-y-2">
                  <Label htmlFor="location">Your Location (City, State) *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location" name="location" type="text" required
                      value={formData.location} onChange={handleInputChange}
                      className="pl-10" placeholder="e.g., Mumbai, Maharashtra"
                    />
                  </div>
                  {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone (Optional)</Label>
                  <Input
                    id="phone" name="phone" type="tel"
                    value={formData.phone} onChange={handleInputChange}
                    placeholder="Your contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    {formData.role === 'recipient' ? 'Organization Bio (Optional)' : 'Brief Bio (Optional)'}
                  </Label>
                  <Textarea
                    id="bio" name="bio"
                    value={formData.bio} onChange={handleInputChange}
                    placeholder={
                      formData.role === 'recipient' 
                        ? 'Describe your organization\'s mission...' 
                        : 'Tell us a bit about yourself...'
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {step === 2 && (
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  Back
                </Button>
              )}
              <Button
                onClick={handleNextStep}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
                disabled={loading}
              >
                {loading ? 'Creating account...' : step === 1 ? 'Next' : 'Create Account'}
              </Button>
            </div>

            <Separator className="my-4" />

            <a href={`${process.env.REACT_APP_BACKEND_URL}/auth/google`} className="w-full">
              <Button variant="outline" className="w-full">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Sign up with Google
              </Button>
            </a>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Sign in
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;

