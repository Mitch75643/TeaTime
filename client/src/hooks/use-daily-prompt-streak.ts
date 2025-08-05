import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface DailyPromptStreak {
  id: string;
  sessionId: string;
  currentStreak: number;
  longestStreak: number;
  lastSubmissionDate: string | null;
  lastPromptId?: string;
  submissionDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakSubmissionResult {
  streak: DailyPromptStreak;
  streakBroken: boolean;
  message: string;
}

export function useDailyPromptStreak() {
  const queryClient = useQueryClient();
  
  // Fetch current streak
  const { data: streak, isLoading, error } = useQuery<DailyPromptStreak>({
    queryKey: ['/api/streaks/daily-prompt'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Submit daily prompt and update streak
  const submitPromptMutation = useMutation({
    mutationFn: async ({ promptId, promptContent, postId }: { 
      promptId: string; 
      promptContent: string; 
      postId?: string; 
    }) => {
      const response = await fetch('/api/streaks/daily-prompt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, promptContent, postId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit daily prompt');
      }
      
      return response.json();
    },
    onSuccess: (data: StreakSubmissionResult) => {
      // Update the streak query cache
      queryClient.setQueryData(['/api/streaks/daily-prompt'], data.streak);
      
      // Show streak message if needed
      return data;
    },
  });

  // Get streak submissions history
  const { data: submissions } = useQuery({
    queryKey: ['/api/streaks/daily-prompt/submissions'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper functions
  const hasSubmittedToday = () => {
    if (!streak) return false;
    const today = new Date().toISOString().split('T')[0];
    return streak.lastSubmissionDate === today;
  };

  const getStreakStatus = () => {
    if (!streak || streak.currentStreak === 0) {
      return { status: 'new', message: 'Start your daily streak!' };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (streak.lastSubmissionDate === today) {
      return { 
        status: 'completed', 
        message: `🔥 ${streak.currentStreak} day streak! You're on fire!` 
      };
    } else if (streak.lastSubmissionDate === yesterdayStr) {
      return { 
        status: 'pending', 
        message: `Keep it going! Submit today to reach ${streak.currentStreak + 1} days.` 
      };
    } else {
      return { 
        status: 'broken', 
        message: 'Your streak was reset. Start fresh today!' 
      };
    }
  };

  const getStreakIcon = (streakCount: number) => {
    if (streakCount === 0) return '🌱';
    if (streakCount < 3) return '🔥';
    if (streakCount < 7) return '💪';
    if (streakCount < 14) return '👑';
    return '🏆';
  };

  const getStreakMessage = (streakCount: number) => {
    if (streakCount === 0) return 'Start your streak!';
    if (streakCount === 1) return '1 day streak';
    if (streakCount < 7) return `${streakCount} day streak`;
    if (streakCount < 30) return `${streakCount} day streak! Amazing!`;
    return `${streakCount} day streak! Legendary!`;
  };

  // Submit prompt function with automatic streak tracking
  const submitDailyPrompt = async (promptId: string, promptContent: string, postId?: string) => {
    try {
      const result = await submitPromptMutation.mutateAsync({ promptId, promptContent, postId });
      return result;
    } catch (error) {
      console.error('Failed to submit daily prompt:', error);
      throw error;
    }
  };

  return {
    streak,
    submissions,
    isLoading,
    error,
    hasSubmittedToday: hasSubmittedToday(),
    streakStatus: getStreakStatus(),
    getStreakIcon,
    getStreakMessage,
    submitDailyPrompt,
    isSubmitting: submitPromptMutation.isPending,
    submitError: submitPromptMutation.error,
  };
}