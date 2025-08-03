import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Fingerprint, Key, User, Mail, AlertCircle, Check } from "lucide-react";
import { useAnonymousAuth } from "@/lib/anonymousAuth";
import { checkBiometricSupport, authenticateWithBiometrics, isBiometricEnabled } from "@/lib/biometricAuth";
import { useLocation } from "wouter";

interface LoginPageProps {
  onLoginSuccess?: () => void;
  onStayAnonymous?: () => void;
}

export function LoginPage({ onLoginSuccess, onStayAnonymous }: LoginPageProps) {
  const [, setLocation] = useLocation();
  const { loginFromAnotherDevice, user } = useAnonymousAuth();
  
  const [activeTab, setActiveTab] = useState<"sync" | "anonymous">("sync");
  const [loginMethod, setLoginMethod] = useState<"passphrase" | "email">("passphrase");
  
  // Form states
  const [passphrase, setPassphrase] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Biometric states
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    initializeBiometrics();
  }, []);

  const initializeBiometrics = async () => {
    try {
      const supported = await checkBiometricSupport();
      setBiometricSupported(supported);
      
      // Check if user has any saved biometric credentials
      const savedUsers = localStorage.getItem('teaspill_user_data');
      if (savedUsers) {
        // Check if any saved user has biometric enabled
        const userData = JSON.parse(savedUsers);
        if (userData.anonId && isBiometricEnabled(userData.anonId)) {
          setBiometricAvailable(true);
        }
      }
    } catch (error) {
      console.error('Error initializing biometrics:', error);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError(null);
    
    try {
      const savedUsers = localStorage.getItem('teaspill_user_data');
      if (!savedUsers) {
        throw new Error('No saved user data found');
      }
      
      const userData = JSON.parse(savedUsers);
      if (!userData.anonId) {
        throw new Error('No anonymous ID found');
      }

      const authenticated = await authenticateWithBiometrics(userData.anonId);
      
      if (authenticated) {
        setSuccess('Biometric authentication successful!');
        // Restore user session
        // User is already authenticated via biometrics
        onLoginSuccess?.();
        setLocation('/');
      } else {
        setError('Biometric authentication failed. Please try again or use manual login.');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      setError(error instanceof Error ? error.message : 'Biometric authentication failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSyncLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const loginData = loginMethod === "passphrase" 
        ? { loginType: 'passphrase' as const, passphrase }
        : { loginType: 'email' as const, email };
        
      const result = await loginFromAnotherDevice(loginData);
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      setSuccess('Successfully logged in to your synced account!');
      onLoginSuccess?.();
      
      // Navigate to home after short delay
      setTimeout(() => {
        setLocation('/');
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStayAnonymous = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // User already has anonymous account, just navigate
      setSuccess('Continuing with anonymous account!');
      onStayAnonymous?.();
      
      // Navigate to home after short delay
      setTimeout(() => {
        setLocation('/');
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto shadow-xl border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Welcome to Fessr
          </CardTitle>
          <CardDescription>
            Choose how you'd like to continue - completely anonymous or with secure sync
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Biometric Login Option */}
          {biometricSupported && biometricAvailable && (
            <div className="space-y-3">
              <Button
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Fingerprint className="w-5 h-5 mr-2" />
                {biometricLoading ? 'Authenticating...' : 'Use Face ID / Fingerprint'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or</span>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sync" | "anonymous")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sync" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Sync Account
              </TabsTrigger>
              <TabsTrigger value="anonymous" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Stay Anonymous
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sync" className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Log In to Sync Your Account
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access your anonymous data across devices
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={loginMethod === "passphrase" ? "default" : "outline"}
                    onClick={() => setLoginMethod("passphrase")}
                    className="flex-1"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Passphrase
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === "email" ? "default" : "outline"}
                    onClick={() => setLoginMethod("email")}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>

                <form onSubmit={handleSyncLogin} className="space-y-4">
                  {loginMethod === "passphrase" ? (
                    <div className="space-y-2">
                      <Label htmlFor="passphrase">Secure Passphrase</Label>
                      <Input
                        id="passphrase"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Enter your secure passphrase"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500">
                        Use the passphrase you created when setting up sync
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Use the email you registered for sync
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? 'Logging In...' : 'Log In to Sync'}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="anonymous" className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Stay Completely Anonymous
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate a new anonymous ID for this device only
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">
                    Anonymous Mode Features:
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• No personal information required</li>
                    <li>• Anonymous ID generated locally</li>
                    <li>• Data stays on this device only</li>
                    <li>• Can upgrade to sync later</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={handleStayAnonymous}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                disabled={loading}
                size="lg"
              >
                {loading ? 'Creating Account...' : 'Continue Anonymously'}
              </Button>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="text-xs text-center text-gray-500 space-y-1">
            <p>🔒 Your privacy is our priority</p>
            <p>No tracking • No analytics • Complete anonymity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}