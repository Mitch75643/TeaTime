import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldX, Loader2, Fingerprint, Mail, CheckCircle, ArrowRight } from "lucide-react";

interface AdminAuthProps {
  onSuccess?: () => void;
}

export function AdminAuth({ onSuccess }: AdminAuthProps) {
  const [step, setStep] = useState<'fingerprint' | 'email'>('fingerprint');
  const [email, setEmail] = useState('');
  const [enteredFingerprint, setEnteredFingerprint] = useState('');
  const [currentFingerprint, setCurrentFingerprint] = useState('');
  const [error, setError] = useState('');
  const [isGettingFingerprint, setIsGettingFingerprint] = useState(false);
  const [isSettingUpRoot, setIsSettingUpRoot] = useState(false);
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  
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

  // Get current device fingerprint for reference
  useEffect(() => {
    const initFingerprint = async () => {
      setIsGettingFingerprint(true);
      try {
        const fp = await getDeviceFingerprint();
        setCurrentFingerprint(fp);
        
        // Auto-recognize the root admin fingerprint
        const rootAdminFingerprint = "5ae3b0a995c35312b63f31520ebab6db";
        if (fp === rootAdminFingerprint) {
          setEnteredFingerprint(fp);
          toast({
            title: "Root Admin Device Detected",
            description: "Your device has been automatically recognized as the root admin.",
          });
        }
      } catch (error) {
        setError('Failed to generate device fingerprint');
      } finally {
        setIsGettingFingerprint(false);
      }
    };
    
    initFingerprint();
  }, [toast]);

  // Handle step 1: fingerprint verification
  const handleFingerprintVerification = async () => {
    if (!enteredFingerprint.trim()) {
      setError('Please enter your fingerprint ID');
      return;
    }

    try {
      setError('');
      const result = await verifyFingerprint(enteredFingerprint.trim());
      
      if (result.verified) {
        setFingerprintVerified(true);
        setStep('email');
        
        // Auto-fill email for root admin
        const rootAdminFingerprint = "5ae3b0a995c35312b63f31520ebab6db";
        if (enteredFingerprint.trim() === rootAdminFingerprint) {
          setEmail("fertez@gmail.com");
        }
        
        toast({
          title: "Fingerprint Verified",
          description: "Device approved. Please enter your admin email to continue.",
        });
      }
    } catch (err: any) {
      setError(err.message || 'Fingerprint verification failed');
    }
  };

  // Auto-fill current device fingerprint
  const useCurrentDevice = () => {
    if (currentFingerprint) {
      setEnteredFingerprint(currentFingerprint);
    }
  };

  // Handle step 2: email verification and login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!enteredFingerprint.trim()) {
      setError('Fingerprint verification required');
      return;
    }

    try {
      setError('');
      const result = await login({ fingerprint: enteredFingerprint.trim(), email: email.trim() });
      
      toast({
        title: "Admin Access Granted",
        description: `Welcome back! Role: ${result.role}`,
      });
      
      // Small delay to ensure session is properly set before calling onSuccess
      setTimeout(() => {
        onSuccess?.();
      }, 200);
    } catch (err: any) {
      setError(err.message || 'Email verification failed');
    }
  };

  // Handle root admin setup
  const handleSetupRootAdmin = async () => {
    if (!currentFingerprint) {
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
          fingerprint: currentFingerprint,
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
          Two-step verification process for secure admin access
        </CardDescription>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            step === 'fingerprint' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 
            fingerprintVerified ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            <Fingerprint className="w-3 h-3" />
            {fingerprintVerified ? 'Device Verified' : 'Device ID'}
          </div>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            step === 'email' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            <Mail className="w-3 h-3" />
            Email Verification
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <ShieldX className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'fingerprint' ? (
          // Step 1: Manual fingerprint entry
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fingerprintInput" className="text-sm font-medium">
                Enter Fingerprint ID
              </Label>
              <Input
                id="fingerprintInput"
                type="text"
                value={enteredFingerprint}
                onChange={(e) => setEnteredFingerprint(e.target.value)}
                placeholder="Paste your authorized fingerprint ID here"
                className="font-mono text-sm"
                disabled={isVerifyingFingerprint}
              />
              <p className="text-xs text-muted-foreground">
                Enter the fingerprint ID that was approved by the root host
              </p>
            </div>

            {/* Current device helper */}
            {currentFingerprint && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Current Device ID</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={useCurrentDevice}
                    className="text-xs h-6"
                  >
                    Use This Device
                  </Button>
                </div>
                <div className="p-2 bg-muted rounded text-xs font-mono text-muted-foreground border">
                  {isGettingFingerprint ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    currentFingerprint
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={handleFingerprintVerification}
              disabled={isVerifyingFingerprint || !enteredFingerprint.trim()}
              className="w-full"
            >
              {isVerifyingFingerprint ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying Device...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Verify Fingerprint ID
                </>
              )}
            </Button>
          </div>
        ) : (
          // Step 2: Email verification
          <div className="space-y-4">
            {/* Show verified fingerprint */}
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">Device fingerprint verified</span>
            </div>
            
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email address"
                  disabled={isLoggingIn}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email that was authorized for this fingerprint ID
                </p>
              </div>

              <Button 
                type="submit"
                disabled={isLoggingIn || !email.trim()}
                className="w-full"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying Email...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Grant Admin Access
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('fingerprint');
                  setFingerprintVerified(false);
                  setError('');
                }}
                className="w-full"
              >
                ← Back to Fingerprint Verification
              </Button>
            </form>
          </div>
        )}
        
        <Separator />
        
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Need to setup the first admin account?
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSetupRootAdmin}
            disabled={isSettingUpRoot || isGettingFingerprint}
          >
            {isSettingUpRoot ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              'Setup Root Admin'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}