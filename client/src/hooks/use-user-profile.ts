import { useState, useEffect, useCallback } from 'react';
import { useUserAvatar } from './use-user-avatar';
import { useUserAlias } from './use-user-alias';
import { useAvatarColor } from './use-avatar-color';
import { useAnonymousAuth } from '@/lib/anonymousAuth';

export interface UserProfile {
  avatarId: string;
  alias: string;
  avatarColor: string;
  sessionId?: string;
  isUpgraded: boolean;
}

// Global cache to prevent re-initialization across components
let globalUserProfile: UserProfile | null = null;
let globalProfileListeners: ((profile: UserProfile | null) => void)[] = [];

const PROFILE_CACHE_KEY = 'tfess_user_profile_cache';

function notifyProfileListeners() {
  globalProfileListeners.forEach(listener => listener(globalUserProfile));
}

function saveProfileToCache(profile: UserProfile) {
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
}

function loadProfileFromCache(): UserProfile | null {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to load profile from cache:', error);
  }
  return null;
}

/**
 * Consolidated hook for managing user profile data with global caching
 * to prevent avatar/username flashing across components and page transitions
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(globalUserProfile);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { userAvatarId } = useUserAvatar();
  const { userAlias } = useUserAlias();
  const { avatarColor } = useAvatarColor();
  const { user } = useAnonymousAuth();

  // Subscribe to global profile changes
  useEffect(() => {
    const listener = (newProfile: UserProfile | null) => {
      setProfile(newProfile);
    };
    
    globalProfileListeners.push(listener);
    
    return () => {
      globalProfileListeners = globalProfileListeners.filter(l => l !== listener);
    };
  }, []);

  // Initialize profile from cache or create new one - ALWAYS return cached data immediately
  useEffect(() => {
    // If global profile exists, use it immediately
    if (globalUserProfile) {
      setProfile(globalUserProfile);
      setIsInitialized(true);
      return;
    }

    // Always try to load from cache first for instant display
    const cachedProfile = loadProfileFromCache();
    if (cachedProfile) {
      globalUserProfile = cachedProfile;
      setProfile(cachedProfile);
      setIsInitialized(true);
      notifyProfileListeners();
    } else {
      // If no cache, try to create from localStorage immediately
      const avatarId = localStorage.getItem('userAvatarId') || 'mask-anonymous';
      const storedAlias = localStorage.getItem('userUsername'); // Use the correct key
      const alias = storedAlias ? JSON.parse(storedAlias).alias : 'Anonymous';
      const avatarColor = localStorage.getItem('userAvatarColor') || 'gradient-purple-blue';
      
      if (avatarId && alias && avatarColor) {
        const immediateProfile: UserProfile = {
          avatarId,
          alias,
          avatarColor,
          sessionId: undefined,
          isUpgraded: false
        };
        globalUserProfile = immediateProfile;
        setProfile(immediateProfile);
        saveProfileToCache(immediateProfile);
        setIsInitialized(true);
        notifyProfileListeners();
      }
    }
  }, []);

  // Update profile when user data changes
  useEffect(() => {
    if (!userAvatarId || !userAlias || !avatarColor) {
      return; // Wait for all data to be available
    }

    const newProfile: UserProfile = {
      avatarId: userAvatarId,
      alias: userAlias,
      avatarColor: avatarColor,
      sessionId: user?.sessionId,
      isUpgraded: user?.isUpgraded || false
    };

    // Only update if there are actual changes to prevent unnecessary re-renders
    const hasChanges = !globalUserProfile || 
      globalUserProfile.avatarId !== newProfile.avatarId ||
      globalUserProfile.alias !== newProfile.alias ||
      globalUserProfile.avatarColor !== newProfile.avatarColor ||
      globalUserProfile.sessionId !== newProfile.sessionId ||
      globalUserProfile.isUpgraded !== newProfile.isUpgraded;

    if (hasChanges) {
      globalUserProfile = newProfile;
      saveProfileToCache(newProfile);
      setProfile(newProfile);
      setIsInitialized(true);
      notifyProfileListeners();
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [userAvatarId, userAlias, avatarColor, user, isInitialized]);

  // Method to get cached profile data immediately (for preventing flash)
  const getCachedProfile = useCallback((): UserProfile | null => {
    if (globalUserProfile) return globalUserProfile;
    
    const cachedProfile = loadProfileFromCache();
    if (cachedProfile) return cachedProfile;
    
    // Last resort: build from localStorage
    const avatarId = localStorage.getItem('userAvatarId');
    const storedAlias = localStorage.getItem('userUsername'); // Use the correct key
    const alias = storedAlias ? JSON.parse(storedAlias).alias : null;
    const avatarColor = localStorage.getItem('userAvatarColor');
    
    if (avatarId && alias && avatarColor) {
      return {
        avatarId,
        alias,
        avatarColor,
        sessionId: undefined,
        isUpgraded: false
      };
    }
    
    return null;
  }, []);

  // Method to check if profile data is available
  const hasProfileData = useCallback((): boolean => {
    const current = globalUserProfile || profile;
    return !!(current?.avatarId && current?.alias && current?.avatarColor);
  }, [profile]);

  // Method to update profile data
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!globalUserProfile) return;
    
    const updatedProfile = { ...globalUserProfile, ...updates };
    globalUserProfile = updatedProfile;
    saveProfileToCache(updatedProfile);
    setProfile(updatedProfile);
    notifyProfileListeners();
    
    // Update individual hooks if needed
    if (updates.avatarId) {
      localStorage.setItem('userAvatarId', updates.avatarId);
      window.dispatchEvent(new CustomEvent('avatarChanged', { 
        detail: { avatarId: updates.avatarId } 
      }));
    }
    
    if (updates.alias) {
      const aliasData = { alias: updates.alias, emoji: '', category: '' };
      localStorage.setItem('userUsername', JSON.stringify(aliasData)); // Use the correct key
      window.dispatchEvent(new CustomEvent('userUsernameChanged', { 
        detail: aliasData
      }));
    }
    
    if (updates.avatarColor) {
      localStorage.setItem('userAvatarColor', updates.avatarColor);
      window.dispatchEvent(new CustomEvent('avatarColorChanged', { 
        detail: { avatarColor: updates.avatarColor } 
      }));
    }
  }, []);

  return {
    profile,
    isInitialized,
    getCachedProfile,
    hasProfileData,
    updateProfile
  };
}

/**
 * Hook for getting user profile data for other users
 * Uses the same caching mechanism to prevent unnecessary re-renders
 */
export function useOtherUserProfile(sessionId: string, avatarId?: string, alias?: string) {
  const [cachedProfile, setCachedProfile] = useState<Partial<UserProfile> | null>(null);
  const { profile: currentUserProfile } = useUserProfile();

  useEffect(() => {
    // If this is the current user, use their profile
    if (currentUserProfile?.sessionId === sessionId) {
      setCachedProfile(currentUserProfile);
      return;
    }

    // Otherwise, cache the provided data
    if (avatarId || alias) {
      setCachedProfile({
        avatarId: avatarId || 'mask-anonymous',
        alias: alias || 'Anonymous',
        avatarColor: undefined, // Other users don't have custom colors
        sessionId,
        isUpgraded: false
      });
    }
  }, [sessionId, avatarId, alias, currentUserProfile]);

  return cachedProfile;
}

/**
 * Utility function to preload user profile data to prevent flashing
 * Call this early in app initialization
 */
export function preloadUserProfile() {
  if (!globalUserProfile) {
    const cached = loadProfileFromCache();
    if (cached) {
      globalUserProfile = cached;
    }
  }
  return globalUserProfile;
}