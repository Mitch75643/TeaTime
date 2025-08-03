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
            "flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all font-medium text-sm",
            feedType === "new"
              ? "bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          )}
          onClick={() => onFeedTypeChange("new")}
        >
          <Clock className="h-4 w-4" />
          <span>🆕 New</span>
        </Button>
        
        <Button
          variant="ghost"
          className={cn(
            "flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all font-medium text-sm",
            feedType === "trending"
              ? "bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          )}
          onClick={() => onFeedTypeChange("trending")}
        >
          <TrendingUp className="h-4 w-4" />
          <span>🔥 Trending</span>
        </Button>
      </div>
    </div>
  );
}