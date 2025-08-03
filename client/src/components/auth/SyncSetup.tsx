import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Key, Mail, Shield, Check, AlertCircle, RotateCw, Smartphone } from "lucide-react";
import { useAnonymousAuth } from "@/lib/anonymousAuth";
import { useToast } from "@/hooks/use-toast";
import { checkBiometricSupport } from "@/lib/biometricAuth";

interface SyncSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function SyncSetup({ onComplete, onCancel }: SyncSetupProps) {
  const { user: currentUser, upgradeAccount } = useAnonymousAuth();
  const { toast } = useToast();
  
  const [syncMethod, setSyncMethod] = useState<"passphrase" | "email">("passphrase");
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [email, setEmail] = useState("");
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useState(() => {
    checkBiometricSupport().then(setBiometricSupported);
  });

  const validateForm = () => {
    if (syncMethod === "passphrase") {
      if (passphrase.length < 8) {
        setError("Passphrase must be at least 8 characters long");
        return false;
      }
      if (passphrase !== confirmPassphrase) {
        setError("Passphrases do not match");
        return false;
      }
    } else {
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address");
        return false;
      }
    }
    return true;
  };

  const handleSetupSync = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!currentUser?.anonId) {
      setError("No user session found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const upgradeData = syncMethod === "passphrase" 
        ? { upgradeType: 'passphrase' as const, passphrase }
        : { upgradeType: 'email' as const, email };

      const result = await upgradeAccount(upgradeData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to upgrade account');
      }

      toast({
        title: "Cross-Device Sync Enabled",
        description: `You can now access your anonymous account from other devices using your ${syncMethod}.`,
      });

      onComplete?.();
    } catch (error) {
      console.error('Sync setup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set up sync';
      setError(errorMessage);
      
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSecurePassphrase = () => {
    const words = [
      'Ocean', 'Mountain', 'River', 'Forest', 'Desert', 'Valley', 'Lake', 'Island',
      'Thunder', 'Lightning', 'Rainbow', 'Sunset', 'Dawn', 'Twilight', 'Storm', 'Breeze',
      'Crystal', 'Diamond', 'Emerald', 'Ruby', 'Sapphire', 'Pearl', 'Gold', 'Silver',
      'Phoenix', 'Dragon', 'Eagle', 'Wolf', 'Tiger', 'Lion', 'Bear', 'Falcon'
    ];
    
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const numbers = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    const generated = `${word1}${word2}${numbers}`;
    setPassphrase(generated);
    setConfirmPassphrase(generated);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <RotateCw className="w-6 h-6 text-white" />
        </div>
        <CardTitle>Set Up Cross-Device Sync</CardTitle>
        <CardDescription>
          Securely access your anonymous account from any device
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="space-y-2">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Why Enable Sync?
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Keep your posts and reactions across devices</li>
              <li>• Never lose your anonymous identity</li>
              <li>• Maintain complete privacy and anonymity</li>
              <li>• Optional - you can always stay device-only</li>
            </ul>
          </div>
        </div>

        <Tabs value={syncMethod} onValueChange={(value) => setSyncMethod(value as "passphrase" | "email")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="passphrase" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Passphrase
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSetupSync} className="space-y-4">
            <TabsContent value="passphrase" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="passphrase">Secure Passphrase</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateSecurePassphrase}
                    className="text-xs"
                  >
                    Generate Random
                  </Button>
                </div>
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Create a secure passphrase"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500">
                  At least 8 characters. This will be your login key.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassphrase">Confirm Passphrase</Label>
                <Input
                  id="confirmPassphrase"
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm your passphrase"
                  required
                />
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Save this passphrase securely. You'll need it to access 
                  your account from other devices. We cannot recover it if you forget it.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                <p className="text-xs text-gray-500">
                  Used only for account access. No marketing emails ever.
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your email is only used for account access and never shared. 
                  Your anonymous identity remains completely separate.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {biometricSupported && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="biometric"
                    checked={enableBiometric}
                    onCheckedChange={(checked) => setEnableBiometric(checked as boolean)}
                  />
                  <Label htmlFor="biometric" className="text-sm cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Enable biometric login (Face ID / Fingerprint)
                    </div>
                  </Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Quick and secure access without typing your credentials
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={loading}
                size="lg"
              >
                {loading ? 'Setting Up...' : 'Enable Cross-Device Sync'}
              </Button>
              
              {onCancel && (
                <Button onClick={onCancel} variant="outline" className="w-full">
                  Skip - Stay Device Only
                </Button>
              )}
            </div>
          </form>
        </Tabs>

        <div className="text-xs text-center text-gray-500 space-y-1">
          <p>🔒 Your anonymity is always preserved</p>
          <p>Sync data is encrypted and tied to your anonymous ID only</p>
        </div>
      </CardContent>
    </Card>
  );
}