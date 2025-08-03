import { useState } from "react";
import { Button } from "./button";
import { SearchPage } from "./search-page";
import { FloatingPostButton } from "./floating-post-button";
import { Home, Coffee, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "daily", label: "Daily", icon: Coffee, path: "/daily-spill" },
    { id: "me", label: "Me", icon: User, path: "/profile" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 max-w-md mx-auto">
        <div className="flex items-center justify-around py-2 relative">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            // Add spacer for the floating button in the middle
            if (index === 1) {
              return (
                <div key={`spacer-${index}`} className="flex-1 flex justify-center">
                  <Link href={item.path!}>
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
                </div>
              );
            }
            
            return (
              <div key={item.id} className="flex-1 flex justify-center">
                <Link href={item.path!}>
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
              </div>
            );
          })}
        </div>
      </nav>
      
      <FloatingPostButton />
      
      <SearchPage 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
