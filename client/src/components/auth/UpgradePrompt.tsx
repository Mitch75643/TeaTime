import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Shield, X, RefreshCw } from 'lucide-react';
import { UpgradeAccountModal } from './UpgradeAccountModal';

interface UpgradePromptProps {
  onDismiss?: () => void;
  trigger?: 'first_post' | 'multiple_visits' | 'manual';
}

export function UpgradePrompt({ onDismiss, trigger = 'manual' }: UpgradePromptProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'first_post':
        return "Great first post! Want to keep your content safe across devices?";
      case 'multiple_visits':
        return "You've been active! Secure your account to access from any device.";
      default:
        return "Unlock cross-device access while staying anonymous.";
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgradeSuccess = () => {
    setIsModalOpen(false);
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-700 dark:text-orange-300">
                Upgrade Your Anonymous Account
              </CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-orange-600/80 dark:text-orange-300/80">
            {getTriggerMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700 dark:text-gray-300">Access from any device</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700 dark:text-gray-300">Sync all your posts</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700 dark:text-gray-300">Stay 100% anonymous</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
            >
              Upgrade Now (Free)
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/20"
            >
              Maybe Later
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            No personal info required • Choose passphrase or email • Always anonymous
          </div>
        </CardContent>
      </Card>

      <UpgradeAccountModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </>
  );
}