import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "./button";
import { DramaVoting } from "./drama-voting";
import { MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
}

const categoryData: Record<string, { emoji: string; gradient: string; color: string }> = {
  college: { emoji: "🎓", gradient: "gradient-secondary", color: "bg-blue-50 text-blue-700 border-blue-200" },
  work: { emoji: "💼", gradient: "gradient-primary", color: "bg-purple-50 text-purple-700 border-purple-200" },
  relationships: { emoji: "💕", gradient: "gradient-drama", color: "bg-pink-50 text-pink-700 border-pink-200" },
  family: { emoji: "👨‍👩‍👧‍👦", gradient: "gradient-soft", color: "bg-green-50 text-green-700 border-green-200" },
  money: { emoji: "💰", gradient: "gradient-secondary", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  politics: { emoji: "🗳️", gradient: "gradient-primary", color: "bg-red-50 text-red-700 border-red-200" },
  drama: { emoji: "🎭", gradient: "gradient-drama", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

const reactionEmojis = {
  fire: "🔥",
  cry: "😭",
  eyes: "👀",
  clown: "🤡",
};

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const reactionMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      return apiRequest("POST", "/api/reactions", {
        type,
        postId: post.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const handleReaction = (type: string) => {
    reactionMutation.mutate({ type });
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true });
  const categoryInfo = categoryData[post.category];
  const categoryLabel = post.category === "drama" ? "Am I the Drama?" : 
    post.category === "relationships" ? "Love" :
    post.category.charAt(0).toUpperCase() + post.category.slice(1);

  // Calculate trending score for visual indication
  const reactions = post.reactions as any || {};
  const trendingScore = (reactions.fire || 0) * 3 + 
                       (reactions.eyes || 0) * 2 + 
                       (reactions.cry || 0) + 
                       (reactions.clown || 0) + 
                       (post.commentCount || 0) * 2;
  const isTrending = trendingScore > 20;

  return (
    <article className={cn(
      "rounded-3xl shadow-lg border-2 p-6 space-y-4 relative overflow-hidden animate-slide-up button-hover-lift transition-all duration-300",
      post.isDrama 
        ? "bg-gradient-to-br from-rose-50 via-orange-50 to-pink-50 border-rose-200/50"
        : "bg-white/80 backdrop-blur-sm border-pink-100/50"
    )}>
      {/* Trending Badge */}
      {isTrending && (
        <div className="absolute top-0 right-0 gradient-drama text-white px-4 py-2 text-xs font-bold rounded-bl-2xl shadow-md">
          <span className="emoji-lg mr-1">🔥</span>
          TRENDING
        </div>
      )}

      <div className={cn("flex items-start justify-between", isTrending && "pt-3")}>
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-md border-2 border-white",
            post.isDrama 
              ? "gradient-drama"
              : categoryInfo?.gradient || "gradient-primary"
          )}>
            <span className="text-white text-lg font-bold">
              {post.alias.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{post.alias}</p>
            <p className="text-xs text-gray-500 font-medium">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={cn(
            "px-3 py-2 text-xs font-semibold rounded-xl border-2 shadow-sm",
            categoryInfo?.color || "bg-gray-50 text-gray-700 border-gray-200"
          )}>
            <span className="emoji-lg mr-1">{categoryInfo?.emoji}</span>
            {categoryLabel}
          </span>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-gray-800 leading-relaxed font-medium text-base">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full font-semibold border",
                  post.isDrama 
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
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
        "flex items-center justify-between pt-4 border-t-2",
        post.isDrama ? "border-rose-200/50" : "border-pink-100/50"
      )}>
        <div className="flex items-center space-x-2">
          {Object.entries(reactionEmojis).map(([type, emoji]) => {
            const count = reactions[type] || 0;
            const isActive = false; // TODO: Track user reactions in session storage
            
            return (
              <Button
                key={type}
                variant="ghost"
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-200 border-2 border-transparent button-hover-lift",
                  "hover:bg-white/80 hover:shadow-md",
                  isActive && type === "fire" && "bg-red-50 text-red-600 border-red-200",
                  isActive && type === "cry" && "bg-blue-50 text-blue-600 border-blue-200",
                  isActive && type === "eyes" && "bg-yellow-50 text-yellow-600 border-yellow-200",
                  isActive && type === "clown" && "bg-purple-50 text-purple-600 border-purple-200",
                  !isActive && "text-gray-600"
                )}
                onClick={() => handleReaction(type)}
                disabled={reactionMutation.isPending}
              >
                <span className="emoji-xl">{emoji}</span>
                <span className="text-sm font-bold">{count}</span>
              </Button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-white/80 hover:shadow-md transition-all duration-200 border-2 border-transparent button-hover-lift"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{post.commentCount || 0}</span>
        </Button>
      </div>

      {/* Comments Section - TODO: Implement */}
      {showComments && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">Comments coming soon...</p>
        </div>
      )}
    </article>
  );
}
