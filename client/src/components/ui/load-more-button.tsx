import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  remainingCount: number;
  className?: string;
}

export function LoadMoreButton({ onLoadMore, remainingCount, className = "" }: LoadMoreButtonProps) {
  return (
    <div className={`text-center pt-6 ${className}`}>
      <Button
        variant="outline"
        onClick={onLoadMore}
        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
      >
        Load More Posts ({remainingCount} remaining)
      </Button>
    </div>
  );
}