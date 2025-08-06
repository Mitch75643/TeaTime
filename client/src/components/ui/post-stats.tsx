import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Eye, Mail, Clock, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PostStatsProps {
  postId: string;
  isOwner: boolean;
  viewCount?: number;
  commentCount?: number;
  reactions?: Record<string, number>;
  createdAt?: Date;
  compact?: boolean;
}

interface PostStats {
  viewCount: number;
  commentCount: number;
  reactions: Record<string, number>;
  lastViewedAt?: Date;
}

export function PostStats({ 
  postId, 
  isOwner, 
  viewCount: initialViewCount = 0,
  commentCount: initialCommentCount = 0,
  reactions: initialReactions = {},
  createdAt,
  compact = false 
}: PostStatsProps) {
  const [stats, setStats] = useState<PostStats>({
    viewCount: initialViewCount,
    commentCount: initialCommentCount,
    reactions: initialReactions,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Track view when component mounts (if not the owner)
    if (!isOwner) {
      fetch(`/api/posts/${postId}/view`, { method: 'POST' })
        .catch(err => console.error('Failed to track view:', err));
    }

    // Fetch current stats if user is the owner
    if (isOwner) {
      fetch(`/api/posts/${postId}/stats`)
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Failed to fetch stats:', err));
    }
  }, [postId, isOwner]);

  // Calculate total reactions
  const totalReactions = Object.values(stats.reactions).reduce((sum, count) => sum + count, 0);

  // Get milestone badge
  const getMilestoneBadge = () => {
    if (stats.viewCount >= 100) return { text: "Trending Spill!", icon: TrendingUp, color: "bg-orange-100 text-orange-700" };
    if (stats.viewCount >= 50) return { text: "Popular Post", icon: Trophy, color: "bg-yellow-100 text-yellow-700" };
    if (stats.viewCount >= 25) return { text: "Getting Views", icon: Eye, color: "bg-blue-100 text-blue-700" };
    return null;
  };

  const milestone = getMilestoneBadge();

  if (!isOwner) {
    // Non-owners see no stats to maintain anonymity
    return null;
  }

  if (compact) {
    // Compact view for post cards
    return (
      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <Eye className="h-3 w-3" />
          <span>{stats.viewCount} view{stats.viewCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Mail className="h-3 w-3" />
          <span>{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
        </div>

        {milestone && (
          <Badge className={cn("text-xs px-1.5 py-0.5", milestone.color)}>
            <milestone.icon className="h-2.5 w-2.5 mr-1" />
            {milestone.text}
          </Badge>
        )}
      </div>
    );
  }

  // Expanded view for detailed stats
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-orange-500" />
            <span>Your Post Activity</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-600">{stats.viewCount}</div>
            <div className="text-xs text-gray-500">
              {stats.viewCount === 1 ? 'person viewed' : 'people viewed'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{totalReactions}</div>
            <div className="text-xs text-gray-500">
              {totalReactions === 1 ? 'reaction' : 'reactions'}
            </div>
          </div>
        </div>

        {/* Milestone Badge */}
        {milestone && (
          <div className="flex justify-center">
            <Badge className={cn("text-sm px-3 py-1", milestone.color)}>
              <milestone.icon className="h-4 w-4 mr-2" />
              {milestone.text}
            </Badge>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {stats.lastViewedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last viewed:</span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(stats.lastViewedAt))} ago</span>
                </span>
              </div>
            )}
            
            {createdAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Posted:</span>
                <span>{formatDistanceToNow(createdAt)} ago</span>
              </div>
            )}

            {/* Engagement Rate */}
            {stats.viewCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Engagement rate:</span>
                <span>
                  {Math.round((totalReactions / stats.viewCount) * 100)}%
                </span>
              </div>
            )}

            {/* Supportive Messages */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {stats.viewCount === 0 && "Your post is ready to be discovered! 🌟"}
                {stats.viewCount > 0 && stats.viewCount < 10 && "Great start! People are finding your post. ✨"}
                {stats.viewCount >= 10 && stats.viewCount < 25 && "Nice engagement! Your story is resonating. 💫"}
                {stats.viewCount >= 25 && stats.viewCount < 50 && "Impressive reach! You're making an impact. 🚀"}
                {stats.viewCount >= 50 && "Amazing! Your post is really connecting with the community. 🏆"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for tracking post views
export function usePostView(postId: string, isOwner: boolean) {
  useEffect(() => {
    if (!isOwner && postId) {
      // Small delay to avoid tracking while user is just scrolling through
      const timer = setTimeout(() => {
        fetch(`/api/posts/${postId}/view`, { method: 'POST' })
          .catch(err => console.error('Failed to track view:', err));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [postId, isOwner]);
}