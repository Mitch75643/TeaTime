import { useState, useEffect } from 'react';
import { getUserAlias, refreshUserAlias, type UserAlias } from '@/lib/alias-generator';

export function useUserAlias() {
  const [userAlias, setUserAlias] = useState<UserAlias>(() => getUserAlias());

  useEffect(() => {
    const handleAliasChange = (event: CustomEvent<UserAlias>) => {
      setUserAlias(event.detail);
    };

    // Listen for alias changes from other components
    window.addEventListener('userAliasChanged', handleAliasChange as EventListener);

    return () => {
      window.removeEventListener('userAliasChanged', handleAliasChange as EventListener);
    };
  }, []);

  const generateNewAlias = () => {
    const newAlias = refreshUserAlias();
    setUserAlias(newAlias);
    return newAlias;
  };

  return {
    userAlias: userAlias.alias,
    fullAlias: userAlias,
    generateNewAlias
  };
}