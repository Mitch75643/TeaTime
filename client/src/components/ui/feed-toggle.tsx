import { Button } from "./button";
import { Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedToggleProps {
  feedType: "new" | "trending";
  onFeedTypeChange: (type: "new" | "trending") => void;
}

export function FeedToggle({ feedType, onFeedTypeChange }: FeedToggleProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all font-medium text-base",
            feedType === "new"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          )}
          onClick={() => onFeedTypeChange("new")}
        >
          <span><span className="animate-pulse">🆕</span> New</span>
        </Button>
        
        <Button
          variant="ghost"
          className={cn(
            "flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all font-medium text-base",
            feedType === "trending"
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          )}
          onClick={() => onFeedTypeChange("trending")}
        >
          <span><span className="animate-bounce">🔥</span> Trending</span>
        </Button>
      </div>
    </div>
  );
}