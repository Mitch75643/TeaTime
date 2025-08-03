import { useState, useEffect } from 'react';
import { getUserUsername, refreshUserUsername, setUserUsername, type UserAlias } from '@/lib/alias-generator';

export function useUserAlias() {
  const [userUsername, setUserUsernameState] = useState<UserAlias>(() => getUserUsername());

  useEffect(() => {
    const handleUsernameChange = (event: CustomEvent<UserAlias>) => {
      setUserUsernameState(event.detail);
    };

    // Listen for username changes from other components
    window.addEventListener('userUsernameChanged', handleUsernameChange as EventListener);

    return () => {
      window.removeEventListener('userUsernameChanged', handleUsernameChange as EventListener);
    };
  }, []);

  const generateNewUsername = () => {
    const newUsername = refreshUserUsername();
    setUserUsernameState(newUsername);
    return newUsername;
  };

  const keepCurrentUsername = (username: UserAlias) => {
    setUserUsername(username);
    setUserUsernameState(username);
  };

  return {
    userAlias: userUsername.alias, // Keep this name for backwards compatibility
    fullAlias: userUsername,
    generateNewAlias: generateNewUsername, // Keep this name for backwards compatibility
    generateNewUsername,
    keepCurrentUsername
  };
}