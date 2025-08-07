import { User, Flame } from "lucide-react";
import { Button } from "./button";
import { NotificationsPanel } from "./notifications-panel";
import { AuthButton } from "../auth/AuthButton";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { useLocation } from "wouter";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAnonymousAuth } from "@/lib/anonymousAuth";
import { MentalHealthQuickAccess } from "@/components/ui/mental-health-support";
import postynLogo from "../../assets/fessr-logo.png";

export function Header() {
  const [, setLocation] = useLocation();
  const { profile, getCachedProfile } = useUserProfile();
  const { user } = useAnonymousAuth();
  
  // Use cached profile data to prevent flashing - try multiple sources immediately
  const cachedProfile = getCachedProfile();
  const userAvatarId = profile?.avatarId || cachedProfile?.avatarId || localStorage.getItem('userAvatarId') || 'mask-anonymous';
  const avatarColor = profile?.avatarColor || cachedProfile?.avatarColor || localStorage.getItem('userAvatarColor') || 'gradient-purple-blue';

  const handleProfileClick = () => {
    setLocation('/profile');
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Modern Postyn Brand Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 shadow-lg">
        <div className="bg-gradient-to-r from-orange-500/95 via-orange-600/95 to-amber-500/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center">
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-2">
                Postyn
              </h1>
              
              {/* Tagline */}
              <p className="text-white/90 text-sm sm:text-base font-medium tracking-wide drop-shadow-sm">
                Share your truth. Spill the tea.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 border-t border-orange-400/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Navigation could go here if needed */}
            </div>
            <div className="flex items-center space-x-2">
              <MentalHealthQuickAccess />
              <NotificationsPanel />
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleProfileClick}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors text-white w-12 h-12 ml-1"
                >
                  <AvatarDisplay
                    avatarId={userAvatarId}
                    size="md"
                    className="border-2 border-white/40 shadow-lg"
                    gradientColors={avatarColor}
                  />
                </Button>
              ) : (
                <AuthButton />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
