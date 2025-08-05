import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { Progress } from "./progress";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { TestTube } from "lucide-react";

interface PollVotingProps {
  postId: string;
}

interface PollResults {
  postId: string;
  pollOptions: {
    optionA: string;
    optionB: string;
  };
  pollVotes: {
    optionA: number;
    optionB: number;
  };
  totalVotes: number;
}

interface UserVoteStatus {
  hasVoted: boolean;
  vote: 'optionA' | 'optionB' | null;
}

export function PollVoting({ postId }: PollVotingProps) {
  const [userVote, setUserVote] = useState<'optionA' | 'optionB' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState({ optionA: 0, optionB: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();

  console.log('PollVoting render:', { postId, userVote, hasVoted, localVotes });

  // Get poll results
  const { data: pollResults } = useQuery<PollResults>({
    queryKey: ['/api/polls', postId, 'results'],
    enabled: !!postId,
  });

  // Check if user has voted
  const { data: userVoteStatus } = useQuery<UserVoteStatus>({
    queryKey: ['/api/polls', postId, 'has-voted'],
    enabled: !!postId,
  });

  // Update local state when data changes
  useEffect(() => {
    if (pollResults) {
      setLocalVotes(pollResults.pollVotes);
    }
  }, [pollResults]);

  useEffect(() => {
    if (userVoteStatus) {
      setHasVoted(userVoteStatus.hasVoted);
      setUserVote(userVoteStatus.vote || null);
    }
  }, [userVoteStatus]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'poll_vote' && message.postId === postId) {
        console.log('Real-time poll vote update received:', message);
        // Invalidate queries to refetch latest data
        queryClient.invalidateQueries({ queryKey: ['/api/polls', postId, 'results'] });
        queryClient.invalidateQueries({ queryKey: ['/api/polls', postId, 'has-voted'] });
      }
    });

    return unsubscribe;
  }, [postId, subscribeToMessages, queryClient]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (option: 'optionA' | 'optionB') => {
      console.log('Submitting poll vote:', { postId, option });
      const response = await apiRequest('POST', '/api/polls/vote', { postId, option });
      console.log('Vote submission response:', response);
      return response;
    },
    onMutate: async (option) => {
      console.log('Optimistic update for vote:', option);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/polls', postId] });
      
      // Optimistic update
      setHasVoted(true);
      setUserVote(option);
      setLocalVotes(prev => ({
        ...prev,
        [option]: prev[option] + 1
      }));
    },
    onSuccess: (data) => {
      console.log('Vote submitted successfully:', data);
      // Invalidate queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/polls', postId] });
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
      if (pollResults) {
        setLocalVotes(pollResults.pollVotes);
      }
      
      toast({
        title: "Failed to submit vote",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleVote = (option: 'optionA' | 'optionB') => {
    if (hasVoted || voteMutation.isPending) return;
    voteMutation.mutate(option);
  };

  if (!pollResults) {
    return null;
  }

  const totalVotes = localVotes.optionA + localVotes.optionB;
  const optionAPercentage = totalVotes > 0 ? Math.round((localVotes.optionA / totalVotes) * 100) : 0;
  const optionBPercentage = totalVotes > 0 ? Math.round((localVotes.optionB / totalVotes) * 100) : 0;

  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={() => handleVote('optionA')}
          disabled={hasVoted || voteMutation.isPending}
          className={cn(
            "h-auto p-4 text-left justify-start",
            userVote === 'optionA' 
              ? "bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-600" 
              : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700",
            hasVoted && "cursor-default"
          )}
          variant="outline"
        >
          <div className="flex flex-col items-center w-full">
            <span className="text-lg">A</span>
            <span className="text-sm font-medium text-center">{pollResults.pollOptions.optionA}</span>
            {(hasVoted || totalVotes > 0) && (
              <span className="text-xs opacity-80 mt-1">{optionAPercentage}%</span>
            )}
          </div>
        </Button>

        <Button
          onClick={() => handleVote('optionB')}
          disabled={hasVoted || voteMutation.isPending}
          className={cn(
            "h-auto p-4 text-left justify-start",
            userVote === 'optionB' 
              ? "bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-600" 
              : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700",
            hasVoted && "cursor-default"
          )}
          variant="outline"
        >
          <div className="flex flex-col items-center w-full">
            <span className="text-lg">B</span>
            <span className="text-sm font-medium text-center">{pollResults.pollOptions.optionB}</span>
            {(hasVoted || totalVotes > 0) && (
              <span className="text-xs opacity-80 mt-1">{optionBPercentage}%</span>
            )}
          </div>
        </Button>
      </div>

      {(hasVoted || totalVotes > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Poll Results</span>
            <span>{totalVotes.toLocaleString()} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">A: {pollResults.pollOptions.optionA}</span>
              <span className="font-medium">{optionAPercentage}%</span>
            </div>
            <Progress value={optionAPercentage} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">B: {pollResults.pollOptions.optionB}</span>
              <span className="font-medium">{optionBPercentage}%</span>
            </div>
            <Progress value={optionBPercentage} className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
}