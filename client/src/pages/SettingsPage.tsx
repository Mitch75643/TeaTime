import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings, 
  Shield, 
  Fingerprint, 
  RotateCw, 
  User, 
  Palette, 
  Bell, 
  LogOut,
  ChevronRight,
  Check,
  X
} from "lucide-react";
import { useAnonymousAuth } from "@/lib/anonymousAuth";
import { checkBiometricSupport, isBiometricEnabled } from "@/lib/biometricAuth";
import { SyncSetup } from "@/components/auth/SyncSetup";
import { BiometricSetup } from "@/components/auth/BiometricSetup";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, isUpgraded, clearUserData } = useAnonymousAuth();
  const { toast } = useToast();
  
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [biometricDialogOpen, setBiometricDialogOpen] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useState(() => {
    checkBiometricSupport().then(setBiometricSupported);
    if (user?.anonId) {
      setBiometricEnabled(isBiometricEnabled(user.anonId));
    }
  });

  const handleLogout = () => {
    clearUserData();
    toast({
      title: "Logged Out",
      description: "Your anonymous session has been cleared.",
    });
    setLocation('/');
  };

  const handleSyncComplete = () => {
    setSyncDialogOpen(false);
    toast({
      title: "Cross-Device Sync Enabled",
      description: "You can now access your account from other devices.",
    });
  };

  const handleBiometricComplete = () => {
    setBiometricDialogOpen(false);
    if (user?.anonId) {
      setBiometricEnabled(isBiometricEnabled(user.anonId));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <Settings className="mx-auto w-12 h-12 text-gray-400" />
            <CardTitle>No Active Session</CardTitle>
            <CardDescription>
              Please log in or create an anonymous account to access settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your anonymous account and privacy preferences
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Anonymous Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Anonymous ID</p>
                <p className="text-sm text-gray-500">{user.anonId}</p>
              </div>
              <Badge variant={isUpgraded ? "default" : "secondary"}>
                {isUpgraded ? "Sync Enabled" : "Device Only"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Username</p>
                <p className="text-sm text-gray-500">{user.alias}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Avatar</p>
                <p className="text-sm text-gray-500">{user.avatarId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your authentication and sync preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cross-Device Sync */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <RotateCw className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Cross-Device Sync</p>
                  <p className="text-sm text-gray-500">
                    {isUpgraded 
                      ? "Access your account from other devices" 
                      : "Enable to sync across devices"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isUpgraded ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Set Up
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Set Up Cross-Device Sync</DialogTitle>
                      </DialogHeader>
                      <SyncSetup 
                        onComplete={handleSyncComplete}
                        onCancel={() => setSyncDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Biometric Authentication */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Biometric Login</p>
                  <p className="text-sm text-gray-500">
                    {biometricEnabled 
                      ? "Face ID / Fingerprint enabled" 
                      : biometricSupported 
                        ? "Use Face ID or fingerprint to log in" 
                        : "Not supported on this device"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!biometricSupported ? (
                  <Badge variant="secondary">Not Available</Badge>
                ) : biometricEnabled ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Dialog open={biometricDialogOpen} onOpenChange={setBiometricDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Set Up
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Set Up Biometric Login</DialogTitle>
                      </DialogHeader>
                      <BiometricSetup 
                        onComplete={handleBiometricComplete}
                        onCancel={() => setBiometricDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <NotificationSettings />

        {/* Privacy Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy First:</strong> All your data remains anonymous. We never collect personal 
            information, track your activity, or share your data. Your anonymous ID is the only 
            identifier we use, and you control whether to enable cross-device sync.
          </AlertDescription>
        </Alert>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleLogout}
              variant="destructive" 
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Clear Anonymous Session
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will clear your local data and require a new anonymous account
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button onClick={() => setLocation('/')} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}