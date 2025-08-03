import { useState } from "react";
import { Button } from "./button";
import { Home, TrendingUp, Search, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onCreatePost?: () => void;
}

export function BottomNav({ onCreatePost }: BottomNavProps) {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "home", label: "Home", icon: Home, emoji: "🏠" },
    { id: "trending", label: "Trending", icon: TrendingUp, emoji: "📈" },
    { id: "create", label: "Post", icon: Plus, emoji: "☕", isSpecial: true },
    { id: "search", label: "Search", icon: Search, emoji: "🔍" },
    { id: "profile", label: "Profile", icon: User, emoji: "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t-2 border-pink-100/50 max-w-md mx-auto backdrop-blur-lg shadow-2xl">
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          if (item.isSpecial) {
            return (
              <Button
                key={item.id}
                variant="ghost"
                className="relative w-14 h-14 rounded-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 button-hover-lift"
                onClick={onCreatePost}
              >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                <span className="text-xl relative z-10">{item.emoji}</span>
              </Button>
            );
          }
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 button-hover-lift min-w-0",
                isActive 
                  ? "gradient-secondary text-white shadow-md transform scale-105" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="text-lg mb-1">{item.emoji}</span>
              <span className="text-xs font-semibold">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
