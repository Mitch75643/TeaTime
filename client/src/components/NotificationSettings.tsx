import { useState, useEffect } from "react";
import { Bell, BellOff, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { pushNotificationManager, type PushNotificationStatus } from "@/lib/pushNotifications";

export function NotificationSettings() {
  const [status, setStatus] = useState<PushNotificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = async () => {
    try {
      if (pushNotificationManager.isSupported()) {
        const currentStatus = await pushNotificationManager.getStatus();
        setStatus(currentStatus);
      }
    } catch (error) {
      console.error("Failed to load notification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setToggling(true);
    try {
      if (enabled) {
        await pushNotificationManager.subscribe(['daily_prompt', 'daily_debate']);
        await loadNotificationStatus();
        toast({
          title: "Push notifications enabled",
          description: "You'll get notified when new Daily Prompts & Debates go live.",
        });
      } else {
        await pushNotificationManager.unsubscribe();
        await loadNotificationStatus();
        toast({
          title: "Push notifications disabled",
          description: "You won't receive notifications anymore.",
        });
      }
    } catch (error: any) {
      console.error("Failed to toggle notifications:", error);
      toast({
        title: enabled ? "Failed to enable notifications" : "Failed to disable notifications",
        description: error.message || "Please check your browser permissions and try again.",
        variant: "destructive",
      });
      // Reload status to revert any partial changes
      await loadNotificationStatus();
    } finally {
      setToggling(false);
    }
  };

  if (!pushNotificationManager.isSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 animate-spin" />
            Notifications
          </CardTitle>
          <CardDescription>Loading notification settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          Notifications
        </CardTitle>
        <CardDescription>
          Manage your push notification preferences
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {status?.isSubscribed ? (
              <Bell className="h-5 w-5 text-orange-400" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="push-notifications" className="font-medium">
                🔔 Enable Push Notifications for Daily Prompts & Debates
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new content goes live every 24 hours
              </p>
            </div>
          </div>
          <Switch
            id="push-notifications"
            checked={status?.isSubscribed || false}
            onCheckedChange={handleToggleNotifications}
            disabled={toggling}
          />
        </div>

        {/* Status Info */}
        {status?.isSubscribed && (
          <div className="space-y-3 pt-2">
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              ✓ Push notifications are enabled. You'll receive alerts when new Daily Prompts and Daily Debates go live.
            </div>
            
            {/* Stats */}
            {status.stats && (
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Your Stats:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-orange-400">
                      {status.stats.sentNotifications}
                    </div>
                    <div className="text-muted-foreground">Notifications Received</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-orange-400">
                      {status.stats.activeSubscriptions}
                    </div>
                    <div className="text-muted-foreground">Active Devices</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-lg">
          <p><strong>How it works:</strong></p>
          <p>• New prompts and debates rotate automatically every 24 hours</p>
          <p>• You'll get a notification when fresh content is available</p>
          <p>• Your data remains completely anonymous - notifications are tied to your session only</p>
          <p>• You can turn this off anytime or manage permissions in your browser settings</p>
        </div>
      </CardContent>
    </Card>
  );
}