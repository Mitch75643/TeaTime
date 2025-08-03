import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "./button";
import { DramaVoting } from "./drama-voting";
import { CommentsDrawer } from "./comments-drawer";
import { PostMenu } from "./post-menu";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
}

const categoryEmojis: Record<string, string> = {
  school: "🏫",
  work: "💼",
  relationships: "💕",
  family: "👨‍👩‍👧",
  money: "💸",
  "hot-takes": "🌍",
  drama: "🎭",
};

const categoryColors: Record<string, string> = {
  school: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  work: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  relationships: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300",
  family: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  money: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  "hot-takes": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  drama: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
};

const reactionEmojis = {
  fire: "🔥",
  cry: "😭",
  eyes: "👀",
  clown: "🤡",
};

export function PostCard({ post }: PostCardProps) {
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState<string>('');
  const queryClient = useQueryClient();

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
  const categoryLabel = post.category === "drama" ? "Am I the Drama?" : 
    post.category === "hot-takes" ? "Hot Takes" :
    post.category.charAt(0).toUpperCase() + post.category.slice(1);

  // Calculate trending score for visual indication
  const reactions = post.reactions as Record<string, number> || { fire: 0, cry: 0, eyes: 0, clown: 0 };
  const trendingScore = (reactions.fire || 0) * 3 + 
                       (reactions.eyes || 0) * 2 + 
                       (reactions.cry || 0) + 
                       (reactions.clown || 0) + 
                       (post.commentCount || 0) * 2;
  const isTrending = trendingScore > 20;

  return (
    <article className={cn(
      "rounded-2xl shadow-sm border p-4 space-y-3 relative overflow-hidden",
      post.isDrama 
        ? "bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200"
        : "bg-white border-gray-100"
    )}>
      {/* Trending Badge */}
      {isTrending && !post.isDrama && (
        <div className="absolute top-0 right-0 gradient-drama text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
          🔥 TRENDING
        </div>
      )}

      <div className={cn("flex items-start justify-between", isTrending && !post.isDrama && "pt-2")}>
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            post.isDrama 
              ? "bg-gradient-to-br from-orange-400 to-red-500"
              : "bg-gradient-to-br from-purple-400 to-pink-400"
          )}>
            <span className="text-white text-xs font-bold">
              {post.alias.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{post.alias}</p>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            post.isDrama 
              ? "gradient-drama text-white"
              : categoryColors[post.category] || "bg-gray-100 text-gray-800"
          )}>
            {categoryEmojis[post.category]} {categoryLabel}
          </span>
          <PostMenu 
            postId={post.id} 
            isOwner={post.sessionId === sessionId && sessionId !== ''} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-gray-900 leading-relaxed">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  post.isDrama 
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                )}
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
        "flex items-center justify-between pt-2 border-t",
        post.isDrama ? "border-orange-200" : "border-gray-100"
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
                onClick={() => handleReaction(type)}
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
          commentCount={post.commentCount || 0}
          isDrama={post.isDrama || false}
        />
      </div>


    </article>
  );
}
