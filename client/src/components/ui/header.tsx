import { User, Flame } from "lucide-react";
import { Button } from "./button";
import { NotificationsPanel } from "./notifications-panel";
import { getAvatarById } from "@/lib/avatars";
import { useLocation } from "wouter";
import { useUserAvatar } from "@/hooks/use-user-avatar";

export function Header() {
  const [, setLocation] = useLocation();
  const { userAvatarId } = useUserAvatar();
  const currentAvatar = getAvatarById(userAvatarId);

  const handleProfileClick = () => {
    setLocation('/profile');
  };

  return (
    <header className="gradient-primary text-white px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Flame className="h-6 w-6" />
          <h1 className="text-xl font-bold">TeaSpill</h1>
        </div>
        <div className="flex items-center space-x-3">
          <NotificationsPanel />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleProfileClick}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white w-10 h-10"
          >
            {currentAvatar ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 flex items-center justify-center bg-white">
                <div 
                  className="w-full h-full object-cover flex items-center justify-center"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transform: 'scale(1.1)'
                  }}
                  dangerouslySetInnerHTML={{ __html: currentAvatar.svg }}
                />
              </div>
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
