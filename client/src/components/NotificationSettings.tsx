import { useState, useEffect } from "react";
import { Bell, BellOff, Settings, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { pushNotificationManager, type PushNotificationStatus } from "@/lib/pushNotifications";

export function NotificationSettings() {
  const [status, setStatus] = useState<PushNotificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [updating, setUpdating] = useState(false);
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

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      await pushNotificationManager.subscribe(['daily_prompt', 'daily_debate']);
      await loadNotificationStatus();
      toast({
        title: "Push notifications enabled!",
        description: "You'll get notified when new prompts and debates go live.",
      });
    } catch (error: any) {
      console.error("Failed to subscribe:", error);
      toast({
        title: "Failed to enable notifications",
        description: error.message || "Please check your browser permissions.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSubscribing(true);
    try {
      await pushNotificationManager.unsubscribe();
      await loadNotificationStatus();
      toast({
        title: "Push notifications disabled",
        description: "You won't receive notifications anymore.",
      });
    } catch (error: any) {
      console.error("Failed to unsubscribe:", error);
      toast({
        title: "Failed to disable notifications",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleUpdatePreferences = async (notificationTypes: string[]) => {
    setUpdating(true);
    try {
      await pushNotificationManager.updatePreferences(notificationTypes);
      await loadNotificationStatus();
      toast({
        title: "Preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error: any) {
      console.error("Failed to update preferences:", error);
      toast({
        title: "Failed to update preferences",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleNotificationType = (type: string, enabled: boolean) => {
    if (!status) return;

    let newTypes = [...status.notificationTypes];
    if (enabled) {
      if (!newTypes.includes(type)) {
        newTypes.push(type);
      }
    } else {
      newTypes = newTypes.filter(t => t !== type);
    }

    handleUpdatePreferences(newTypes);
  };

  const showTestNotification = async () => {
    try {
      await pushNotificationManager.showTestNotification();
      toast({
        title: "Test notification sent!",
        description: "Check if you received the notification.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send test notification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!pushNotificationManager.isSupported()) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
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
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 animate-spin" />
            Loading notification settings...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status?.isSubscribed ? (
            <Bell className="h-5 w-5 text-orange-400" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when new Daily Prompts and Debates go live
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={status?.isSubscribed ? "default" : "secondary"}>
              {status?.isSubscribed ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          
          {status?.isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnsubscribe}
              disabled={subscribing}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
            >
              {subscribing ? "Disabling..." : "Disable"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={subscribing}
              className="bg-orange-400 hover:bg-orange-500 text-white"
            >
              {subscribing ? "Enabling..." : "Enable"}
            </Button>
          )}
        </div>

        {/* Notification Type Preferences */}
        {status?.isSubscribed && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Notification Types:</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-prompt" className="text-sm">
                  Daily Prompts
                  <span className="text-xs text-muted-foreground block">
                    New story prompts every 24 hours
                  </span>
                </Label>
                <Switch
                  id="daily-prompt"
                  checked={status.notificationTypes.includes('daily_prompt')}
                  onCheckedChange={(checked) => 
                    handleToggleNotificationType('daily_prompt', checked)
                  }
                  disabled={updating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="daily-debate" className="text-sm">
                  Daily Debates
                  <span className="text-xs text-muted-foreground block">
                    New debate topics every 24 hours
                  </span>
                </Label>
                <Switch
                  id="daily-debate"
                  checked={status.notificationTypes.includes('daily_debate')}
                  onCheckedChange={(checked) => 
                    handleToggleNotificationType('daily_debate', checked)
                  }
                  disabled={updating}
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Notification */}
        {status?.isSubscribed && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={showTestNotification}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </div>
        )}

        {/* Stats */}
        {status?.stats && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Statistics:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-semibold text-orange-400">
                  {status.stats.sentNotifications}
                </div>
                <div className="text-muted-foreground">Sent</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-semibold text-orange-400">
                  {status.stats.activeSubscriptions}
                </div>
                <div className="text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p>• Notifications are sent when new content rotates every 24 hours</p>
          <p>• You can disable notifications anytime in your browser settings</p>
          <p>• Your device will need internet connection to receive notifications</p>
        </div>
      </CardContent>
    </Card>
  );
}