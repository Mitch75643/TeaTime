import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Device fingerprinting utility for anonymous ban system
class DeviceFingerprinting {
  private fpPromise: Promise<any> | null = null;
  private cachedFingerprint: string | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.fpPromise = FingerprintJS.load();
    } catch (error) {
      console.warn('Failed to load FingerprintJS:', error);
      this.fpPromise = null;
    }
  }

  // Generate comprehensive device fingerprint
  async generateFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    try {
      let fingerprint = '';

      // Primary fingerprint from FingerprintJS
      if (this.fpPromise) {
        const fp = await this.fpPromise;
        const result = await fp.get();
        fingerprint = result.visitorId;
      }

      // Fallback fingerprinting using device entropy
      if (!fingerprint) {
        fingerprint = await this.generateFallbackFingerprint();
      }

      // Store in multiple places for persistence
      this.cachedFingerprint = fingerprint;
      this.storeFingerprint(fingerprint);
      
      return fingerprint;
    } catch (error) {
      console.warn('Fingerprint generation failed:', error);
      // Last resort - use fallback method
      const fallback = await this.generateFallbackFingerprint();
      this.storeFingerprint(fallback);
      return fallback;
    }
  }

  // Fallback fingerprinting method using device characteristics
  private async generateFallbackFingerprint(): Promise<string> {
    const entropy: string[] = [];

    try {
      // Screen characteristics
      entropy.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
      entropy.push(`availScreen:${screen.availWidth}x${screen.availHeight}`);
      
      // Browser characteristics
      entropy.push(`userAgent:${navigator.userAgent}`);
      entropy.push(`language:${navigator.language}`);
      entropy.push(`languages:${navigator.languages?.join(',') || ''}`);
      entropy.push(`platform:${navigator.platform}`);
      entropy.push(`cookieEnabled:${navigator.cookieEnabled}`);
      entropy.push(`doNotTrack:${navigator.doNotTrack || 'null'}`);
      
      // Timezone
      entropy.push(`timezone:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      entropy.push(`timezoneOffset:${new Date().getTimezoneOffset()}`);
      
      // Canvas fingerprinting (simplified)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test 🔒', 2, 2);
        entropy.push(`canvas:${canvas.toDataURL()}`);
      }
      
      // WebGL fingerprinting
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const renderer = gl.getParameter(gl.RENDERER) || '';
        const vendor = gl.getParameter(gl.VENDOR) || '';
        entropy.push(`webgl:${vendor}|${renderer}`);
      }
      
      // Local storage test
      try {
        const testKey = '__fp_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        entropy.push('localStorage:available');
      } catch {
        entropy.push('localStorage:unavailable');
      }

      // Generate hash from entropy
      const entropyString = entropy.join('|');
      return await this.simpleHash(entropyString);
    } catch (error) {
      console.warn('Fallback fingerprinting failed:', error);
      // Ultimate fallback
      return await this.simpleHash(`${Date.now()}-${Math.random()}-${navigator.userAgent}`);
    }
  }

  // Simple hash function for fingerprint generation
  private async simpleHash(str: string): Promise<string> {
    try {
      // Use crypto API if available
      if (crypto && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
      }
    } catch (error) {
      console.warn('Crypto hash failed, using fallback:', error);
    }

    // Fallback simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // Store fingerprint in multiple locations for persistence
  private storeFingerprint(fingerprint: string) {
    try {
      // LocalStorage
      localStorage.setItem('device_fp', fingerprint);
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }

    try {
      // Cookie
      document.cookie = `device_fp=${fingerprint}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Strict`;
    } catch (error) {
      console.warn('Failed to store in cookie:', error);
    }
  }

  // Retrieve stored fingerprint
  getStoredFingerprint(): string | null {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    // Try localStorage first
    try {
      const stored = localStorage.getItem('device_fp');
      if (stored) {
        this.cachedFingerprint = stored;
        return stored;
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    // Try cookie
    try {
      const cookieMatch = document.cookie.match(/device_fp=([^;]+)/);
      if (cookieMatch) {
        const stored = cookieMatch[1];
        this.cachedFingerprint = stored;
        return stored;
      }
    } catch (error) {
      console.warn('Failed to read from cookie:', error);
    }

    return null;
  }

  // Get device metadata for ban system debugging
  async getDeviceMetadata(): Promise<Record<string, any>> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
    };
  }

  // Clear stored fingerprints (for testing)
  clearStoredFingerprint() {
    this.cachedFingerprint = null;
    try {
      localStorage.removeItem('device_fp');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
    try {
      document.cookie = 'device_fp=; path=/; max-age=0';
    } catch (error) {
      console.warn('Failed to clear cookie:', error);
    }
  }
}

// Singleton instance
export const deviceFingerprinting = new DeviceFingerprinting();

// Helper function for easy access
export const getDeviceFingerprint = async (): Promise<string> => {
  // First try to get stored fingerprint
  const stored = deviceFingerprinting.getStoredFingerprint();
  if (stored) {
    return stored;
  }
  
  // Generate new fingerprint if none exists
  return await deviceFingerprinting.generateFingerprint();
};

// Check if device is potentially banned (quick client-side check)
export const isDevicePotentiallyBanned = (): boolean => {
  try {
    return localStorage.getItem('device_banned') === 'true';
  } catch {
    return false;
  }
};

// Mark device as banned (client-side cache)
export const markDeviceAsBanned = () => {
  try {
    localStorage.setItem('device_banned', 'true');
  } catch (error) {
    console.warn('Failed to mark device as banned:', error);
  }
};

// Clear ban status (for testing or appeal)
export const clearDeviceBanStatus = () => {
  try {
    localStorage.removeItem('device_banned');
  } catch (error) {
    console.warn('Failed to clear ban status:', error);
  }
};