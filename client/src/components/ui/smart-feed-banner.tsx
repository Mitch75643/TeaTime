import { RefreshCw } from "lucide-react";

interface SmartFeedBannerProps {
  newPostsCount: number;
  onLoadNewPosts: () => void;
  className?: string;
}

export function SmartFeedBanner({ newPostsCount, onLoadNewPosts, className = "" }: SmartFeedBannerProps) {
  // Cap the displayed number at 20 for visual purposes only
  const displayCount = Math.min(newPostsCount, 20);
  const showPlus = newPostsCount > 20;
  
  return (
    <div className={`sticky top-44 z-0 max-w-xs lg:max-w-sm mx-auto ${className}`}>
      <div className="bg-orange-500/90 dark:bg-orange-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg">
        <button 
          onClick={onLoadNewPosts}
          className="w-full flex items-center justify-center space-x-2 font-medium hover:bg-white/10 transition-colors rounded px-2 py-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>
            {showPlus ? `${displayCount}+` : displayCount} New Post{newPostsCount > 1 ? 's' : ''} — Tap to Refresh
          </span>
        </button>
      </div>
    </div>
  );
}