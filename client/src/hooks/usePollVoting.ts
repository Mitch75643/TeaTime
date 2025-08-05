import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';

interface PollResults {
  postId: string;
  pollOptions: { optionA: string; optionB: string };
  pollVotes: { optionA: number; optionB: number };
  totalVotes: number;
}

interface DebateResults {
  postId: string;
  debateVotes: { up: number; down: number };
  totalVotes: number;
}

export function usePollVoting(postId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();

  // Subscribe to real-time poll updates
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'poll_vote' && message.postId === postId) {
        // Invalidate poll results to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['/api/polls', postId, 'results'] });
        queryClient.invalidateQueries({ queryKey: ['/api/polls', postId, 'has-voted'] });
      }
    });

    return unsubscribe;
  }, [postId, subscribeToMessages, queryClient]);

  // Get poll results
  const { data: pollResults, isLoading: resultsLoading } = useQuery<PollResults>({
    queryKey: ['/api/polls', postId, 'results'],
    enabled: !!postId,
  });

  // Check if user has voted
  const { data: hasVoted, isLoading: hasVotedLoading } = useQuery<{ hasVoted: boolean }>({
    queryKey: ['/api/polls', postId, 'has-voted'],
    enabled: !!postId,
  });

  // Vote in poll
  const voteMutation = useMutation({
    mutationFn: async (option: 'optionA' | 'optionB') => {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, option }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to vote');
      }
      return response.json();
    },
    onSuccess: () => {
      // Optimistically update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/polls', postId, 'results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/polls', postId, 'has-voted'] });
      toast({
        title: "Vote submitted",
        description: "Your poll vote has been recorded!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    },
  });

  return {
    pollResults,
    hasVoted: hasVoted?.hasVoted || false,
    isLoading: resultsLoading || hasVotedLoading,
    vote: voteMutation.mutate,
    isVoting: voteMutation.isPending,
  };
}

export function useDebateVoting(postId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();

  // Subscribe to real-time debate updates
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'debate_vote' && message.postId === postId) {
        // Invalidate debate results to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['/api/debates', postId, 'results'] });
        queryClient.invalidateQueries({ queryKey: ['/api/debates', postId, 'has-voted'] });
      }
    });

    return unsubscribe;
  }, [postId, subscribeToMessages, queryClient]);

  // Get debate results
  const { data: debateResults, isLoading: resultsLoading } = useQuery<DebateResults>({
    queryKey: ['/api/debates', postId, 'results'],
    enabled: !!postId,
  });

  // Check if user has voted
  const { data: hasVoted, isLoading: hasVotedLoading } = useQuery<{ hasVoted: boolean }>({
    queryKey: ['/api/debates', postId, 'has-voted'],
    enabled: !!postId,
  });

  // Vote in debate
  const voteMutation = useMutation({
    mutationFn: async (vote: 'up' | 'down') => {
      const response = await fetch('/api/debates/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, vote }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to vote');
      }
      return response.json();
    },
    onSuccess: () => {
      // Optimistically update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/debates', postId, 'results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/debates', postId, 'has-voted'] });
      toast({
        title: "Vote submitted",
        description: "Your debate vote has been recorded!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    },
  });

  return {
    debateResults,
    hasVoted: hasVoted?.hasVoted || false,
    isLoading: resultsLoading || hasVotedLoading,
    vote: voteMutation.mutate,
    isVoting: voteMutation.isPending,
  };
}