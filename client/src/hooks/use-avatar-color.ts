import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAnonymousAuth } from '@/lib/anonymousAuth';

const AVATAR_COLOR_KEY = 'tfess_avatar_color';

export const avatarColorOptions = [
  { name: 'Purple Pink', value: 'from-purple-500 to-pink-500' },
  { name: 'Ocean Blue', value: 'from-blue-500 to-cyan-400' },
  { name: 'Forest Green', value: 'from-green-600 to-lime-400' },
  { name: 'Sunset Orange', value: 'from-yellow-400 to-red-500' },
  { name: 'Rose Gold', value: 'from-pink-400 to-yellow-300' },
  
  { name: 'Deep Purple', value: 'from-indigo-600 to-purple-600' },
  { name: 'Pure White', value: 'from-white to-gray-100' },
  { name: 'Fire Red', value: 'from-orange-500 to-red-600' },
  { name: 'Dark Red', value: 'from-red-800 to-red-900' },
  { name: 'Neon Green', value: 'from-lime-400 to-green-500' },
  
  { name: 'Cotton Candy', value: 'from-pink-300 to-purple-400' },
  { name: 'Golden Hour', value: 'from-amber-400 to-orange-400' },
  { name: 'Midnight Blue', value: 'from-slate-600 to-blue-800' },
  { name: 'Spring Fresh', value: 'from-emerald-400 to-cyan-300' },
  { name: 'Pure Black', value: 'from-gray-900 to-black' },
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