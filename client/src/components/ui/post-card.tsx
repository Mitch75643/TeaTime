import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "./button";
import { DramaVoting } from "./drama-voting";
import { CommentsDrawer } from "./comments-drawer";
import { PostMenu } from "./post-menu";
import { PostStats, usePostView } from "./post-stats";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Post } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
  hideStoryCategory?: boolean;
}

const categoryEmojis: Record<string, string> = {
  school: "🏫",
  work: "💼",
  relationships: "💕",
  family: "👨‍👩‍👧",
  money: "💸",
  "hot-takes": "🌍",
  drama: "🎭",
  other: "📝",
};

const categoryColors: Record<string, string> = {
  school: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
  work: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700",
  relationships: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700",
  family: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  money: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700",
  "hot-takes": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700",
  drama: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600",
};

const storyTypeEmojis: Record<string, string> = {
  horror: "😱",
  funny: "😂",
  weird: "🤔",
  romantic: "💕",
  embarrassing: "😳",
};

const storyTypeColors: Record<string, string> = {
  horror: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700",
  funny: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  weird: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700",
  romantic: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-700",
  embarrassing: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700",
};

const reactionEmojis = {
  thumbsUp: "👍",
  thumbsDown: "👎",
  laugh: "😂",
  sad: "😲", 
};

export function PostCard({ post, hideStoryCategory = false }: PostCardProps) {
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState<string>('');
  const [liveReactions, setLiveReactions] = useState<Record<string, number>>(
    post.reactions as Record<string, number> || { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 }
  );
  const [liveCommentCount, setLiveCommentCount] = useState<number>(post.commentCount || 0);
  const queryClient = useQueryClient();
  const { profile, getCachedProfile } = useUserProfile();
  const { subscribeToMessages } = useWebSocket();
  
  // Use cached profile data to prevent flashing - try multiple sources immediately
  const cachedProfile = getCachedProfile();
  const userAvatarId = profile?.avatarId || cachedProfile?.avatarId || localStorage.getItem('userAvatarId') || 'mask-anonymous';
  const storedAlias = localStorage.getItem('userUsername');
  const userAlias = profile?.alias || cachedProfile?.alias || (storedAlias ? JSON.parse(storedAlias).alias : 'Anonymous');
  const avatarColor = profile?.avatarColor || cachedProfile?.avatarColor || localStorage.getItem('userAvatarColor') || 'gradient-purple-blue';

  // Check if this is the user's own post
  const isOwner = sessionId === post.sessionId;

  // Track post view for non-owners
  usePostView(post.id, isOwner);

  // Get current session ID
  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(data => setSessionId(data.sessionId))
      .catch(() => setSessionId(''));
  }, []);

  // Load user reactions from localStorage and ensure only one is active
  useEffect(() => {
    const savedReactions = localStorage.getItem(`reactions-${post.id}`);
    if (savedReactions) {
      const parsed = JSON.parse(savedReactions);
      // Ensure only one reaction is true at a time
      const activeReactions = Object.keys(parsed).filter(key => parsed[key]);
      if (activeReactions.length > 1) {
        // Fix corrupted state - keep only the first active reaction
        const cleanReactions: Record<string, boolean> = {};
        Object.keys(reactionEmojis).forEach(key => {
          cleanReactions[key] = key === activeReactions[0];
        });
        setUserReactions(cleanReactions);
        localStorage.setItem(`reactions-${post.id}`, JSON.stringify(cleanReactions));
      } else {
        setUserReactions(parsed);
      }
    }
  }, [post.id]);

  // Subscribe to real-time reaction and comment updates
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'post_reaction' && message.postId === post.id) {
        console.log('Real-time reaction update received:', message);
        // Update the live reaction counts immediately
        setLiveReactions(prev => {
          const newCounts = { ...prev };
          const { type, action } = message.data;
          
          if (action === 'add') {
            newCounts[type] = (newCounts[type] || 0) + 1;
          } else if (action === 'remove') {
            newCounts[type] = Math.max(0, (newCounts[type] || 0) - 1);
          }
          
          console.log('Updated reaction counts:', newCounts);
          return newCounts;
        });
      } else if (message.type === 'comment_added' && message.postId === post.id) {
        console.log('Real-time comment added:', message);
        // Update local comment count immediately for real-time UI
        setLiveCommentCount(prev => prev + 1);
        // Invalidate posts query to refresh comment counts
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        // Also invalidate any community-specific queries
        queryClient.invalidateQueries({ queryKey: ["/api/posts", "community"] });
      }
    });

    return unsubscribe;
  }, [post.id, subscribeToMessages, queryClient]);

  // Update live reactions and comment count when post data changes (initial load)
  useEffect(() => {
    const postReactions = post.reactions as Record<string, number> || { thumbsUp: 0, thumbsDown: 0, laugh: 0, sad: 0 };
    setLiveReactions(postReactions);
    setLiveCommentCount(post.commentCount || 0);
  }, [post.reactions, post.commentCount]);

  const reactionMutation = useMutation({
    mutationFn: async ({ type, remove }: { type: string; remove?: boolean }) => {
      return apiRequest("POST", "/api/reactions", {
        type,
        postId: post.id,
        remove: remove || false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const handleReaction = (type: string) => {
    // Prevent multiple rapid clicks
    if (reactionMutation.isPending) return;
    
    // Get the currently active reaction type (if any)
    const currentActiveType = Object.keys(userReactions).find(key => userReactions[key]);
    const isCurrentType = userReactions[type];
    
    let newUserReactions: Record<string, boolean> = {};
    
    if (isCurrentType) {
      // Toggle off - remove current reaction
      Object.keys(reactionEmojis).forEach(key => {
        newUserReactions[key] = false;
      });
    } else {
      // Set new reaction - clear all others and set this one
      Object.keys(reactionEmojis).forEach(key => {
        newUserReactions[key] = key === type;
      });
    }
    
    setUserReactions(newUserReactions);
    localStorage.setItem(`reactions-${post.id}`, JSON.stringify(newUserReactions));
    
    // Send to server - backend will handle "one reaction per user" logic
    reactionMutation.mutate({ 
      type, 
      remove: isCurrentType
    });
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true });
  const categoryLabel = post.category === "drama" ? "Am I in the Wrong?" : 
    post.category === "hot-takes" ? "Hot Takes" :
    post.category === "other" ? "Other" :
    post.category.charAt(0).toUpperCase() + post.category.slice(1);

  // Use live reactions for display and calculations
  const reactions = liveReactions;
  const trendingScore = (reactions.laugh || 0) * 3 + 
                       (reactions.thumbsUp || 0) * 2 + 
                       (reactions.sad || 0) + 
                       (reactions.thumbsDown || 0) * 0.5 + 
                       (post.commentCount || 0) * 2;
  const isTrending = trendingScore > 20;

  return (
    <article 
      id={`post-${post.id}`}
      className={cn(
        "w-full max-w-full rounded-2xl p-6 space-y-4 relative overflow-hidden break-words",
        "bg-white dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200",
        "mx-auto"
      )}
      style={{ minWidth: "100%", maxWidth: "100%" }}>
      {/* Trending Badge */}
      {isTrending && !post.isDrama && (
        <div className="absolute top-0 right-0 gradient-drama text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
          🔥 TRENDING
        </div>
      )}

      <div className={cn("flex items-start justify-between gap-3", isTrending && !post.isDrama && "pt-2")}>
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <AvatarDisplay
            avatarId={sessionId && post.sessionId === sessionId ? userAvatarId : (post.avatarId || 'mask-anonymous')}
            size="sm"
            showBorder={false}
            gradientColors={sessionId && post.sessionId === sessionId ? avatarColor : undefined}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {sessionId && post.sessionId === sessionId ? userAlias : post.alias}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Hide category badge for story posts in story-time section */}
          {!(hideStoryCategory && post.category === 'story') && (
            <span className={cn(
              "px-3 py-1 text-xs font-bold rounded-full border-2 shadow-sm whitespace-nowrap",
              post.isDrama 
                ? "gradient-drama text-white border-red-300"
                : categoryColors[post.category] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600"
            )}>
              {categoryEmojis[post.category]} {categoryLabel}
            </span>
          )}
          {/* Story Type Badge */}
          {post.storyType && (
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap",
              storyTypeColors[post.storyType] || "bg-gray-100 text-gray-700 border-gray-200"
            )}>
              {storyTypeEmojis[post.storyType]} {post.storyType.charAt(0).toUpperCase() + post.storyType.slice(1)}
            </span>
          )}
          <PostMenu 
            postId={post.id} 
            isOwner={post.sessionId === sessionId && sessionId !== ''} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-gray-900 dark:text-gray-100 leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Drama Voting Component */}
      {post.isDrama && <DramaVoting postId={post.id} />}

      {/* Reactions */}
      <div className={cn(
        "flex items-center justify-between pt-3"
      )}>
        <div className="flex items-center space-x-4">
          {Object.entries(reactionEmojis).map(([type, emoji]) => {
            const count = reactions[type as keyof typeof reactions] || 0;
            const isActive = userReactions[type] || false;
            
            const hasOtherReaction = Object.keys(userReactions).some(key => key !== type && userReactions[key]);
            
            return (
              <Button
                key={type}
                variant="ghost"
                className={cn(
                  "flex items-center space-x-1 transition-all p-1 hover:scale-110",
                  isActive ? (
                    type === "fire" ? "text-red-500 font-medium bg-red-50 dark:bg-red-900/20 ring-2 ring-red-200" :
                    type === "cry" ? "text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200" :
                    type === "eyes" ? "text-yellow-600 font-medium bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-200" :
                    "text-purple-500 font-medium bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-200"
                  ) : hasOtherReaction ? 
                    "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 opacity-60" :
                    "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Reaction button clicked:', type, 'for post:', post.id);
                  handleReaction(type);
                }}
                disabled={reactionMutation.isPending}
              >
                <span className={cn(
                  "text-lg transition-transform", 
                  isActive && "animate-pulse scale-110",
                  hasOtherReaction && !isActive && "opacity-50"
                )}>{emoji}</span>
                <span className="text-sm font-medium">{count}</span>
              </Button>
            );
          })}
        </div>
        <CommentsDrawer 
          postId={post.id} 
          commentCount={liveCommentCount}
          isDrama={post.isDrama || false}
        />
      </div>

      {/* Post Stats - only visible to post owner */}
      <PostStats
        postId={post.id}
        isOwner={isOwner}
        viewCount={post.viewCount ?? undefined}
        commentCount={liveCommentCount}
        reactions={post.reactions ? JSON.parse(JSON.stringify(post.reactions)) : undefined}
        createdAt={post.createdAt ?? undefined}
        compact={true}
      />

    </article>
  );
}
