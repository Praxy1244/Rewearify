import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Leaf, Heart, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast({
        title: "Welcome back!",
        description: `Logged in successfully as ${result.user.role}`,
      });

      // Redirect based on role
      if (result.user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (result.user.role === "donor") {
        navigate("/donor-dashboard");
      } else if (result.user.role === "recipient") {
        navigate("/recipient-dashboard");
      } else {
        navigate("/"); // fallback
      }
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError('An unexpected error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const demoLogin = (role) => {
    const demoAccounts = {
      donor: { email: 'sarah@email.com', password: 'demo123' },
      recipient: { email: 'michael@email.com', password: 'demo123' },
      admin: { email: 'admin@rewearify.com', password: 'admin123' }
    };
    
    const account = demoAccounts[role];
    setFormData(account);
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
          <p className="text-gray-600">Welcome back to sustainable giving</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              <p className="text-center text-sm text-gray-600 mb-2">
                Try demo accounts:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => demoLogin('donor')}
                  className="text-xs"
                >
                  Donor
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => demoLogin('recipient')}
                  className="text-xs"
                >
                  Recipient
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => demoLogin('admin')}
                  className="text-xs"
                >
                  Admin
                </Button>
              </div>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign up
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-green-600 hover:text-green-700">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-green-600 hover:text-green-700">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;