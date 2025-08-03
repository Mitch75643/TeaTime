import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Fingerprint, Key, User, Mail, AlertCircle } from "lucide-react";
import { LoginPage } from "@/components/auth/LoginPage";
import { useLocation } from "wouter";
import fessrLogo from "../assets/fessr-logo.png";

export function AuthPage() {
  const [, setLocation] = useLocation();
  const [showFullLogin, setShowFullLogin] = useState(false);

  const handleLoginSuccess = () => {
    setLocation('/');
  };

  const handleStayAnonymous = () => {
    localStorage.setItem('fessr_auth_seen', 'true');
    setLocation('/');
  };

  if (showFullLogin) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        onStayAnonymous={handleStayAnonymous}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg mx-auto shadow-xl border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center">
            <img 
              src={fessrLogo} 
              alt="Fessr Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Welcome to Fessr
          </CardTitle>
          <CardDescription className="text-lg">
            Share your stories anonymously with complete privacy
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Complete Privacy:</strong> No names, no photos, no personal data. 
              Your anonymity is guaranteed.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200">
                Choose Your Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Stay completely anonymous or enable secure sync across devices
              </p>
            </div>

            <div className="grid gap-4">
              {/* Quick Anonymous Option */}
              <Card className="border-2 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                        Stay Anonymous
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start sharing immediately with a local anonymous account
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0 px-6 pb-6">
                  <Button 
                    onClick={handleStayAnonymous}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    Continue Anonymously
                  </Button>
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <Card className="border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Key className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                        Enable Cross-Device Sync
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Access your anonymous account from multiple devices
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0 px-6 pb-6">
                  <Button 
                    onClick={() => setShowFullLogin(true)}
                    variant="outline"
                    className="w-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                    size="lg"
                  >
                    Set Up Sync & Login Options
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              🔒 Your Privacy Features:
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                <span>Optional biometric login (Face ID/Fingerprint)</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>Secure passphrase or email sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>No personal data collection ever</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Complete anonymity maintained</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-center text-gray-500 space-y-1">
            <p>🔒 Anonymous • Private • Secure</p>
            <p>No tracking • No analytics • No personal data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}