import { useState } from "react";
import { Button } from "./button";
import { SearchPage } from "./search-page";
import { FloatingPostButton } from "./floating-post-button";
import { Home, Coffee, Settings, Users } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "daily", label: "Daily", icon: Coffee, path: "/daily-spill" },
    { id: "community", label: "Community", icon: Users, path: "/community" },
    { id: "me", label: "Profile", icon: Settings, path: "/profile" },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-2xl border-t border-gray-200/50 dark:border-gray-700/50 max-w-md mx-auto">
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600"></div>
        
        <div className="flex items-center justify-around py-3 px-2 relative">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            // Add spacer for the floating button in the middle
            if (index === 1) {
              return (
                <div key={`spacer-${index}`} className="flex-1 flex justify-center relative">
                  <Link href={item.path!}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex flex-col items-center py-2 px-3 transition-all duration-300 relative group",
                        isActive 
                          ? "text-orange-500 dark:text-orange-400" 
                          : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      )}
                    >
                      {/* Active glow effect */}
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-pulse"></div>
                      )}
                      
                      <Icon className={cn(
                        "h-6 w-6 transition-all duration-300",
                        isActive ? "mb-1 scale-110" : "mb-0"
                      )} />
                      
                      {/* Dynamic label - only show when active */}
                      <span className={cn(
                        "text-xs font-medium transition-all duration-300 overflow-hidden",
                        isActive 
                          ? "max-h-6 opacity-100 mt-1" 
                          : "max-h-0 opacity-0 mt-0"
                      )}>
                        {item.label}
                      </span>
                    </Button>
                  </Link>
                </div>
              );
            }
            
            return (
              <div key={item.id} className="flex-1 flex justify-center relative">
                <Link href={item.path!}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex flex-col items-center py-2 px-3 transition-all duration-300 relative group",
                      isActive 
                        ? "text-orange-500 dark:text-orange-400" 
                        : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    )}
                  >
                    {/* Active glow effect */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-pulse"></div>
                    )}
                    
                    <Icon className={cn(
                      "h-6 w-6 transition-all duration-300",
                      isActive ? "mb-1 scale-110" : "mb-0"
                    )} />
                    
                    {/* Dynamic label - only show when active */}
                    <span className={cn(
                      "text-xs font-medium transition-all duration-300 overflow-hidden",
                      isActive 
                        ? "max-h-6 opacity-100 mt-1" 
                        : "max-h-0 opacity-0 mt-0"
                    )}>
                      {item.label}
                    </span>
                  </Button>
                </Link>
              </div>
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
