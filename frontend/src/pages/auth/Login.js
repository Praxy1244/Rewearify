import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import RewearifyLogo from '../../components/Layout/RewearifyLogo'; 
import GoogleIcon from '../../components/icons/GoogleIcon'; 

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name] || errors.general) {
      setErrors({ ...errors, [e.target.name]: '', general: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast({ title: "Welcome back!", description: `Logged in as ${result.data.user.role}.` });
        navigate('/');
      } else {
        setErrors({ general: result.message || 'Invalid credentials.' });
      }
    } catch (err) {
      setErrors({ general: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX 1: Full-screen background
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* FIX 2: Consistent logo */}
          <RewearifyLogo />
          <p className="mt-2 text-gray-600">Welcome back to sustainable giving</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Log in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.general && <Alert variant="destructive"><AlertDescription>{errors.general}</AlertDescription></Alert>}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Form fields remain the same */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} autoComplete="email" className="pl-10" placeholder="Enter your email" />
                </div>
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleInputChange} autoComplete="current-password" className="pl-10 pr-10" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              </div>
              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <Separator />

            {/* --- 💡 THE FIX IS HERE --- */}
            <a href={`${process.env.REACT_APP_BACKEND_URL}/auth/google`} className="w-full">
              <Button variant="outline" className="w-full">
                {/* 2. Add the icon component here */}
                <GoogleIcon className="mr-2 h-4 w-4" /> 
                Sign in with Google
              </Button>
            </a>

            <Separator />
            {/* FIX 3: Demo buttons only fill the form, they do not auto-login */}
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-600">Or click to fill demo credentials:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => setFormData({ email: 'donor1@example.com', password: 'Password@123' })}>Donor</Button>
                <Button variant="outline" size="sm" onClick={() => setFormData({ email: 'ngo1@example.com', password: 'Password@123' })}>Recipient</Button>
                <Button variant="outline" size="sm" onClick={() => setFormData({ email: 'admin@rewearify.com', password: 'Admin@123' })}>Admin</Button>
              </div>
            </div>
            <div className="mt-6 text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-green-600 hover:text-green-800 font-medium">Sign up</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

