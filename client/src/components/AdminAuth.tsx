import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldX, Loader2 } from "lucide-react";

interface AdminAuthProps {
  onSuccess?: () => void;
}

export function AdminAuth({ onSuccess }: AdminAuthProps) {
  const [step, setStep] = useState<'fingerprint' | 'email'>('fingerprint');
  const [email, setEmail] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [error, setError] = useState('');
  const [isGettingFingerprint, setIsGettingFingerprint] = useState(false);
  const [isSettingUpRoot, setIsSettingUpRoot] = useState(false);
  
  const { toast } = useToast();
  const {
    isAuthenticated,
    admin,
    verifyFingerprint,
    login,
    logout,
    isVerifyingFingerprint,
    isLoggingIn,
    isLoggingOut,
  } = useAdminAuth();

  // Get device fingerprint on component mount
  useEffect(() => {
    const initFingerprint = async () => {
      setIsGettingFingerprint(true);
      try {
        const fp = await getDeviceFingerprint();
        setFingerprint(fp);
      } catch (error) {
        setError('Failed to generate device fingerprint');
      } finally {
        setIsGettingFingerprint(false);
      }
    };
    
    initFingerprint();
  }, []);

  // Handle step 1: fingerprint verification
  const handleFingerprintVerification = async () => {
    if (!fingerprint) {
      setError('Device fingerprint not available');
      return;
    }

    try {
      setError('');
      const result = await verifyFingerprint(fingerprint);
      
      if (result.verified) {
        setStep('email');
        toast({
          title: "Device Verified",
          description: "Please enter your admin email to continue.",
        });
      }
    } catch (err: any) {
      setError(err.message || 'Device verification failed');
    }
  };

  // Handle step 2: email verification and login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !fingerprint) {
      setError('Email and device fingerprint required');
      return;
    }

    try {
      setError('');
      const result = await login({ fingerprint, email });
      
      toast({
        title: "Admin Access Granted",
        description: `Welcome back! Role: ${result.role}`,
      });
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  // Handle root admin setup
  const handleSetupRootAdmin = async () => {
    if (!fingerprint) {
      setError('Device fingerprint not available');
      return;
    }

    const adminEmail = prompt('Enter your admin email address:');
    if (!adminEmail) {
      setError('Email required for root admin setup');
      return;
    }

    setIsSettingUpRoot(true);
    try {
      setError('');
      
      const response = await fetch('/api/admin/setup-root', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint,
          email: adminEmail
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Root Admin Created!",
          description: `Admin account created successfully. You can now login with your email.`,
        });
        setStep('email');
        setEmail(adminEmail);
      } else {
        setError(result.message || 'Failed to setup root admin');
      }
    } catch (err: any) {
      setError('Network error: Failed to setup root admin');
    } finally {
      setIsSettingUpRoot(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setStep('fingerprint');
      setEmail('');
      setError('');
      
      toast({
        title: "Logged Out",
        description: "Admin session ended successfully.",
      });
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };

  // If already authenticated, show admin status
  if (isAuthenticated && admin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Admin Authenticated
          </CardTitle>
          <CardDescription>
            Logged in as {admin.role === 'root_host' ? 'Root Host' : 'Admin'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <div className="p-3 bg-muted rounded border text-sm text-foreground">
              {admin.email}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <div className="p-3 bg-muted rounded border text-sm text-foreground">
              {admin.role === 'root_host' ? 'Root Host' : 'Admin'}
            </div>
          </div>
          
          <Button 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            variant="outline"
            className="w-full"
          >
            {isLoggingOut && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          Admin Authentication
        </CardTitle>
        <CardDescription>
          {step === 'fingerprint' 
            ? 'Step 1: Device Verification' 
            : 'Step 2: Email Verification'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <ShieldX className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'fingerprint' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Device Fingerprint</Label>
              <div className="p-3 bg-muted rounded border text-sm font-mono text-foreground break-all">
                {isGettingFingerprint ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating fingerprint...
                  </div>
                ) : fingerprint ? (
                  <div className="space-y-2">
                    <div className="text-foreground">
                      {fingerprint}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ✓ Your unique device fingerprint
                    </div>
                  </div>
                ) : (
                  <span className="text-destructive">Failed to generate</span>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleFingerprintVerification}
              disabled={!fingerprint || isVerifyingFingerprint || isGettingFingerprint}
              className="w-full"
            >
              {isVerifyingFingerprint && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify Device
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  First time setup
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleSetupRootAdmin}
              disabled={!fingerprint || isGettingFingerprint || isSettingUpRoot}
              variant="outline"
              className="w-full"
            >
              {isSettingUpRoot && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Setup Root Admin
            </Button>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <Button 
              type="submit"
              disabled={!email || isLoggingIn}
              className="w-full"
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Login as Admin
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                setStep('fingerprint');
                setEmail('');
                setError('');
              }}
              className="w-full"
            >
              Back to Device Verification
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}