import { Button } from "./button";
import { RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartRefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  newPostsCount: number;
  queuedPostsCount: number;
  variant?: "banner" | "button" | "floating";
  className?: string;
}

export function SmartRefreshButton({
  onRefresh,
  isRefreshing,
  newPostsCount,
  queuedPostsCount,
  variant = "button",
  className
}: SmartRefreshButtonProps) {
  
  if (variant === "banner" && newPostsCount > 0) {
    return (
      <div 
        onClick={onRefresh}
        className={cn(
          "sticky top-0 z-40 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]",
          "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg",
          "px-4 py-3 mx-4 mt-4 rounded-xl border border-orange-400",
          "flex items-center justify-center space-x-2",
          isRefreshing && "opacity-75 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center space-x-2">
          <ArrowDown className={cn("h-4 w-4", isRefreshing && "animate-bounce")} />
          <span className="font-medium text-sm">
            {isRefreshing 
              ? "Loading new posts..." 
              : `🔄 ${newPostsCount} New Post${newPostsCount === 1 ? '' : 's'} – Tap to View`
            }
          </span>
        </div>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "bg-orange-500 hover:bg-orange-600 text-white shadow-lg rounded-full px-6 py-3",
            "flex items-center space-x-2 transition-all duration-300 transform hover:scale-105",
            isRefreshing && "opacity-75",
            className
          )}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span className="font-medium text-sm">
            {isRefreshing ? "Refreshing..." : "Refresh Feed"}
          </span>
        </Button>
      </div>
    );
  }

  // Default button variant
  return (
    <Button
      onClick={onRefresh}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
      className={cn(
        "flex items-center space-x-2 transition-all duration-200",
        "border border-orange-200 hover:border-orange-300 hover:bg-orange-50",
        "text-orange-600 hover:text-orange-700",
        isRefreshing && "opacity-75 cursor-not-allowed",
        className
      )}
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      <span className="text-sm font-medium">
        {queuedPostsCount > 0 
          ? `Refresh to see more posts (${queuedPostsCount} queued)`
          : isRefreshing 
            ? "Refreshing..." 
            : "Refresh Feed"
        }
      </span>
    </Button>
  );
}