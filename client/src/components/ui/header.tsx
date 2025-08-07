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
    <header className="gradient-primary text-white px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img 
            src={postynLogo} 
            alt="Postyn Logo" 
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain filter brightness-0 invert translate-y-1 translate-x-0.5"
          />
          <h1 className="text-xl sm:text-2xl font-bold leading-none tracking-wide -translate-x-0.5">Postyn</h1>
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
    </header>
  );
}
