import { User, Flame } from "lucide-react";
import { Button } from "./button";
import { NotificationsPanel } from "./notifications-panel";

export function Header() {
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
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
