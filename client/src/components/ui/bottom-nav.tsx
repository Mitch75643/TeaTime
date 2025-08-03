import { useState } from "react";
import { Button } from "./button";
import { Home, Flame, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "trending", label: "Trending", icon: Flame },
    { id: "search", label: "Search", icon: Search },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center py-2 px-3 transition-colors",
                isActive ? "text-purple-500" : "text-gray-400 hover:text-gray-600"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
