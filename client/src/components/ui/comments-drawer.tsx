import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { ScrollArea } from "./scroll-area";
import { MessageCircle, Send, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useDeviceFingerprint } from "@/hooks/use-device-fingerprint";
import { getAvatarById } from "@/lib/avatars";
import type { Comment, InsertComment } from "@shared/schema";

interface CommentsDrawerProps {
  postId: string;
  commentCount: number;
  isDrama?: boolean;
}

const reactionEmojis = {
  thumbsUp: "👍",
  thumbsDown: "👎",
  laugh: "😂",
  sad: "😲",
};

export function CommentsDrawer({ postId, commentCount, isDrama = false }: CommentsDrawerProps) {
  const [comment, setComment] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sessionId, setSessionId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, getCachedProfile } = useUserProfile();
  const { canPerformAction, getFingerprint, banInfo } = useDeviceFingerprint();
  
  // Use cached profile data to prevent flashing - try multiple sources immediately
  const cachedProfile = getCachedProfile();
  const userAvatarId = profile?.avatarId || cachedProfile?.avatarId || localStorage.getItem('userAvatarId') || 'mask-anonymous';
  const storedAlias = localStorage.getItem('userUsername');
  const userAlias = profile?.alias || cachedProfile?.alias || (storedAlias ? JSON.parse(storedAlias).alias : 'Anonymous');
  const avatarColor = profile?.avatarColor || cachedProfile?.avatarColor || localStorage.getItem('userAvatarColor') || 'gradient-purple-blue';

  // Get current session ID
  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(data => setSessionId(data.sessionId))
      .catch(() => setSessionId(''));
  }, []);

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
      // Check if user is banned before attempting to comment
      if (!canPerformAction('comment')) {
        throw new Error("Access denied - device is banned from commenting");
      }

      const deviceFingerprint = getFingerprint();
      if (!deviceFingerprint) {
        throw new Error("Device security check failed");
      }

      return apiRequest("POST", `/api/posts/${postId}/comments`, {
        ...data,
        avatarId: userAvatarId,
        avatarColor: avatarColor,
        alias: userAlias,
        deviceFingerprint
      });
    },
    onSuccess: (response: any) => {
      // Handle spam warning if present
      if (response?.spamWarning) {
        toast({
          title: "⚠️ Comment Pattern Alert",
          description: response.spamWarning,
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setComment("");
      setReplyText("");
      setReplyingTo(null);
      toast({
        title: replyingTo ? "Reply posted!" : "Comment posted!",
        description: replyingTo ? "Your reply has been added." : "Your anonymous comment has been added.",
      });
    },
    onError: (error: any) => {
      // Handle spam-related errors with specific messaging
      if (error.isBlocked) {
        toast({
          title: "⛔ Account Restricted",
          description: error.message || "Your account has been temporarily restricted due to multiple violations.",
          variant: "destructive",
        });
      } else if (error.isThrottled) {
        toast({
          title: "⏱️ Comment Cooldown",
          description: error.message || "Please wait before commenting again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to post comment",
          variant: "destructive",
        });
      }
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
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to react to comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const content = replyingTo ? replyText.trim() : comment.trim();
    if (!content) return;

    // Check if user is banned
    if (!canPerformAction('comment')) {
      toast({
        title: "Access Denied",
        description: banInfo?.banReason || "Your device is banned from commenting",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 300) {
      toast({
        title: "Comment too long",
        description: "Comments must be 300 characters or less.",
        variant: "destructive",
      });
      return;
    }

    createCommentMutation.mutate({
      postId,
      parentCommentId: replyingTo || undefined,
      content,
    });
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyText("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
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
      <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col bg-gray-50 dark:bg-gray-800">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Comments ({commentCount})</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 mt-4 min-h-0">
          {/* Comments List */}
          <ScrollArea className="flex-1 pr-2 -mr-2">
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
                  <div key={comment.id} className="space-y-2">
                    {/* Main Comment */}
                    <div className={cn(
                      "rounded-lg p-3 space-y-2",
                      isDrama 
                        ? "bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200"
                        : "bg-gray-50 border border-gray-200"
                    )}>
                      <div className="flex items-start space-x-3">
                        <AvatarDisplay
                          avatarId={comment.sessionId === sessionId ? userAvatarId : (comment.avatarId || 'mask-anonymous')}
                          size="sm"
                          showBorder={false}
                          gradientColors={comment.sessionId === sessionId ? avatarColor : undefined}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              {comment.sessionId === sessionId ? userAlias : (comment.alias || "Anonymous")}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-gray-800 mt-1">{comment.content}</p>
                        </div>
                      </div>
                      
                      {/* Comment Actions */}
                      <div className="flex flex-col space-y-2 ml-11 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        {/* Reactions */}
                        <div className="flex items-center space-x-2 flex-wrap">
                          {Object.entries(reactionEmojis).map(([type, emoji]) => {
                            const count = comment.reactions?.[type as keyof typeof comment.reactions] || 0;
                            
                            return (
                              <Button
                                key={type}
                                variant="ghost"
                                className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors p-1 h-auto min-w-0"
                                onClick={() => handleReaction(type, comment.id)}
                                disabled={reactionMutation.isPending}
                              >
                                <span className="text-sm">{emoji}</span>
                                <span className="text-xs font-medium">{count}</span>
                              </Button>
                            );
                          })}
                        </div>
                        
                        {/* Reply Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700 p-1 h-auto flex-shrink-0 self-start sm:self-center"
                          onClick={() => handleReply(comment.id)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          <span className="text-xs">Reply</span>
                        </Button>
                      </div>

                      {/* Reply Input (if replying to this comment) */}
                      {replyingTo === comment.id && (
                        <div className="ml-4 sm:ml-11 mt-3 space-y-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          {/* Reply Context Header */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                            <Reply className="h-3 w-3" />
                            <span>Replying to</span>
                            <div className="flex items-center space-x-2">
                              <AvatarDisplay
                                avatarId={comment.sessionId === sessionId ? userAvatarId : (comment.avatarId || 'mask-anonymous')}
                                size="xs"
                                showBorder={false}
                                gradientColors={comment.sessionId === sessionId ? avatarColor : undefined}
                              />
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {comment.sessionId === sessionId ? userAlias : (comment.alias || "Anonymous")}
                              </span>
                            </div>
                          </div>
                          
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.sessionId === sessionId ? userAlias : (comment.alias || "Anonymous")}...`}
                            className="resize-none text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 w-full min-h-[2.5rem] max-h-20"
                            maxLength={300}
                            rows={2}
                            style={{ 
                              fontSize: '16px', // Prevents zoom on iOS
                              zIndex: 10,
                              position: 'relative'
                            }}
                          />
                          <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                            <span className="text-xs text-gray-500 order-2 sm:order-1">
                              {replyText.length}/300
                            </span>
                            <div className="flex space-x-2 order-1 sm:order-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelReply}
                                className="text-xs flex-1 sm:flex-none"
                              >
                                Cancel Reply
                              </Button>
                              <Button
                                onClick={handleSubmit}
                                disabled={createCommentMutation.isPending || !replyText.trim()}
                                className={cn(
                                  "text-white text-xs flex-1 sm:flex-none",
                                  isDrama ? "gradient-drama" : "gradient-primary"
                                )}
                                size="sm"
                              >
                                {createCommentMutation.isPending ? "Posting..." : "Reply"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Replies */}
                    {(comment as any).replies && (comment as any).replies.length > 0 && (
                      <div className="ml-4 sm:ml-8 space-y-2">
                        {(comment as any).replies.map((reply: any) => (
                          <div key={reply.id} className={cn(
                            "rounded-lg p-3 space-y-2 bg-gray-50 border border-gray-200",
                            isDrama && "bg-orange-50/50 border-orange-200"
                          )}>
                            <div className="flex items-start space-x-3">
                              <AvatarDisplay
                                avatarId={reply.sessionId === sessionId ? userAvatarId : (reply.avatarId || 'mask-anonymous')}
                                size="xs"
                                showBorder={false}
                                gradientColors={reply.sessionId === sessionId ? avatarColor : undefined}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {reply.sessionId === sessionId ? userAlias : (reply.alias || "Anonymous")}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(reply.createdAt!), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-gray-800 mt-1 text-sm">{reply.content}</p>
                              </div>
                            </div>
                            
                            {/* Reply Reactions */}
                            <div className="flex items-center space-x-2 ml-9 flex-wrap">
                              {Object.entries(reactionEmojis).map(([type, emoji]) => {
                                const count = reply.reactions?.[type as keyof typeof reply.reactions] || 0;
                                
                                return (
                                  <Button
                                    key={type}
                                    variant="ghost"
                                    className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors p-1 h-auto"
                                    onClick={() => handleReaction(type, reply.id)}
                                    disabled={reactionMutation.isPending}
                                  >
                                    <span className="text-xs">{emoji}</span>
                                    <span className="text-xs font-medium">{count}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          <div className="flex-shrink-0 pt-4 pb-safe-area-inset-bottom bg-gray-50 dark:bg-gray-800">
            {!replyingTo && (
              <div className="mx-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-600">
                <div className="flex space-x-3">
                  <AvatarDisplay
                    avatarId={userAvatarId}
                    size="sm"
                    showBorder={false}
                    gradientColors={avatarColor}
                    isCurrentUser={true}
                  />
                  <div className="flex-1 space-y-3">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="resize-none w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl min-h-[2.5rem] max-h-24 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-200 placeholder:text-gray-400"
                      maxLength={300}
                      rows={2}
                      style={{ 
                        fontSize: '16px', // Prevents zoom on iOS
                        zIndex: 10,
                        position: 'relative'
                      }}
                    />
                    <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                      <span className="text-xs text-gray-400 order-2 sm:order-1">
                        {comment.length}/300
                      </span>
                      <Button
                        onClick={handleSubmit}
                        disabled={createCommentMutation.isPending || !comment.trim()}
                        className={cn(
                          "text-white w-full sm:w-auto order-1 sm:order-2 rounded-xl transition-all duration-200",
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
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}