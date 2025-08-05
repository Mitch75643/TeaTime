import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface DailyDebatePostCardProps {
  post: Post;
}

export function DailyDebatePostCard({ post }: DailyDebatePostCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [debateVotes, setDebateVotes] = useState<{up: number, down: number}>(
    (post.debateVotes as {up: number, down: number}) || { up: 0, down: 0 }
  );
  const [showResults, setShowResults] = useState(false);

  // Check if user has already voted (stored in localStorage)
  useEffect(() => {
    const storedVote = localStorage.getItem(`debate_vote_${post.id}`);
    if (storedVote && (storedVote === 'up' || storedVote === 'down')) {
      setUserVote(storedVote);
      setShowResults(true);
    }
  }, [post.id]);

  // Listen for real-time debate vote updates
  useWebSocket((message: any) => {
    if (message?.type === 'debate_vote' && message?.postId === post.id) {
      const { vote } = message.data;
      setDebateVotes(prev => ({
        ...prev,
        [vote]: (prev as any)[vote] + 1
      }));
    }
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: 'up' | 'down') => {
      return await apiRequest(`/api/debates/vote`, 'POST', {
        postId: post.id,
        vote
      });
    },
    onSuccess: (_, vote) => {
      setUserVote(vote);
      setShowResults(true);
      localStorage.setItem(`debate_vote_${post.id}`, vote);
      
      // Update local vote counts optimistically
      setDebateVotes(prev => ({
        ...prev,
        [vote]: (prev as any)[vote] + 1
      }));

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      toast({
        title: "Vote recorded!",
        description: `You voted ${vote === 'up' ? 'Yes' : 'No'} on this debate.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (vote: 'up' | 'down') => {
    if (userVote) {
      toast({
        title: "Already voted",
        description: "You can only vote once per debate.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate(vote);
  };

  // Calculate percentages
  const totalVotes = debateVotes.up + debateVotes.down;
  const yesPercentage = totalVotes > 0 ? Math.round((debateVotes.up / totalVotes) * 100) : 0;
  const noPercentage = totalVotes > 0 ? Math.round((debateVotes.down / totalVotes) * 100) : 0;

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10 bg-gradient-to-br from-green-400 to-teal-500">
          <div className="text-white text-lg">⚔️</div>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {post.alias}
            </span>
            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              Daily Debate
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Today'}
          </p>
        </div>
        {post.viewCount && post.viewCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-6">
        <p className="text-gray-900 dark:text-gray-100 leading-relaxed text-lg">
          {post.content}
        </p>
      </div>

      {/* Voting Section */}
      <div className="space-y-4">
        {!showResults ? (
          // Voting Buttons
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleVote('up')}
              disabled={voteMutation.isPending}
              variant="outline"
              className="h-12 text-base font-medium border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-700 dark:hover:bg-green-900/20"
            >
              <ThumbsUp className="h-5 w-5 mr-2 text-green-600" />
              Yes
            </Button>
            <Button
              onClick={() => handleVote('down')}
              disabled={voteMutation.isPending}
              variant="outline"
              className="h-12 text-base font-medium border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-700 dark:hover:bg-red-900/20"
            >
              <ThumbsDown className="h-5 w-5 mr-2 text-red-600" />
              No
            </Button>
          </div>
        ) : (
          // Results Display
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Results ({totalVotes} votes)</span>
              {userVote && (
                <Badge variant="outline" className={cn(
                  "text-xs",
                  userVote === 'up' 
                    ? "border-green-300 text-green-700 dark:border-green-600 dark:text-green-400" 
                    : "border-red-300 text-red-700 dark:border-red-600 dark:text-red-400"
                )}>
                  You voted {userVote === 'up' ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
            
            {/* Yes Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Yes</span>
                </div>
                <span className="text-sm font-bold text-green-600">{yesPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">{debateVotes.up} votes</div>
            </div>

            {/* No Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">No</span>
                </div>
                <span className="text-sm font-bold text-red-600">{noPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${noPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">{debateVotes.down} votes</div>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {post.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}