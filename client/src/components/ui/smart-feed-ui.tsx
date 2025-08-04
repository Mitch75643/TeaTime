import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewPostsBannerProps {
  count: number;
  onAccept: () => void;
  onDismiss: () => void;
  show: boolean;
}

export function NewPostsBanner({ count, onAccept, onDismiss, show }: NewPostsBannerProps) {
  if (!show || count === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-top-2 duration-300">
      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 shadow-lg">
        <div className="flex items-center justify-between p-3 space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-orange-600 dark:text-orange-400">🔄</span>
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              {count} New Post{count !== 1 ? 's' : ''} — Tap to View
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAccept}
              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-xs px-2 py-1 h-auto"
            >
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 p-1 h-auto"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface StickyRefreshHeaderProps {
  title: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  subtitle?: string;
  className?: string;
}

export function StickyRefreshHeader({ 
  title, 
  onRefresh, 
  isRefreshing, 
  subtitle,
  className 
}: StickyRefreshHeaderProps) {
  return (
    <div className={cn(
      "sticky top-24 z-30 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm",
      className
    )}>
      <div className="px-4 md:px-6 lg:px-8 py-3 max-w-screen-sm lg:max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs">Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  className?: string;
}

export function LoadMoreButton({ onLoadMore, isLoading, hasMore, className }: LoadMoreButtonProps) {
  if (!hasMore) {
    return (
      <div className={cn("text-center py-8 pb-20", className)}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          You've reached the end! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className={cn("text-center py-6", className)}>
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading}
        className="flex items-center space-x-2 mx-auto"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>Load More Posts</span>
          </>
        )}
      </Button>
    </div>
  );
}

interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SmartFeedContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function SmartFeedContainer({ children, className }: SmartFeedContainerProps) {
  return (
    <main className={cn(
      "pb-24 px-4 md:px-6 lg:px-8 pt-6 max-w-screen-sm lg:max-w-2xl mx-auto",
      className
    )}>
      <div className="space-y-6">
        {children}
      </div>
    </main>
  );
}