import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FeedToggleProps {
  feedType: "trending" | "new";
  onFeedTypeChange: (type: "trending" | "new") => void;
}

export function FeedToggle({ feedType, onFeedTypeChange }: FeedToggleProps) {
  return (
    <div className="bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            feedType === "trending"
              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-600/50"
          )}
          onClick={() => onFeedTypeChange("trending")}
        >
          🔥 Trending
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            feedType === "new"
              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-600/50"
          )}
          onClick={() => onFeedTypeChange("new")}
        >
          ⭐ New
        </Button>
      </div>
    </div>
  );
}
