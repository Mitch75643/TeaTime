import { useState } from "react";
import { Button } from "./button";
import { SearchPage } from "./search-page";
import { Home, Flame, Search, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "trending", label: "Trending", icon: Flame, path: "/trending" },
    { id: "search", label: "Search", icon: Search, onClick: () => setIsSearchOpen(true) },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            if (item.onClick) {
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center py-2 px-3 transition-colors",
                    "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  )}
                  onClick={item.onClick}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              );
            }
            
            return (
              <Link key={item.id} href={item.path!}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center py-2 px-3 transition-colors",
                    isActive ? "text-purple-500 dark:text-purple-400" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
      
      <SearchPage 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
