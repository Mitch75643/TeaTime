/**
 * Biometric Authentication Service for TeaSpill
 * Handles Face ID, Touch ID, and other platform biometric authentication
 */

export interface BiometricCredential {
  id: string;
  deviceId: string;
  publicKey: string;
  createdAt: string;
}

export interface BiometricAuthService {
  isSupported(): Promise<boolean>;
  register(anonId: string): Promise<BiometricCredential>;
  authenticate(anonId: string): Promise<boolean>;
  isEnabled(anonId: string): boolean;
  disable(anonId: string): Promise<void>;
  getRegisteredDevices(anonId: string): BiometricCredential[];
}

class BiometricAuthServiceImpl implements BiometricAuthService {
  private readonly STORAGE_PREFIX = 'teaspill_biometric_';
  
  /**
   * Check if biometric authentication is supported on this device
   */
  async isSupported(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false;
    }
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  }

  /**
   * Register biometric authentication for an anonymous user
   */
  async register(anonId: string): Promise<BiometricCredential> {
    if (!await this.isSupported()) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "TeaSpill",
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(anonId),
        name: anonId,
        displayName: `Anonymous User ${anonId}`,
      },
      pubKeyCredParams: [{alg: -7, type: "public-key"}],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "direct"
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create biometric credential');
      }

      const deviceId = this.generateDeviceId();
      const biometricCredential: BiometricCredential = {
        id: credential.id,
        deviceId,
        publicKey: this.arrayBufferToBase64((credential.response as any).publicKey || new ArrayBuffer(0)),
        createdAt: new Date().toISOString()
      };

      // Store credential locally
      this.storeBiometricCredential(anonId, biometricCredential);
      
      return biometricCredential;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      throw new Error('Failed to register biometric authentication. Please try again.');
    }
  }

  /**
   * Authenticate using biometric authentication
   */
  async authenticate(anonId: string): Promise<boolean> {
    if (!await this.isSupported()) {
      throw new Error('Biometric authentication is not supported');
    }

    const credentials = this.getRegisteredDevices(anonId);
    if (credentials.length === 0) {
      throw new Error('No biometric credentials found for this user');
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const allowCredentials = credentials.map(cred => ({
      id: this.base64ToArrayBuffer(cred.id),
      type: "public-key" as const,
      transports: ["internal"] as AuthenticatorTransport[]
    }));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: allowCredentials,
      timeout: 60000,
      userVerification: "required"
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (!assertion) {
        return false;
      }

      // Simple verification - in production, this should be verified server-side
      const credentialId = this.arrayBufferToBase64(assertion.rawId);
      const isValidCredential = credentials.some(cred => 
        cred.id === credentialId || this.base64ToArrayBuffer(cred.id).toString() === assertion.rawId.toString()
      );

      return isValidCredential;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled for a user
   */
  isEnabled(anonId: string): boolean {
    const credentials = this.getRegisteredDevices(anonId);
    return credentials.length > 0;
  }

  /**
   * Disable biometric authentication for a user
   */
  async disable(anonId: string): Promise<void> {
    localStorage.removeItem(this.getStorageKey(anonId));
  }

  /**
   * Get all registered biometric devices for a user
   */
  getRegisteredDevices(anonId: string): BiometricCredential[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey(anonId));
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error retrieving biometric credentials:', error);
      return [];
    }
  }

  // Helper methods
  private storeBiometricCredential(anonId: string, credential: BiometricCredential): void {
    const existingCredentials = this.getRegisteredDevices(anonId);
    const updatedCredentials = [...existingCredentials, credential];
    localStorage.setItem(this.getStorageKey(anonId), JSON.stringify(updatedCredentials));
  }

  private getStorageKey(anonId: string): string {
    return `${this.STORAGE_PREFIX}${anonId}`;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Singleton instance
export const biometricAuthService = new BiometricAuthServiceImpl();

// Utility functions for React components
export const checkBiometricSupport = async (): Promise<boolean> => {
  return await biometricAuthService.isSupported();
};

export const setupBiometricAuth = async (anonId: string): Promise<BiometricCredential> => {
  return await biometricAuthService.register(anonId);
};

export const authenticateWithBiometrics = async (anonId: string): Promise<boolean> => {
  return await biometricAuthService.authenticate(anonId);
};

export const isBiometricEnabled = (anonId: string): boolean => {
  return biometricAuthService.isEnabled(anonId);
};

export const disableBiometrics = async (anonId: string): Promise<void> => {
  return await biometricAuthService.disable(anonId);
};