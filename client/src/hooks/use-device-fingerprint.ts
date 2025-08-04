import { useState, useEffect } from "react";
import { getDeviceFingerprint, isDevicePotentiallyBanned, markDeviceAsBanned, clearDeviceBanStatus } from "@/lib/deviceFingerprint";
import { apiRequest } from "@/lib/queryClient";

interface DeviceBanInfo {
  banned: boolean;
  banReason?: string;
  isTemporary?: boolean;
  expiresAt?: string;
}

export function useDeviceFingerprint() {
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [banInfo, setBanInfo] = useState<DeviceBanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize device fingerprint
  useEffect(() => {
    let mounted = true;

    async function initializeFingerprint() {
      try {
        setIsLoading(true);
        setError(null);

        // Check if device is potentially banned (client-side cache)
        const potentiallyBanned = isDevicePotentiallyBanned();
        if (potentiallyBanned) {
          setBanInfo({ banned: true, banReason: "Cached ban status" });
          setIsLoading(false);
          return;
        }

        // Generate device fingerprint
        const fingerprint = await getDeviceFingerprint();
        if (!mounted) return;

        setDeviceFingerprint(fingerprint);

        // Check ban status with server
        const banCheck = await checkDeviceBanStatus(fingerprint);
        if (!mounted) return;

        setBanInfo(banCheck);
        
        // Cache ban status if banned
        if (banCheck.banned) {
          markDeviceAsBanned();
        }

      } catch (err) {
        console.warn("Device fingerprint initialization failed:", err);
        if (mounted) {
          setError("Failed to initialize device security");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeFingerprint();

    return () => {
      mounted = false;
    };
  }, []);

  // Check device ban status with server
  async function checkDeviceBanStatus(fingerprint: string): Promise<DeviceBanInfo> {
    try {
      const response = await apiRequest("POST", "/api/bans/check", {
        deviceFingerprint: fingerprint
      });

      return {
        banned: response.banned || false,
        banReason: response.banInfo?.banReason,
        isTemporary: response.banInfo?.isTemporary,
        expiresAt: response.banInfo?.expiresAt,
      };
    } catch (error) {
      console.error("Ban check failed:", error);
      // Fail safe - assume not banned if check fails
      return { banned: false };
    }
  }

  // Refresh ban status (for appeals or admin actions)
  async function refreshBanStatus() {
    if (!deviceFingerprint) return;

    try {
      setIsLoading(true);
      const banCheck = await checkDeviceBanStatus(deviceFingerprint);
      setBanInfo(banCheck);
      
      if (banCheck.banned) {
        markDeviceAsBanned();
      } else {
        clearDeviceBanStatus();
      }
    } catch (error) {
      console.error("Failed to refresh ban status:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Clear ban status (for testing or appeals)
  function clearBanStatus() {
    clearDeviceBanStatus();
    setBanInfo({ banned: false });
  }

  // Get device fingerprint for API requests
  function getFingerprint(): string | null {
    return deviceFingerprint;
  }

  // Check if specific action is allowed
  function canPerformAction(action: 'post' | 'comment' | 'react' | 'view'): boolean {
    if (!banInfo) return true; // Allow if no ban info yet
    
    if (banInfo.banned) {
      // Check if temporary ban has expired
      if (banInfo.isTemporary && banInfo.expiresAt) {
        const expirationDate = new Date(banInfo.expiresAt);
        const now = new Date();
        
        if (now > expirationDate) {
          // Ban has expired, clear it
          clearBanStatus();
          return true;
        }
      }
      
      // Device is banned and ban hasn't expired
      return false;
    }
    
    return true;
  }

  return {
    deviceFingerprint,
    banInfo,
    isLoading,
    error,
    canPerformAction,
    refreshBanStatus,
    clearBanStatus,
    getFingerprint,
  };
}

// Hook for components that need to check ban status without full initialization
export function useDeviceBanCheck() {
  const [isChecking, setIsChecking] = useState(false);

  async function checkBanStatus(fingerprint: string): Promise<DeviceBanInfo> {
    setIsChecking(true);
    try {
      const response = await apiRequest("POST", "/api/bans/check", {
        deviceFingerprint: fingerprint
      });

      return {
        banned: response.banned || false,
        banReason: response.banInfo?.banReason,
        isTemporary: response.banInfo?.isTemporary,
        expiresAt: response.banInfo?.expiresAt,
      };
    } catch (error) {
      console.error("Ban check failed:", error);
      return { banned: false };
    } finally {
      setIsChecking(false);
    }
  }

  return {
    checkBanStatus,
    isChecking,
  };
}