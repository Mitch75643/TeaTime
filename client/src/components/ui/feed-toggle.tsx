import { Button } from "./button";
import { cn } from "@/lib/utils";
import { TrendingUp, Sparkles } from "lucide-react";

interface FeedToggleProps {
  feedType: "trending" | "new";
  onFeedTypeChange: (type: "trending" | "new") => void;
}

export function FeedToggle({ feedType, onFeedTypeChange }: FeedToggleProps) {
  return (
    <div className="glass px-6 py-3 border-b border-pink-100/30">
      <div className="flex space-x-2 bg-white/40 rounded-2xl p-2 backdrop-blur-sm border border-pink-100/50">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 button-hover-lift",
            feedType === "trending"
              ? "gradient-drama text-white shadow-lg transform scale-105"
              : "text-gray-600 hover:bg-white/60 hover:text-gray-800"
          )}
          onClick={() => onFeedTypeChange("trending")}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Trending
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 button-hover-lift",
            feedType === "new"
              ? "gradient-secondary text-white shadow-lg transform scale-105"
              : "text-gray-600 hover:bg-white/60 hover:text-gray-800"
          )}
          onClick={() => onFeedTypeChange("new")}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Fresh
        </Button>
      </div>
    </div>
  );
}
