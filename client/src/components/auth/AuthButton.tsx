import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User, Shield, LogIn, Smartphone, Settings, RefreshCw } from 'lucide-react';
import { useAnonymousAuth } from '@/lib/anonymousAuth';
import { UpgradeAccountModal } from './UpgradeAccountModal';
import { LoginModal } from './LoginModal';

export function AuthButton() {
  const { user, isUpgraded, shouldPromptUpgrade } = useAnonymousAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!user) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowLoginModal(true)}
        className="text-xs"
      >
        <LogIn className="h-3 w-3 mr-1" />
        Login
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <User className="h-4 w-4" />
            <span className="ml-2 text-sm max-w-20 truncate">
              {user.alias}
            </span>
            {shouldPromptUpgrade && (
              <Badge 
                variant="outline" 
                className="ml-2 text-xs bg-orange-500 text-white border-orange-500"
              >
                !
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <div>
              <div className="font-semibold">{user.alias}</div>
              <div className="text-xs text-gray-500">{user.anonId}</div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isUpgraded ? (
            <DropdownMenuItem disabled className="text-green-600">
              <Shield className="mr-2 h-4 w-4" />
              <span>Account Upgraded</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => setShowUpgradeModal(true)}
              className="text-orange-600"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              <span>Upgrade for Cross-Device</span>
              {shouldPromptUpgrade && (
                <Badge variant="outline" className="ml-auto text-xs">New</Badge>
              )}
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowLoginModal(true)}>
            <LogIn className="mr-2 h-4 w-4" />
            <span>Login on New Device</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings (Coming Soon)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpgradeAccountModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}