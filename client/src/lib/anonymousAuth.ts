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
  ctx?.fillText('TeaSpill', 10, 10);
  
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
  ANON_ID: 'teaspill_anon_id',
  USER_DATA: 'teaspill_user_data',
  DEVICE_FINGERPRINT: 'teaspill_device_fp',
  IS_UPGRADED: 'teaspill_is_upgraded',
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
      const serverUser = await apiRequest('POST', '/api/auth/create-anon', userData) as AnonymousUser;

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
    try {
      const serverUser = await apiRequest('POST', `/api/auth/sync/${anonId}`, {
        deviceFingerprint: this.currentUser?.deviceFingerprint
      }) as AnonymousUser;

      if (this.currentUser) {
        this.currentUser.sessionId = serverUser.sessionId;
        this.currentUser.isUpgraded = serverUser.isUpgraded;
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error('Failed to sync with server:', error);
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
    const hasPosted = localStorage.getItem('teaspill_has_posted') === 'true';
    const visitCount = parseInt(localStorage.getItem('teaspill_visit_count') || '0');
    
    return hasPosted || visitCount > 2;
  }

  // Mark user as having posted (for upgrade prompting)
  markUserAsPosted() {
    localStorage.setItem('teaspill_has_posted', 'true');
  }

  // Increment visit count
  incrementVisitCount() {
    const count = parseInt(localStorage.getItem('teaspill_visit_count') || '0');
    localStorage.setItem('teaspill_visit_count', (count + 1).toString());
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
      }) as { success: boolean; error?: string };

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
      }) as { success: boolean; error?: string; user?: AnonymousUser };

      if (result.success && result.user) {
        // Replace current user with synced user
        const localUserData: LocalUserData = {
          anonId: result.user.anonId,
          alias: result.user.alias,
          avatarId: result.user.avatarId || 'happy-face',
          deviceFingerprint: generateDeviceFingerprint(),
          isUpgraded: true,
          sessionId: result.user.sessionId,
          preferences: result.user.preferences
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

  // Clear user data (for testing or logout)
  clearUserData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('teaspill_has_posted');
    localStorage.removeItem('teaspill_visit_count');
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
    clearUserData: anonymousAuth.clearUserData.bind(anonymousAuth)
  };
}

// React Provider component for authentication initialization
interface AnonymousAuthProviderProps {
  children: React.ReactNode;
}

export function AnonymousAuthProvider({ children }: AnonymousAuthProviderProps) {
  React.useEffect(() => {
    // Initialize authentication system on app startup
    anonymousAuth.createOrGetUser();
  }, []);

  return React.createElement(React.Fragment, null, children);
}