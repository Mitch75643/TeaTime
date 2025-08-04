import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pushNotificationManager, type PushNotificationStatus } from "@/lib/pushNotifications";

interface NotificationBadgeProps {
  className?: string;
  showText?: boolean;
}

export function NotificationBadge({ className = "", showText = false }: NotificationBadgeProps) {
  const [status, setStatus] = useState<PushNotificationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pushNotificationManager.isSupported()) {
      loadStatus();
    }
  }, []);

  const loadStatus = async () => {
    try {
      const currentStatus = await pushNotificationManager.getStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error("Failed to load notification status:", error);
    }
  };

  const handleToggle = async () => {
    if (!status) return;
    
    setLoading(true);
    try {
      if (status.isSubscribed) {
        await pushNotificationManager.unsubscribe();
      } else {
        await pushNotificationManager.subscribe(['daily_prompt', 'daily_debate']);
      }
      await loadStatus();
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!pushNotificationManager.isSupported()) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`relative ${className}`}
    >
      {status?.isSubscribed ? (
        <Bell className="h-4 w-4 text-orange-400" />
      ) : (
        <BellOff className="h-4 w-4 text-muted-foreground" />
      )}
      
      {showText && (
        <span className="ml-2 text-xs">
          {loading ? "..." : status?.isSubscribed ? "On" : "Off"}
        </span>
      )}
      
      {status?.isSubscribed && (
        <Badge 
          variant="secondary" 
          className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-orange-400 border-0"
        />
      )}
    </Button>
  );
}