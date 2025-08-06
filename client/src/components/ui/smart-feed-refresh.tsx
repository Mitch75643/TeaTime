// Smart Feed Refresh Button Component
import { Button } from "./button";
import { RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartFeedRefreshProps {
  pendingCount: number;
  showRefreshPrompt: boolean;
  hasMore: boolean;
  nextBatch: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  className?: string;
}

export function SmartFeedRefresh({
  pendingCount,
  showRefreshPrompt,
  hasMore,
  nextBatch,
  onRefresh,
  onLoadMore,
  isRefreshing = false,
  isLoadingMore = false,
  className
}: SmartFeedRefreshProps) {
  return (
    <div className={cn("flex flex-col space-y-3 my-4", className)}>
      {/* New posts available prompt */}
      {showRefreshPrompt && pendingCount > 0 && (
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md border-0 relative overflow-hidden"
        >
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="font-medium">
              🔄 {pendingCount} New Post{pendingCount !== 1 ? 's' : ''} – Tap to View
            </span>
          </div>
          
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 opacity-0 hover:opacity-20 transition-opacity duration-300" />
        </Button>
      )}

      {/* Regular refresh button (always visible) */}
      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        variant="outline"
        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 transition-all duration-200"
      >
        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
        {isRefreshing ? "Refreshing..." : "Refresh Feed"}
      </Button>

      {/* Load more posts button */}
      {nextBatch && hasMore && (
        <Button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          variant="ghost"
          className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowDown className={cn("h-4 w-4 mr-2", isLoadingMore && "animate-bounce")} />
          {isLoadingMore ? "Loading More..." : "Refresh to see more posts"}
        </Button>
      )}
    </div>
  );
}