import { useState, useEffect } from "react";

export function useUserAvatar() {
  const [userAvatarId, setUserAvatarId] = useState<string>('happy-face');

  useEffect(() => {
    // Load initial avatar from localStorage
    const savedAvatarId = localStorage.getItem('userAvatarId');
    if (savedAvatarId) {
      setUserAvatarId(savedAvatarId);
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