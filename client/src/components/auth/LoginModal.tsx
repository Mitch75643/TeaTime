import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAnonymousAuth } from '@/lib/anonymousAuth';
import type { LoginInput } from '@shared/schema';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { loginFromAnotherDevice } = useAnonymousAuth();
  const [loginType, setLoginType] = useState<'passphrase' | 'email'>('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let loginData: LoginInput;

      if (loginType === 'passphrase') {
        if (passphrase.length < 8) {
          setError('Please enter your passphrase');
          setIsLoading(false);
          return;
        }
        loginData = { loginType: 'passphrase', passphrase };
      } else {
        if (!email.includes('@')) {
          setError('Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        loginData = { loginType: 'email', email };
      }

      const result = await loginFromAnotherDevice(loginData);
      
      if (result.success) {
        setIsLoggedIn(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          // Reset form
          setPassphrase('');
          setEmail('');
          setIsLoggedIn(false);
        }, 2000);
      } else {
        setError(result.error || 'Invalid credentials. Please check and try again.');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPassphrase('');
    setEmail('');
    setError('');
    setIsLoggedIn(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (isLoggedIn) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Successfully synced your anonymous account to this device. All your posts and reactions are now available.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting in 2 seconds...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <LogIn className="h-5 w-5" />
            Login to Your Anonymous Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Shield className="h-4 w-4" />
              <span>Your anonymity is preserved - we only sync your posts and reactions</span>
            </div>
          </div>

          <Tabs value={loginType} onValueChange={(value) => setLoginType(value as 'passphrase' | 'email')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="passphrase">Passphrase Login</TabsTrigger>
              <TabsTrigger value="email">Email Login</TabsTrigger>
            </TabsList>

            <TabsContent value="passphrase">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enter Your Passphrase</CardTitle>
                  <CardDescription>
                    Use the secure passphrase you created when upgrading your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-passphrase">Your Passphrase</Label>
                      <Input
                        id="login-passphrase"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Enter your secure passphrase"
                        required
                        minLength={8}
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login with Passphrase'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Login with Email</CardTitle>
                  <CardDescription>
                    Enter the email address you used when upgrading your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Your Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login with Email'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <div className="text-center">
              <Button variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              Don't have an upgraded account? Use the app normally - you can upgrade later to sync across devices.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}