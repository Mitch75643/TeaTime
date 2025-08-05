import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Generate device fingerprint for admin authentication
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    // Initialize the agent at application startup
    const fp = await FingerprintJS.load();
    
    // Get the visitor identifier when you need it
    const result = await fp.get();
    
    // The visitor identifier
    return result.visitorId;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    
    // Fallback fingerprint using browser characteristics
    const fallbackFingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');
    
    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fallbackFingerprint.length; i++) {
      const char = fallbackFingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
}

// Store fingerprint in local storage for persistence
export function getStoredFingerprint(): string | null {
  return localStorage.getItem('device_fingerprint');
}

export function storeFingerprint(fingerprint: string): void {
  localStorage.setItem('device_fingerprint', fingerprint);
}

// Get or generate fingerprint
export async function getDeviceFingerprint(): Promise<string> {
  let fingerprint = getStoredFingerprint();
  
  if (!fingerprint) {
    fingerprint = await generateDeviceFingerprint();
    storeFingerprint(fingerprint);
  }
  
  return fingerprint;
}