import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Shield, Check, AlertCircle, Smartphone, X } from "lucide-react";
import { useAnonymousAuth } from "@/lib/anonymousAuth";
import { 
  checkBiometricSupport, 
  setupBiometricAuth, 
  isBiometricEnabled, 
  disableBiometrics,
  biometricAuthService,
  BiometricCredential 
} from "@/lib/biometricAuth";
import { useToast } from "@/hooks/use-toast";

interface BiometricSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function BiometricSetup({ onComplete, onCancel }: BiometricSetupProps) {
  const { user: currentUser } = useAnonymousAuth();
  const { toast } = useToast();
  
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredDevices, setRegisteredDevices] = useState<BiometricCredential[]>([]);

  useEffect(() => {
    initializeBiometricStatus();
  }, [currentUser]);

  const initializeBiometricStatus = async () => {
    try {
      const isSupported = await checkBiometricSupport();
      setSupported(isSupported);
      
      if (currentUser?.anonId) {
        const isEnabled = isBiometricEnabled(currentUser.anonId);
        setEnabled(isEnabled);
        
        if (isEnabled) {
          const devices = biometricAuthService.getRegisteredDevices(currentUser.anonId);
          setRegisteredDevices(devices);
        }
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleEnableBiometrics = async () => {
    if (!currentUser?.anonId) {
      setError('No user session found. Please log in first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credential = await setupBiometricAuth(currentUser.anonId);
      
      setEnabled(true);
      setRegisteredDevices([...registeredDevices, credential]);
      
      toast({
        title: "Biometric Authentication Enabled",
        description: "You can now use Face ID or fingerprint to log in quickly.",
      });

      onComplete?.();
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable biometric authentication';
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

  const handleDisableBiometrics = async () => {
    if (!currentUser?.anonId) return;

    setLoading(true);
    setError(null);

    try {
      await disableBiometrics(currentUser.anonId);
      
      setEnabled(false);
      setRegisteredDevices([]);
      
      toast({
        title: "Biometric Authentication Disabled",
        description: "You'll need to use your passphrase or email to log in.",
      });

      onComplete?.();
    } catch (error) {
      console.error('Error disabling biometrics:', error);
      setError('Failed to disable biometric authentication');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-gray-400" />
          </div>
          <CardTitle>Biometric Authentication Not Available</CardTitle>
          <CardDescription>
            Your device doesn't support biometric authentication or it's not set up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To use biometric login, please:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Enable Face ID or Touch ID in your device settings</li>
                <li>Use a supported browser (Chrome, Safari, Edge)</li>
                <li>Ensure your device has biometric sensors</li>
              </ul>
            </AlertDescription>
          </Alert>
          <Button onClick={onCancel} variant="outline" className="w-full">
            Continue Without Biometrics
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Fingerprint className="w-6 h-6 text-white" />
        </div>
        <CardTitle>
          {enabled ? 'Manage Biometric Authentication' : 'Set Up Biometric Authentication'}
        </CardTitle>
        <CardDescription>
          {enabled 
            ? 'Your biometric authentication is currently enabled'
            : 'Secure and convenient login with Face ID or fingerprint'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {enabled ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <Check className="h-4 w-4" />
              <AlertDescription>
                Biometric authentication is enabled for your anonymous account
              </AlertDescription>
            </Alert>

            {registeredDevices.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Registered Devices:</h4>
                {registeredDevices.map((device, index) => (
                  <div key={device.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Device {index + 1}</span>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(device.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleDisableBiometrics}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                {loading ? 'Disabling...' : 'Disable Biometric Login'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Benefits of Biometric Login:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Quick and secure access to your anonymous account</li>
                  <li>• No need to remember passphrases</li>
                  <li>• Your biometric data never leaves your device</li>
                  <li>• Works with Face ID, Touch ID, and fingerprint sensors</li>
                </ul>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your biometric data is processed entirely on your device and never sent to our servers. 
                We only store an encrypted token that can be unlocked with your biometric authentication.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleEnableBiometrics}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <Fingerprint className="w-5 h-5 mr-2" />
              {loading ? 'Setting Up...' : 'Enable Biometric Login'}
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="flex-1">
              {enabled ? 'Close' : 'Skip for Now'}
            </Button>
          )}
          {enabled && onComplete && (
            <Button onClick={onComplete} className="flex-1">
              Done
            </Button>
          )}
        </div>

        <div className="text-xs text-center text-gray-500 space-y-1">
          <p>🔒 Privacy-first biometric authentication</p>
          <p>Your data never leaves your device</p>
        </div>
      </CardContent>
    </Card>
  );
}