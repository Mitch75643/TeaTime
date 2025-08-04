import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAnonymousAuth } from '@/lib/anonymousAuth';

const AVATAR_COLOR_KEY = 'tfess_avatar_color';

export const avatarColorOptions = [
  { name: 'Purple Pink', value: 'from-purple-400 to-pink-400' },
  { name: 'Blue Cyan', value: 'from-blue-400 to-cyan-400' },
  { name: 'Green Emerald', value: 'from-green-400 to-emerald-400' },
  { name: 'Yellow Orange', value: 'from-yellow-400 to-orange-400' },
  { name: 'Red Pink', value: 'from-red-400 to-pink-400' },
  { name: 'Indigo Purple', value: 'from-indigo-400 to-purple-400' },
  { name: 'Teal Green', value: 'from-teal-400 to-green-400' },
  { name: 'Orange Red', value: 'from-orange-400 to-red-400' },
  { name: 'Cyan Blue', value: 'from-cyan-400 to-blue-400' },
  { name: 'Emerald Teal', value: 'from-emerald-400 to-teal-400' },
  { name: 'Pink Rose', value: 'from-pink-400 to-rose-400' },
  { name: 'Amber Yellow', value: 'from-amber-400 to-yellow-400' },
  { name: 'Violet Blue', value: 'from-violet-400 to-blue-400' },
  { name: 'Lime Green', value: 'from-lime-400 to-green-400' },
  { name: 'Sky Blue', value: 'from-sky-400 to-blue-400' },
];

export function useAvatarColor() {
  const [avatarColor, setAvatarColorState] = useState<string>('');
  const { user, ensureUserExists } = useAnonymousAuth();

  useEffect(() => {
    const stored = localStorage.getItem(AVATAR_COLOR_KEY);
    if (stored) {
      setAvatarColorState(stored);
    } else {
      // Set default color if none exists
      const defaultColor = avatarColorOptions[0].value;
      setAvatarColorState(defaultColor);
      localStorage.setItem(AVATAR_COLOR_KEY, defaultColor);
    }

    // Listen for avatar color changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AVATAR_COLOR_KEY && e.newValue) {
        setAvatarColorState(e.newValue);
      }
    };

    // Listen for custom avatar color change events (for same-tab updates)
    const handleAvatarColorChange = (e: CustomEvent) => {
      setAvatarColorState(e.detail.avatarColor);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('avatarColorChanged', handleAvatarColorChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarColorChanged', handleAvatarColorChange as EventListener);
    };
  }, []);

  const updateAvatarColor = async (color: string) => {
    // Update locally first for instant feedback
    setAvatarColorState(color);
    localStorage.setItem(AVATAR_COLOR_KEY, color);
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('avatarColorChanged', { 
      detail: { avatarColor: color } 
    }));
    
    // Ensure user exists before syncing
    try {
      await ensureUserExists();
      
      // Sync with server for global visibility
      await apiRequest('POST', '/api/user/avatar-color', { avatarColor: color });
    } catch (error) {
      console.error('Failed to sync avatar color with server:', error);
      // Don't revert local change since user experience should be preserved
      // User will see their color locally, and it will sync when user is created
    }
  };

  return {
    avatarColor,
    updateAvatarColor,
  };
}