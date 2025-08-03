import { Bell, User, Sparkles } from "lucide-react";
import { Button } from "./button";

export function Header() {
  return (
    <header className="gradient-primary text-white px-6 py-4 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg">☕</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TeaSpill</h1>
            <p className="text-xs text-white/80 font-medium">Anonymous Stories</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-200 text-white button-hover-lift"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-200 text-white button-hover-lift"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
