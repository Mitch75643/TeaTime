import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "./button";
import { DramaVoting } from "./drama-voting";
import { CommentsDrawer } from "./comments-drawer";
import { MoreHorizontal } from "lucide-react";
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
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  // Load user reactions from localStorage
  useEffect(() => {
    const savedReactions = localStorage.getItem(`reactions-${post.id}`);
    if (savedReactions) {
      setUserReactions(JSON.parse(savedReactions));
    }
  }, [post.id]);

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
    // Update local state immediately for better UX
    const newUserReactions = { ...userReactions, [type]: !userReactions[type] };
    setUserReactions(newUserReactions);
    localStorage.setItem(`reactions-${post.id}`, JSON.stringify(newUserReactions));
    
    reactionMutation.mutate({ type });
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true });
  const categoryLabel = post.category === "drama" ? "Am I the Drama?" : 
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
            const count = reactions[type as keyof typeof reactions] || 0;
            const isActive = userReactions[type] || false;
            
            return (
              <Button
                key={type}
                variant="ghost"
                className={cn(
                  "flex items-center space-x-1 transition-all p-1 hover:scale-110",
                  isActive ? (
                    type === "fire" ? "text-red-500 font-medium bg-red-50 dark:bg-red-900/20" :
                    type === "cry" ? "text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20" :
                    type === "eyes" ? "text-yellow-600 font-medium bg-yellow-50 dark:bg-yellow-900/20" :
                    "text-purple-500 font-medium bg-purple-50 dark:bg-purple-900/20"
                  ) : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                )}
                onClick={() => handleReaction(type)}
                disabled={reactionMutation.isPending}
              >
                <span className={cn("text-lg transition-transform", isActive && "animate-pulse")}>{emoji}</span>
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
