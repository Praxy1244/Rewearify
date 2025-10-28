import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Lock } from "lucide-react";
import RewearifyLogo from "../../components/Layout/RewearifyLogo";
import { authService } from "../../services";
import { useToast } from "../../hooks/use-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await authService.resetPassword(token, password);
      if (response.success) {
        toast({
          title: "Success!",
          description: "Your password has been updated. Redirecting to login...",
        });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(response.message || "Failed to reset password. The link may be invalid or expired.");
      }
    } catch (err) {
      setError(err.message || "An error occurred. The link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <RewearifyLogo />
          <p className="mt-2 text-gray-600">Create a new secure password</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="Enter your new password" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Updating..." : "Set New Password"}
              </Button>
            </form>
            <div className="text-center">
              <Link to="/login" className="text-sm text-green-600 hover:text-green-700 font-medium">Back to login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
