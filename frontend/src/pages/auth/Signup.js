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
import { Leaf, Heart, Eye, EyeOff, Mail, Lock, User, MapPin, Building } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
    location: '',
    organization: '',
    phone: '',
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (!formData.role) newErrors.role = 'Please select a role';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.role === 'recipient' && !formData.organization.trim()) {
      newErrors.organization = 'Organization is required for recipients';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const result = await signup(signupData);
      
      if (result.success) {
        toast({
          title: "Welcome to ReWearify!",
          description: "Your account has been created successfully.",
        });
        navigate('/dashboard');
      } else {
        setErrors({ general: result.error });
      }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'donor':
        return 'I want to donate clothes and help others in my community';
      case 'recipient':
        return 'I represent an organization that helps people in need of clothing';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="relative">
              <Leaf className="h-10 w-10 text-green-600" />
              <Heart className="h-5 w-5 text-green-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ReWearify</span>
          </div>
          <p className="text-gray-600">Join the sustainable giving community</p>
        </div>

        

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              Step {step} of 2: {step === 1 ? 'Basic Information' : 'Profile Details'}
            </CardDescription>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
    <Label className="text-sm font-medium">I want to join as:</Label>
    <RadioGroup 
      value={formData.role} 
      onValueChange={(value) => setFormData({...formData, role: value})}
    >
      <div className="space-y-3">
        <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="donor" id="donor" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="donor" className="font-medium text-gray-900">Donor</Label>
            <p className="text-sm text-gray-600">{getRoleDescription('donor')}</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="recipient" id="recipient" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="recipient" className="font-medium text-gray-900">NGO/Organization</Label>
            <p className="text-sm text-gray-600">{getRoleDescription('recipient')}</p>
          </div>
        </div>
      </div>
    </RadioGroup>
    {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
  </div>
            {errors.general && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{errors.general}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      required
                      value={formData.location}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="City, State/Country"
                    />
                  </div>
                  {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
                </div>

                {formData.role === 'recipient' && (
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="organization"
                        name="organization"
                        type="text"
                        required={formData.role === 'recipient'}
                        value={formData.organization}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Your organization name"
                      />
                    </div>
                    {errors.organization && <p className="text-sm text-red-600">{errors.organization}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Brief Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us a bit about yourself or your organization..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {step === 2 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNextStep}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Creating account...' : step === 1 ? 'Next' : 'Create Account'}
              </Button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-green-600 hover:text-green-700">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-green-600 hover:text-green-700">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;