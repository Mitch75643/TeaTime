import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";

interface DebateVotingProps {
  postId: string;
}

interface DebateResults {
  postId: string;
  debateVotes: {
    up: number;
    down: number;
  };
  totalVotes: number;
}

export function DebateVoting({ postId }: DebateVotingProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState({ up: 0, down: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();

  console.log('DebateVoting render:', { postId, userVote, hasVoted, localVotes });

  // Get debate results
  const { data: debateResults, isLoading } = useQuery<DebateResults>({
    queryKey: ['/api/debates', postId, 'results'],
    queryFn: async () => {
      const response = await fetch(`/api/debates/${postId}/results`);
      if (!response.ok) throw new Error('Failed to fetch debate results');
      return response.json();
    },
  });

  // Check if user has voted
  const { data: userVoteStatus } = useQuery<{ hasVoted: boolean; vote?: 'up' | 'down' }>({
    queryKey: ['/api/debates', postId, 'has-voted'],
    queryFn: async () => {
      const response = await fetch(`/api/debates/${postId}/has-voted`);
      if (!response.ok) throw new Error('Failed to check vote status');
      return response.json();
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (debateResults) {
      setLocalVotes(debateResults.debateVotes);
    }
  }, [debateResults]);

  useEffect(() => {
    if (userVoteStatus) {
      setHasVoted(userVoteStatus.hasVoted);
      setUserVote(userVoteStatus.vote || null);
    }
  }, [userVoteStatus]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'debate_vote' && message.postId === postId) {
        console.log('Real-time debate vote update received:', message);
        // Invalidate queries to refetch latest data
        queryClient.invalidateQueries({ queryKey: ['/api/debates', postId, 'results'] });
        queryClient.invalidateQueries({ queryKey: ['/api/debates', postId, 'has-voted'] });
      }
    });

    return unsubscribe;
  }, [postId, subscribeToMessages, queryClient]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (vote: 'up' | 'down') => {
      console.log('Submitting debate vote:', { postId, vote });
      const response = await apiRequest('POST', '/api/debates/vote', { postId, vote });
      console.log('Vote submission response:', response);
      return response;
    },
    onMutate: async (vote) => {
      console.log('Optimistic update for vote:', vote);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/debates', postId] });
      
      // Optimistic update
      setHasVoted(true);
      setUserVote(vote);
      setLocalVotes(prev => ({
        ...prev,
        [vote]: prev[vote] + 1
      }));
    },
    onSuccess: (data) => {
      console.log('Vote submitted successfully:', data);
      // Invalidate queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/debates', postId] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      toast({
        title: "Vote submitted!",
        description: "Your vote has been recorded",
      });
    },
    onError: (error: any) => {
      console.error('Vote submission failed:', error);
      // Revert optimistic update
      setHasVoted(false);
      setUserVote(null);
      if (debateResults) {
        setLocalVotes(debateResults.debateVotes);
      }
      
      toast({
        title: "Failed to submit vote",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleVote = (vote: 'up' | 'down') => {
    if (hasVoted) {
      toast({
        title: "Already voted",
        description: "You can only vote once per debate",
        variant: "destructive",
      });
      return;
    }
    
    voteMutation.mutate(vote);
  };

  if (isLoading) {
    return (
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-indigo-200 dark:bg-indigo-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
            <div className="h-10 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = localVotes.up + localVotes.down;
  const yesPercentage = totalVotes > 0 ? Math.round((localVotes.up / totalVotes) * 100) : 0;
  const noPercentage = totalVotes > 0 ? Math.round((localVotes.down / totalVotes) * 100) : 0;

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-indigo-700 dark:text-indigo-300">
          What's your take?
        </h4>
        {hasVoted && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">
            ✓ Voted {userVote === 'up' ? 'Yes' : 'No'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => handleVote('up')}
          disabled={hasVoted || voteMutation.isPending}
          className={cn(
            "relative py-3 px-4 rounded-lg border-2 transition-all font-semibold",
            userVote === 'up'
              ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
              : hasVoted
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed"
              : "bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600"
          )}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg">👍</span>
            <span className="text-sm font-medium">Yes</span>
            {(hasVoted || totalVotes > 0) && (
              <span className="text-xs opacity-80">{yesPercentage}%</span>
            )}
          </div>
        </Button>

        <Button
          onClick={() => handleVote('down')}
          disabled={hasVoted || voteMutation.isPending}
          className={cn(
            "relative py-3 px-4 rounded-lg border-2 transition-all font-semibold",
            userVote === 'down'
              ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
              : hasVoted
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed"
              : "bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600"
          )}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg">👎</span>
            <span className="text-sm font-medium">No</span>
            {(hasVoted || totalVotes > 0) && (
              <span className="text-xs opacity-80">{noPercentage}%</span>
            )}
          </div>
        </Button>
      </div>

      {(hasVoted || totalVotes > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Community Results</span>
            <span>{totalVotes.toLocaleString()} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span>👍</span>
                <span>Yes</span>
              </span>
              <span className="font-medium">{localVotes.up} ({yesPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${yesPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span>👎</span>
                <span>No</span>
              </span>
              <span className="font-medium">{localVotes.down} ({noPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${noPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}