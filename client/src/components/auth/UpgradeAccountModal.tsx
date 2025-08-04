import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Shield, RefreshCw, CheckCircle } from 'lucide-react';
import { useAnonymousAuth } from '@/lib/anonymousAuth';
import type { UpgradeAccountInput } from '@shared/schema';

interface UpgradeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeAccountModal({ isOpen, onClose, onSuccess }: UpgradeAccountModalProps) {
  const { upgradeAccount } = useAnonymousAuth();
  const [upgradeType, setUpgradeType] = useState<'passphrase' | 'email'>('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpgraded, setIsUpgraded] = useState(false);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let upgradeData: UpgradeAccountInput;

      if (upgradeType === 'passphrase') {
        if (passphrase.length < 8) {
          setError('Passphrase must be at least 8 characters long');
          setIsLoading(false);
          return;
        }
        if (passphrase !== confirmPassphrase) {
          setError('Passphrases do not match');
          setIsLoading(false);
          return;
        }
        upgradeData = { upgradeType: 'passphrase', passphrase };
      } else {
        if (!email.includes('@')) {
          setError('Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        upgradeData = { upgradeType: 'email', email };
      }

      const result = await upgradeAccount(upgradeData);
      
      if (result.success) {
        setIsUpgraded(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          // Reset form
          setPassphrase('');
          setConfirmPassphrase('');
          setEmail('');
          setIsUpgraded(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to upgrade account');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPassphrase('');
    setConfirmPassphrase('');
    setEmail('');
    setError('');
    setIsUpgraded(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (isUpgraded) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Account Upgraded!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You can now sync your anonymous account across devices while staying completely anonymous.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Closing in 2 seconds...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <Shield className="h-5 w-5" />
            Upgrade for Cross-Device Access
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-orange-600" />
              <span>Access from any device</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <span>Sync posts & reactions</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-orange-600" />
              <span>Stay completely anonymous</span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <strong>Privacy Promise:</strong> We only store what you choose. No names, no tracking, no personal info.
          </div>

          <Tabs value={upgradeType} onValueChange={(value) => setUpgradeType(value as 'passphrase' | 'email')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="passphrase">Secure Passphrase</TabsTrigger>
              <TabsTrigger value="email">Simple Email</TabsTrigger>
            </TabsList>

            <TabsContent value="passphrase">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create a Secure Passphrase</CardTitle>
                  <CardDescription>
                    Use a unique passphrase to access your account from other devices. 
                    Make it something only you would know.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpgrade} className="space-y-4">
                    <div>
                      <Label htmlFor="passphrase">Passphrase (min 8 characters)</Label>
                      <Input
                        id="passphrase"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="e.g., MySecretTfessPhrase2024"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-passphrase">Confirm Passphrase</Label>
                      <Input
                        id="confirm-passphrase"
                        type="password"
                        value={confirmPassphrase}
                        onChange={(e) => setConfirmPassphrase(e.target.value)}
                        placeholder="Type your passphrase again"
                        required
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Upgrading...' : 'Upgrade with Passphrase'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Use Your Email</CardTitle>
                  <CardDescription>
                    We'll only use your email to let you login from other devices. 
                    No spam, no newsletters, no sharing with anyone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpgrade} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Your email stays private and is never shared or used for marketing.
                    </div>
                    {error && (
                      <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Upgrading...' : 'Upgrade with Email'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}