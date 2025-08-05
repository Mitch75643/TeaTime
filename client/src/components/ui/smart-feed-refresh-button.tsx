import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SmartFeedRefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
  newPostsAvailable?: number;
  hasMore?: boolean;
  nextBatchAvailable?: number;
  className?: string;
}

export function SmartFeedRefreshButton({
  onRefresh,
  isLoading,
  newPostsAvailable,
  hasMore,
  nextBatchAvailable,
  className = ""
}: SmartFeedRefreshButtonProps) {
  // Priority: Show new posts notification first
  if (newPostsAvailable && newPostsAvailable > 0) {
    return (
      <div className={`sticky top-32 z-20 px-4 py-2 ${className}`}>
        <Button
          onClick={onRefresh}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow-sm"
        >
          🔄 {newPostsAvailable} New Posts – Tap to View
        </Button>
      </div>
    );
  }

  // Secondary: Show "refresh to see more" if there are queued posts
  if (hasMore && nextBatchAvailable && nextBatchAvailable > 0) {
    return (
      <div className={`text-center pt-6 ${className}`}>
        <Button
          onClick={onRefresh}
          variant="outline"
          className="px-6 py-3 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium"
        >
          Refresh to see more posts ({nextBatchAvailable} available)
        </Button>
      </div>
    );
  }

  // Fallback: Regular refresh button
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
      className={`flex items-center space-x-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors ${className}`}
    >
      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
      <span className="text-xs">Refresh</span>
    </Button>
  );
}