import React from 'react';
import { apiRequest } from './queryClient';
import type { AnonymousUser, CreateAnonymousUserInput, UpgradeAccountInput, LoginInput } from '@shared/schema';

// Anonymous ID generation
function generateAnonId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'anon_';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate fun username (from existing system)
function generateFunUsername(): string {
  const dramaPrefixes = ['Spill', 'Tea', 'Drama', 'Chaos', 'Petty', 'Sassy', 'Messy', 'Shady'];
  const chillPrefixes = ['Calm', 'Zen', 'Cool', 'Chill', 'Smooth', 'Easy', 'Laid', 'Mellow'];
  const funnyPrefixes = ['Giggle', 'Laugh', 'Joke', 'Fun', 'Silly', 'Goofy', 'Witty', 'Quirky'];
  const mysteriousPrefixes = ['Shadow', 'Whisper', 'Secret', 'Hidden', 'Mystery', 'Enigma', 'Phantom', 'Ghost'];
  
  const suffixes = ['Queen', 'King', 'Master', 'Expert', 'Pro', 'Legend', 'Boss', 'Star', 'Hero', 'Ninja'];
  const numbers = Math.floor(Math.random() * 100) + 1;
  
  const allPrefixes = [...dramaPrefixes, ...chillPrefixes, ...funnyPrefixes, ...mysteriousPrefixes];
  const randomPrefix = allPrefixes[Math.floor(Math.random() * allPrefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${randomPrefix}${randomSuffix}${numbers}`;
}

// Device fingerprinting (basic, privacy-friendly)
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Tfess', 10, 10);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Local storage keys
const STORAGE_KEYS = {
  ANON_ID: 'tfess_anon_id',
  USER_DATA: 'tfess_user_data',
  DEVICE_FINGERPRINT: 'tfess_device_fp',
  IS_UPGRADED: 'tfess_is_upgraded',
} as const;

export interface LocalUserData {
  anonId: string;
  alias: string;
  avatarId: string;
  deviceFingerprint: string;
  isUpgraded: boolean;
  sessionId?: string;
  preferences?: Record<string, any>;
}

class AnonymousAuthService {
  private currentUser: LocalUserData | null = null;
  private listeners: ((user: LocalUserData | null) => void)[] = [];

  constructor() {
    this.initializeUser();
  }

  // Event system for React components
  subscribe(listener: (user: LocalUserData | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Initialize and create or get existing user (public method for Provider)
  async createOrGetUser(): Promise<LocalUserData> {
    // Check if user already exists locally
    const existingUser = this.loadFromLocalStorage();
    if (existingUser) {
      this.currentUser = existingUser;
      // Sync with server in the background
      this.syncWithServer(existingUser.anonId).catch(console.error);
      this.notify();
      return existingUser;
    }
    
    // Create new user
    return this.createNewUser();
  }

  // Initialize or restore user on app start
  private async initializeUser() {
    try {
      // Check for existing user in localStorage
      const existingAnonId = localStorage.getItem(STORAGE_KEYS.ANON_ID);
      const existingUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (existingAnonId && existingUserData) {
        // Restore existing user
        const userData = JSON.parse(existingUserData) as LocalUserData;
        this.currentUser = userData;
        
        // Sync with server to get updated session
        await this.syncWithServer(userData.anonId);
      } else {
        // Create new anonymous user
        await this.createNewUser();
      }
      
      this.notify();
    } catch (error) {
      console.error('Failed to initialize user:', error);
      // Fallback: create new user
      await this.createNewUser();
      this.notify();
    }
  }

  // Create new anonymous user
  private async createNewUser(): Promise<LocalUserData> {
    const anonId = generateAnonId();
    const alias = generateFunUsername();
    const deviceFingerprint = generateDeviceFingerprint();
    
    const userData: CreateAnonymousUserInput = {
      deviceFingerprint,
      alias,
      avatarId: 'happy-face'
    };

    try {
      // Register with server
      const serverUser = await apiRequest('POST', '/api/auth/create-anon', userData) as unknown as AnonymousUser;

      // Store locally
      const localUserData: LocalUserData = {
        anonId: serverUser.anonId,
        alias: serverUser.alias,
        avatarId: serverUser.avatarId || 'happy-face',
        deviceFingerprint,
        isUpgraded: false,
        sessionId: serverUser.sessionId
      };

      this.currentUser = localUserData;
      this.saveToLocalStorage();
      this.notify();
      return localUserData;
      
    } catch (error) {
      console.error('Failed to create user on server:', error);
      
      // Offline fallback
      const localUserData: LocalUserData = {
        anonId,
        alias,
        avatarId: 'happy-face',
        deviceFingerprint,
        isUpgraded: false,
        sessionId: `session_${Date.now()}`
      };

      this.currentUser = localUserData;
      this.saveToLocalStorage();
      this.notify();
      return localUserData;
    }
  }

  // Load user from localStorage
  private loadFromLocalStorage(): LocalUserData | null {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        return JSON.parse(userData) as LocalUserData;
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
    }
    return null;
  }

  // Sync local user with server
  private async syncWithServer(anonId: string) {
    // Don't try to sync if anonId is undefined or empty
    if (!anonId || anonId === 'undefined') {
      console.log('Skipping sync - no valid anonId');
      return;
    }

    try {
      const serverUser = await apiRequest('POST', `/api/auth/sync/${anonId}`, {
        deviceFingerprint: this.currentUser?.deviceFingerprint
      }) as unknown as AnonymousUser;

      if (this.currentUser) {
        this.currentUser.sessionId = serverUser.sessionId;
        this.currentUser.isUpgraded = serverUser.isUpgraded || false;
        this.saveToLocalStorage();
      }
    } catch (error) {
      // Silently handle sync errors - user can continue without server sync
      // Only log for debugging if needed
      if (error instanceof Error && !error.message.includes('User not found')) {
        console.error('Failed to sync with server:', error);
      }
    }
  }

  // Save user data to localStorage
  private saveToLocalStorage() {
    if (!this.currentUser) return;
    
    localStorage.setItem(STORAGE_KEYS.ANON_ID, this.currentUser.anonId);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.currentUser));
    localStorage.setItem(STORAGE_KEYS.DEVICE_FINGERPRINT, this.currentUser.deviceFingerprint);
    localStorage.setItem(STORAGE_KEYS.IS_UPGRADED, this.currentUser.isUpgraded.toString());
  }

  // Get current user
  getCurrentUser(): LocalUserData | null {
    return this.currentUser;
  }

  // Check if user should be prompted to upgrade
  shouldPromptUpgrade(): boolean {
    if (!this.currentUser || this.currentUser.isUpgraded) return false;
    
    // Check if user has made posts or been active
    const hasPosted = localStorage.getItem('tfess_has_posted') === 'true';
    const visitCount = parseInt(localStorage.getItem('tfess_visit_count') || '0');
    
    return hasPosted || visitCount > 2;
  }

  // Mark user as having posted (for upgrade prompting)
  markUserAsPosted() {
    localStorage.setItem('fessr_has_posted', 'true');
  }

  // Increment visit count
  incrementVisitCount() {
    const count = parseInt(localStorage.getItem('fessr_visit_count') || '0');
    localStorage.setItem('fessr_visit_count', (count + 1).toString());
  }

  // Upgrade account for cross-device sync
  async upgradeAccount(upgradeData: UpgradeAccountInput): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'No user found' };
    }

    try {
      const result = await apiRequest('POST', '/api/auth/upgrade', {
        anonId: this.currentUser.anonId,
        ...upgradeData
      }) as unknown as { success: boolean; error?: string };

      if (result.success) {
        this.currentUser.isUpgraded = true;
        this.saveToLocalStorage();
        this.notify();
      }

      return result;
    } catch (error) {
      return { success: false, error: 'Failed to upgrade account' };
    }
  }

  // Login from another device
  async loginFromAnotherDevice(loginData: LoginInput): Promise<{ success: boolean; error?: string; user?: LocalUserData }> {
    try {
      const result = await apiRequest('POST', '/api/auth/login', {
        ...loginData,
        deviceFingerprint: generateDeviceFingerprint()
      }) as unknown as { success: boolean; error?: string; user?: AnonymousUser };

      if (result.success && result.user) {
        // Replace current user with synced user
        const localUserData: LocalUserData = {
          anonId: result.user.anonId,
          alias: result.user.alias,
          avatarId: result.user.avatarId || 'happy-face',
          deviceFingerprint: generateDeviceFingerprint(),
          isUpgraded: true,
          sessionId: result.user.sessionId,
          preferences: result.user.preferences as Record<string, any> | undefined
        };

        this.currentUser = localUserData;
        this.saveToLocalStorage();
        this.notify();

        return { success: true, user: localUserData };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to login' };
    }
  }

  // Update user profile (alias, avatar)
  async updateProfile(updates: { alias?: string; avatarId?: string }) {
    if (!this.currentUser) return;

    try {
      await apiRequest('POST', '/api/auth/update-profile', {
        anonId: this.currentUser.anonId,
        ...updates
      });

      // Update local data
      if (updates.alias) this.currentUser.alias = updates.alias;
      if (updates.avatarId) this.currentUser.avatarId = updates.avatarId;
      
      this.saveToLocalStorage();
      this.notify();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }

  // Ensure user exists (create if needed)
  async ensureUserExists(): Promise<LocalUserData> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    return this.createOrGetUser();
  }

  // Clear user data (for testing or logout)
  clearUserData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('fessr_has_posted');
    localStorage.removeItem('fessr_visit_count');
    localStorage.removeItem('fessr_auth_seen');
    this.currentUser = null;
    this.notify();
  }
}

// Create singleton instance
export const anonymousAuth = new AnonymousAuthService();

// React hook for using anonymous auth
export function useAnonymousAuth() {
  const [user, setUser] = React.useState<LocalUserData | null>(anonymousAuth.getCurrentUser());

  React.useEffect(() => {
    return anonymousAuth.subscribe(setUser);
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    isUpgraded: user?.isUpgraded || false,
    shouldPromptUpgrade: anonymousAuth.shouldPromptUpgrade(),
    upgradeAccount: anonymousAuth.upgradeAccount.bind(anonymousAuth),
    loginFromAnotherDevice: anonymousAuth.loginFromAnotherDevice.bind(anonymousAuth),
    updateProfile: anonymousAuth.updateProfile.bind(anonymousAuth),
    markUserAsPosted: anonymousAuth.markUserAsPosted.bind(anonymousAuth),
    incrementVisitCount: anonymousAuth.incrementVisitCount.bind(anonymousAuth),
    ensureUserExists: anonymousAuth.ensureUserExists.bind(anonymousAuth),
    clearUserData: anonymousAuth.clearUserData.bind(anonymousAuth)
  };
}

// React Provider component for authentication initialization
interface AnonymousAuthProviderProps {
  children: React.ReactNode;
}

export function AnonymousAuthProvider({ children }: AnonymousAuthProviderProps) {
  const [hasChosenAuth, setHasChosenAuth] = React.useState(false);

  React.useEffect(() => {
    // Check if user has already made an authentication choice
    const existingUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const hasSeenAuth = localStorage.getItem('fessr_auth_seen') === 'true';
    
    if (existingUser || hasSeenAuth) {
      // User has already authenticated or chosen to stay anonymous
      anonymousAuth.createOrGetUser();
      setHasChosenAuth(true);
    } else {
      // Auto-create anonymous user for immediate functionality
      localStorage.setItem('fessr_auth_seen', 'true');
      anonymousAuth.createOrGetUser();
      setHasChosenAuth(true);
    }
  }, []);

  // If user hasn't chosen authentication method, show auth page
  if (!hasChosenAuth) {
    return React.createElement('div', { 
      style: { 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom right, #fff7ed, #fef3c7)', 
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, React.createElement('div', {
      style: {
        width: '100%',
        maxWidth: '32rem',
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fed7aa',
        padding: '2rem'
      }
    }, [
      React.createElement('div', { 
        key: 'header',
        style: { textAlign: 'center', marginBottom: '2rem' }
      }, [
        React.createElement('div', {
          key: 'icon',
          style: {
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(to right, #f97316, #f59e0b)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }
        }, '🔒'),
        React.createElement('h1', {
          key: 'title',
          style: {
            fontSize: '2rem',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #ea580c, #d97706)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '0.5rem'
          }
        }, 'Welcome to Fessr'),
        React.createElement('p', {
          key: 'subtitle',
          style: {
            fontSize: '1.125rem',
            color: '#6b7280'
          }
        }, 'Share your stories anonymously with complete privacy')
      ]),
      React.createElement('div', {
        key: 'choices',
        style: { display: 'grid', gap: '1rem' }
      }, [
        // Anonymous option
        React.createElement('div', {
          key: 'anonymous',
          style: {
            border: '2px solid #fed7aa',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          },
          onClick: () => {
            localStorage.setItem('fessr_auth_seen', 'true');
            anonymousAuth.createOrGetUser();
            setHasChosenAuth(true);
          }
        }, [
          React.createElement('div', {
            key: 'content',
            style: { display: 'flex', alignItems: 'center', gap: '1rem' }
          }, [
            React.createElement('div', {
              key: 'icon',
              style: {
                width: '3rem',
                height: '3rem',
                background: '#fff7ed',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }, '👤'),
            React.createElement('div', { key: 'text' }, [
              React.createElement('h3', {
                key: 'title',
                style: { fontWeight: '600', color: '#9a3412', marginBottom: '0.25rem' }
              }, 'Stay Anonymous'),
              React.createElement('p', {
                key: 'desc',
                style: { fontSize: '0.875rem', color: '#6b7280' }
              }, 'Start sharing immediately with a local anonymous account')
            ])
          ]),
          React.createElement('button', {
            key: 'button',
            style: {
              width: '100%',
              background: '#ea580c',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: '500',
              marginTop: '1rem',
              cursor: 'pointer'
            }
          }, 'Continue Anonymously')
        ]),
        // Sync option  
        React.createElement('div', {
          key: 'sync',
          style: {
            border: '2px solid #bfdbfe',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            cursor: 'pointer'
          },
          onClick: () => {
            localStorage.setItem('fessr_auth_seen', 'true');
            window.location.href = '/auth';
          }
        }, [
          React.createElement('div', {
            key: 'content',
            style: { display: 'flex', alignItems: 'center', gap: '1rem' }
          }, [
            React.createElement('div', {
              key: 'icon',
              style: {
                width: '3rem',
                height: '3rem',
                background: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }, '🔑'),
            React.createElement('div', { key: 'text' }, [
              React.createElement('h3', {
                key: 'title',
                style: { fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem' }
              }, 'Enable Cross-Device Sync'),
              React.createElement('p', {
                key: 'desc',
                style: { fontSize: '0.875rem', color: '#6b7280' }
              }, 'Access your anonymous account from multiple devices')
            ])
          ]),
          React.createElement('button', {
            key: 'button',
            style: {
              width: '100%',
              background: 'transparent',
              color: '#1e40af',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #bfdbfe',
              fontWeight: '500',
              marginTop: '1rem',
              cursor: 'pointer'
            }
          }, 'Set Up Sync & Login Options')
        ])
      ])
    ]));
  }

  return React.createElement(React.Fragment, null, children);
}