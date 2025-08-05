import { RefreshCw } from "lucide-react";

interface SmartFeedBannerProps {
  newPostsCount: number;
  onLoadNewPosts: () => void;
  className?: string;
}

export function SmartFeedBanner({ newPostsCount, onLoadNewPosts, className = "" }: SmartFeedBannerProps) {
  return (
    <div className={`sticky top-36 z-0 mx-4 md:mx-6 lg:mx-8 max-w-screen-sm lg:max-w-2xl mx-auto ${className}`}>
      <div className="bg-orange-500/90 dark:bg-orange-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg">
        <button 
          onClick={onLoadNewPosts}
          className="w-full flex items-center justify-center space-x-2 font-medium hover:bg-white/10 transition-colors rounded px-2 py-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{newPostsCount} New Post{newPostsCount > 1 ? 's' : ''} — Tap to View</span>
        </button>
      </div>
    </div>
  );
}