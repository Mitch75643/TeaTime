import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

interface UsernameCheckResponse {
  isUnique: boolean;
}

interface UsernameGenerateResponse {
  username: string;
}

interface UsernameRegenerateResponse {
  username: string;
  success: boolean;
}

export function useUsernameValidation() {
  const [pendingUsername, setPendingUsername] = useState<string>('');

  // Check if a username is unique
  const { data: uniquenessCheck, isLoading: isCheckingUniqueness } = useQuery<UsernameCheckResponse>({
    queryKey: ['/api/username/check', pendingUsername],
    enabled: !!pendingUsername && pendingUsername.length >= 3,
    retry: false,
  });

  // Generate a unique username based on a base alias
  const generateUsernameMutation = useMutation({
    mutationFn: async (baseAlias?: string) => {
      const response = await fetch('/api/username/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseAlias }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate username');
      }
      return response.json() as Promise<UsernameGenerateResponse>;
    },
  });

  // Regenerate username completely (for current user)
  const regenerateUsernameMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/username/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate username');
      }
      return response.json() as Promise<UsernameRegenerateResponse>;
    },
  });

  const checkUsernameUniqueness = useCallback((username: string) => {
    if (username.length >= 3) {
      setPendingUsername(username);
    } else {
      setPendingUsername('');
    }
  }, []);

  const generateUniqueUsername = useCallback((baseAlias?: string) => {
    return generateUsernameMutation.mutateAsync(baseAlias);
  }, [generateUsernameMutation]);

  const regenerateUsername = useCallback(() => {
    return regenerateUsernameMutation.mutateAsync();
  }, [regenerateUsernameMutation]);

  return {
    // Uniqueness checking
    checkUsernameUniqueness,
    isUnique: uniquenessCheck?.isUnique,
    isCheckingUniqueness,
    
    // Username generation
    generateUniqueUsername,
    isGenerating: generateUsernameMutation.isPending,
    generationError: generateUsernameMutation.error,
    
    // Username regeneration
    regenerateUsername,
    isRegenerating: regenerateUsernameMutation.isPending,
    regenerationError: regenerateUsernameMutation.error,
    
    // Clear pending check
    clearPendingCheck: () => setPendingUsername(''),
  };
}