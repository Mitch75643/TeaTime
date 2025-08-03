import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FeedToggleProps {
  feedType: "trending" | "new";
  onFeedTypeChange: (type: "trending" | "new") => void;
}

export function FeedToggle({ feedType, onFeedTypeChange }: FeedToggleProps) {
  return (
    <div className="bg-white px-4 py-2 border-b border-gray-100">
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            feedType === "trending"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:bg-white/50"
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
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:bg-white/50"
          )}
          onClick={() => onFeedTypeChange("new")}
        >
          ⭐ New
        </Button>
      </div>
    </div>
  );
}
