import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { ScrollArea } from "./scroll-area";
import { MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Comment, InsertComment } from "@shared/schema";

interface CommentsDrawerProps {
  postId: string;
  commentCount: number;
  isDrama?: boolean;
}

const reactionEmojis = {
  fire: "🔥",
  cry: "😭",
  eyes: "👀",
  clown: "🤡",
};

export function CommentsDrawer({ postId, commentCount, isDrama = false }: CommentsDrawerProps) {
  const [comment, setComment] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: isOpen,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: InsertComment) => {
      return apiRequest("POST", `/api/posts/${postId}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setComment("");
      toast({
        title: "Comment posted!",
        description: "Your anonymous comment has been added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ type, commentId }: { type: string; commentId: string }) => {
      return apiRequest("POST", "/api/reactions", {
        type,
        commentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) return;

    if (comment.length > 300) {
      toast({
        title: "Comment too long",
        description: "Comments must be 300 characters or less.",
        variant: "destructive",
      });
      return;
    }

    createCommentMutation.mutate({
      postId,
      content: comment.trim(),
    });
  };

  const handleReaction = (type: string, commentId: string) => {
    reactionMutation.mutate({ type, commentId });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors p-1"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{commentCount}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Comments ({commentCount})</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full mt-4">
          {/* Comments List */}
          <ScrollArea className="flex-1 pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No comments yet</p>
                <p className="text-sm text-gray-400">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className={cn(
                    "rounded-lg p-3 space-y-2",
                    isDrama 
                      ? "bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200"
                      : "bg-gray-50 border border-gray-200"
                  )}>
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isDrama 
                          ? "bg-gradient-to-br from-orange-400 to-red-500"
                          : "bg-gradient-to-br from-purple-400 to-pink-400"
                      )}>
                        <span className="text-white text-xs font-bold">
                          {comment.alias.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{comment.alias}</p>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-800 mt-1">{comment.content}</p>
                      </div>
                    </div>
                    
                    {/* Comment Reactions */}
                    <div className="flex items-center space-x-3 ml-11">
                      {Object.entries(reactionEmojis).map(([type, emoji]) => {
                        const count = comment.reactions?.[type as keyof typeof comment.reactions] || 0;
                        
                        return (
                          <Button
                            key={type}
                            variant="ghost"
                            className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors p-1 h-auto"
                            onClick={() => handleReaction(type, comment.id)}
                            disabled={reactionMutation.isPending}
                          >
                            <span className="text-sm">{emoji}</span>
                            <span className="text-xs font-medium">{count}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          <div className="border-t pt-4 space-y-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="resize-none"
              maxLength={300}
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {comment.length}/300
              </span>
              <Button
                onClick={handleSubmit}
                disabled={createCommentMutation.isPending || !comment.trim()}
                className={cn(
                  "text-white",
                  isDrama ? "gradient-drama" : "gradient-primary"
                )}
                size="sm"
              >
                {createCommentMutation.isPending ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}