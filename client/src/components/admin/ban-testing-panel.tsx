import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDeviceFingerprint } from "@/hooks/use-device-fingerprint";
import { apiRequest } from "@/lib/queryClient";
import { Shield, AlertTriangle, Clock, RefreshCw } from "lucide-react";

export function BanTestingPanel() {
  const [banReason, setBanReason] = useState("Testing ban system");
  const [isTemporary, setIsTemporary] = useState(true);
  const [expirationHours, setExpirationHours] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { getFingerprint, refreshBanStatus, banInfo, canPerformAction } = useDeviceFingerprint();

  const addTestResult = (result: any) => {
    setTestResults(prev => [{ ...result, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
  };

  const testBanDevice = async () => {
    setIsLoading(true);
    try {
      const fingerprint = getFingerprint();
      if (!fingerprint) {
        throw new Error("Could not get device fingerprint");
      }

      const expiresAt = isTemporary 
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString()
        : undefined;

      const response = await apiRequest("POST", "/api/bans/ban", {
        deviceFingerprint: fingerprint,
        banReason,
        isTemporary,
        expiresAt,
        deviceMetadata: {
          testBan: true,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });

      addTestResult({
        action: "Ban Device",
        success: true,
        details: `Device banned${isTemporary ? ` for ${expirationHours}h` : ' permanently'}`
      });

      toast({
        title: "Device Banned",
        description: `Successfully banned device${isTemporary ? ` for ${expirationHours} hours` : ' permanently'}`,
      });

      // Refresh ban status to update UI
      setTimeout(() => {
        refreshBanStatus();
      }, 1000);

    } catch (error: any) {
      addTestResult({
        action: "Ban Device",
        success: false,
        details: error.message
      });

      toast({
        title: "Ban Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testUnbanDevice = async () => {
    setIsLoading(true);
    try {
      const fingerprint = getFingerprint();
      if (!fingerprint) {
        throw new Error("Could not get device fingerprint");
      }

      const response = await apiRequest("POST", "/api/bans/unban", {
        deviceFingerprint: fingerprint
      });

      addTestResult({
        action: "Unban Device",
        success: true,
        details: "Device successfully unbanned"
      });

      toast({
        title: "Device Unbanned",
        description: "Device has been removed from ban list",
      });

      // Refresh ban status
      setTimeout(() => {
        refreshBanStatus();
      }, 1000);

    } catch (error: any) {
      addTestResult({
        action: "Unban Device",
        success: false,
        details: error.message
      });

      toast({
        title: "Unban Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPostAction = async () => {
    const canPost = canPerformAction('post');
    addTestResult({
      action: "Test Post Action",
      success: canPost,
      details: canPost ? "Post action allowed" : "Post action blocked by ban"
    });
  };

  const testCommentAction = async () => {
    const canComment = canPerformAction('comment');
    addTestResult({
      action: "Test Comment Action", 
      success: canComment,
      details: canComment ? "Comment action allowed" : "Comment action blocked by ban"
    });
  };

  const currentFingerprint = getFingerprint();

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Device Ban Testing Panel
          </CardTitle>
          <CardDescription>
            Test the device fingerprinting and ban system functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
            <h4 className="font-medium mb-2">Current Device Status</h4>
            <div className="space-y-2 text-sm">
              <div>Fingerprint: <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">{currentFingerprint?.slice(0, 16)}...</code></div>
              <div className="flex items-center gap-2">
                Ban Status: 
                <Badge variant={banInfo?.banned ? "destructive" : "secondary"}>
                  {banInfo?.banned ? (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {banInfo.isTemporary ? "Temporarily Banned" : "Permanently Banned"}
                    </>
                  ) : (
                    "Not Banned"
                  )}
                </Badge>
              </div>
              {banInfo?.banned && banInfo.banReason && (
                <div>Reason: <span className="text-red-600 dark:text-red-400">{banInfo.banReason}</span></div>
              )}
            </div>
          </div>

          {/* Ban Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="banReason">Ban Reason</Label>
              <Textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for ban..."
                className="h-20"
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="temporary"
                  checked={isTemporary}
                  onCheckedChange={setIsTemporary}
                />
                <Label htmlFor="temporary">Temporary Ban</Label>
              </div>

              {isTemporary && (
                <div>
                  <Label htmlFor="hours">Expiration (hours)</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="1"
                    max="72"
                    value={expirationHours}
                    onChange={(e) => setExpirationHours(parseInt(e.target.value) || 1)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Actions</h4>
              <div className="space-y-2">
                <Button
                  onClick={testBanDevice}
                  disabled={isLoading || banInfo?.banned}
                  className="w-full"
                  variant="destructive"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  Ban This Device
                </Button>

                <Button
                  onClick={testUnbanDevice}
                  disabled={isLoading || !banInfo?.banned}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Unban This Device
                </Button>

                <Button
                  onClick={testPostAction}
                  className="w-full"
                  variant="secondary"
                  size="sm"
                >
                  Test Post Permission
                </Button>

                <Button
                  onClick={testCommentAction}
                  className="w-full"
                  variant="secondary"
                  size="sm"
                >
                  Test Comment Permission
                </Button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Test Results</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${
                      result.success
                        ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                        : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{result.action}</span>
                      <span className="text-gray-500">{result.timestamp}</span>
                    </div>
                    <div>{result.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
            <p><strong>Note:</strong> This is a testing interface for the ban system. In production, only authorized administrators would have access to ban/unban functionality.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}