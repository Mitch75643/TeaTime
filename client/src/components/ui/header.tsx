import { User, Flame } from "lucide-react";
import { Button } from "./button";
import { NotificationsPanel } from "./notifications-panel";
import { AuthButton } from "../auth/AuthButton";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { useLocation } from "wouter";
import { useUserAvatar } from "@/hooks/use-user-avatar";
import { useAnonymousAuth } from "@/lib/anonymousAuth";
import { MentalHealthQuickAccess } from "@/components/ui/mental-health-support";
import tfessLogo from "../../assets/fessr-logo.png";

export function Header() {
  const [, setLocation] = useLocation();
  const { userAvatarId } = useUserAvatar();
  const { user } = useAnonymousAuth();

  const handleProfileClick = () => {
    setLocation('/profile');
  };

  return (
    <header className="gradient-primary text-white px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img 
            src={tfessLogo} 
            alt="Tfess Logo" 
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain filter brightness-0 invert translate-y-1 translate-x-0.5"
          />
          <h1 className="text-xl sm:text-2xl font-bold leading-none tracking-wide -translate-x-0.5">Tfess</h1>
        </div>
        <div className="flex items-center space-x-3">
          <MentalHealthQuickAccess />
          <NotificationsPanel />
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleProfileClick}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-white w-10 h-10"
            >
              <AvatarDisplay
                avatarId={userAvatarId}
                size="sm"
                className="border-2 border-white/30"
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
