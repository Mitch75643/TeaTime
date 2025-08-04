import { useEffect } from "react";
import { useDeviceFingerprint } from "@/hooks/use-device-fingerprint";
import { BanScreen } from "@/components/ui/ban-screen";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DeviceBanGuardProps {
  children: React.ReactNode;
  allowPartialAccess?: boolean; // If true, shows ban message for actions but allows viewing
}

export function DeviceBanGuard({ children, allowPartialAccess = false }: DeviceBanGuardProps) {
  const { banInfo, isLoading, error, canPerformAction } = useDeviceFingerprint();

  // Show loading state while checking ban status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state if fingerprint initialization failed
  if (error) {
    console.warn("Device security check failed, allowing access");
    return <>{children}</>;
  }

  // Device is banned
  if (banInfo?.banned) {
    // For partial access, allow viewing but block actions
    if (allowPartialAccess) {
      return (
        <BanContextProvider banInfo={banInfo}>
          {children}
        </BanContextProvider>
      );
    }

    // Full ban - show ban screen
    return (
      <BanScreen
        banReason={banInfo.banReason}
        isTemporary={banInfo.isTemporary}
        expiresAt={banInfo.expiresAt}
      />
    );
  }

  // Device is not banned, render children normally
  return <>{children}</>;
}

// Context provider for ban information in partial access mode
import { createContext, useContext } from "react";

interface BanContextType {
  banInfo: {
    banned: boolean;
    banReason?: string;
    isTemporary?: boolean;
    expiresAt?: string;
  };
  canPerformAction: (action: string) => boolean;
}

const BanContext = createContext<BanContextType | null>(null);

function BanContextProvider({ children, banInfo }: { children: React.ReactNode; banInfo: any }) {
  const { canPerformAction } = useDeviceFingerprint();

  return (
    <BanContext.Provider value={{ banInfo, canPerformAction }}>
      {children}
    </BanContext.Provider>
  );
}

// Hook to use ban context in components
export function useBanContext() {
  const context = useContext(BanContext);
  return context;
}

// Component wrapper for action buttons that should be disabled if banned
interface BanProtectedActionProps {
  children: React.ReactNode;
  action: 'post' | 'comment' | 'react' | 'view';
  fallback?: React.ReactNode;
  className?: string;
}

export function BanProtectedAction({ children, action, fallback, className }: BanProtectedActionProps) {
  const { canPerformAction } = useDeviceFingerprint();
  const banContext = useBanContext();

  const canPerform = canPerformAction(action);

  if (!canPerform) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback for banned actions
    return (
      <div className={`opacity-50 cursor-not-allowed ${className || ''}`}>
        <div className="relative">
          {children}
          <div className="absolute inset-0 bg-red-500/10 rounded flex items-center justify-center">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              Access Denied
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}