import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { MailCheck, AlertTriangle, Loader2 } from 'lucide-react';
import RewearifyLogo from '../../components/Layout/RewearifyLogo';
import { authService } from '../../services';

const VerifyEmail = () => {
  const { token } = useParams(); // Get the token from the URL
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('We are verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check the link.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await authService.verifyEmail(token);
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Your email has been successfully verified!');
        } else {
          setStatus('error');
          setMessage(response.message || 'Verification failed. The link may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'An error occurred during verification. Please try again.');
      }
    };

    verifyToken();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            <p className="text-lg text-gray-600">{message}</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <MailCheck className="h-16 w-16 text-green-500" />
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate('/login')}>
              Proceed to Login
            </Button>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-red-500" />
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </div>
        );
      default:
        return null;
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
            <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
            <CardDescription className="text-center">
              Please wait while we confirm your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
