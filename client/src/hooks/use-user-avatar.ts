import { useState, useEffect } from "react";
import { DEFAULT_AVATAR, getRandomAvatarId } from "@/components/ui/avatar-selector";

export function useUserAvatar() {
  const [userAvatarId, setUserAvatarId] = useState<string>(DEFAULT_AVATAR);

  useEffect(() => {
    // Load initial avatar from localStorage
    const savedAvatarId = localStorage.getItem('userAvatarId');
    if (savedAvatarId) {
      setUserAvatarId(savedAvatarId);
    } else {
      // Assign random avatar to new users for better onboarding
      const randomAvatar = getRandomAvatarId();
      setUserAvatarId(randomAvatar);
      localStorage.setItem('userAvatarId', randomAvatar);
    }

    // Listen for avatar changes across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userAvatarId' && e.newValue) {
        setUserAvatarId(e.newValue);
      }
    };

    // Listen for custom avatar change events (for same-tab updates)
    const handleAvatarChange = (e: CustomEvent) => {
      setUserAvatarId(e.detail.avatarId);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('avatarChanged', handleAvatarChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarChanged', handleAvatarChange as EventListener);
    };
  }, []);

  const updateAvatar = (avatarId: string) => {
    localStorage.setItem('userAvatarId', avatarId);
    setUserAvatarId(avatarId);
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('avatarChanged', { 
      detail: { avatarId } 
    }));
  };

  return { userAvatarId, updateAvatar };
}