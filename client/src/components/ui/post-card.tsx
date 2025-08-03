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

const categoryEmojis: Record<string, string> = {
  college: "🎓",
  work: "💼",
  relationships: "💕",
  family: "👨‍👩‍👧‍👦",
  money: "💰",
  politics: "🗳️",
  drama: "🎭",
};

const categoryColors: Record<string, string> = {
  college: "bg-green-100 text-green-800",
  work: "bg-blue-100 text-blue-800",
  relationships: "bg-pink-100 text-pink-800",
  family: "bg-purple-100 text-purple-800",
  money: "bg-yellow-100 text-yellow-800",
  politics: "bg-red-100 text-red-800",
  drama: "bg-orange-100 text-orange-800",
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
  const categoryLabel = post.category === "drama" ? "Am I the Drama?" : 
    post.category.charAt(0).toUpperCase() + post.category.slice(1);

  // Calculate trending score for visual indication
  const trendingScore = (post.reactions?.fire || 0) * 3 + 
                       (post.reactions?.eyes || 0) * 2 + 
                       (post.reactions?.cry || 0) + 
                       (post.reactions?.clown || 0) + 
                       post.commentCount * 2;
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
          <Button variant="ghost" size="icon" className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
            const count = post.reactions?.[type as keyof typeof post.reactions] || 0;
            const isActive = false; // TODO: Track user reactions in session storage
            
            return (
              <Button
                key={type}
                variant="ghost"
                className={cn(
                  "flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors p-1",
                  isActive && type === "fire" && "text-red-500 font-medium",
                  isActive && type === "cry" && "text-blue-500 font-medium",
                  isActive && type === "eyes" && "text-yellow-500 font-medium",
                  isActive && type === "clown" && "text-purple-500 font-medium"
                )}
                onClick={() => handleReaction(type)}
                disabled={reactionMutation.isPending}
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-medium">{count}</span>
              </Button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors p-1"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{post.commentCount}</span>
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
