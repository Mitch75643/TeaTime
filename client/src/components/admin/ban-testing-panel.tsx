import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useDeviceFingerprint } from "@/hooks/use-device-fingerprint";
import { apiRequest } from "@/lib/queryClient";
import { Shield, AlertTriangle, Clock, RefreshCw, Monitor, Settings, Zap, TestTube, Lock, Unlock } from "lucide-react";

export function BanTestingPanel() {
  const [banReason, setBanReason] = useState("Testing ban system");
  const [isTemporary, setIsTemporary] = useState(true);
  const [expirationHours, setExpirationHours] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { getFingerprint, refreshBanStatus, banInfo, canPerformAction } = useDeviceFingerprint();

  // SECURITY: Admin/Developer check - only show panel in development or to authorized admins
  const isAdminEnvironment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isAuthorizedAdmin = false; // TODO: Implement proper admin role checking when auth system is ready
  
  // SECURITY: Hide panel from regular users - this contains sensitive admin functions
  if (!isAdminEnvironment && !isAuthorizedAdmin) {
    return null;
  }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Shield className="w-8 h-8 text-orange-500" />
            Device Ban Testing Panel
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm italic">
            Test the device fingerprinting and ban system functionality
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Status & Settings */}
          <div className="space-y-6">
            {/* Current Device Status */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="w-5 h-5 text-blue-500" />
                  Current Device Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fingerprint:</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded font-mono">
                      {currentFingerprint?.slice(0, 16)}...
                    </code>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ban Status:</span>
                    <Badge 
                      variant={banInfo?.banned ? "destructive" : "secondary"}
                      className={banInfo?.banned ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200" : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"}
                    >
                      {banInfo?.banned ? (
                        <>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {banInfo.isTemporary ? "Temporarily Banned" : "Permanently Banned"}
                        </>
                      ) : (
                        <>
                          🟢 Not Banned
                        </>
                      )}
                    </Badge>
                  </div>
                  {banInfo?.banned && banInfo.banReason && (
                    <>
                      <Separator />
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Reason:</strong> {banInfo.banReason}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ban Settings */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-purple-500" />
                  Ban Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="banReason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ban Reason
                    </Label>
                    <Textarea
                      id="banReason"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Enter reason for ban..."
                      className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-20"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="temporary"
                        checked={isTemporary}
                        onCheckedChange={setIsTemporary}
                        className="data-[state=checked]:bg-orange-500"
                      />
                      <Label htmlFor="temporary" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        🔁 Temporary Ban
                      </Label>
                    </div>
                  </div>

                  {isTemporary && (
                    <div className="pl-6 space-y-2">
                      <Label htmlFor="hours" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiration (hours)
                      </Label>
                      <Input
                        id="hours"
                        type="number"
                        min="1"
                        max="72"
                        value={expirationHours}
                        onChange={(e) => setExpirationHours(parseInt(e.target.value) || 1)}
                        className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 w-24"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Tests */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={testBanDevice}
                    disabled={isLoading || banInfo?.banned}
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg"
                    size="lg"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    🔒 Ban This Device
                  </Button>

                  <Button
                    onClick={testUnbanDevice}
                    disabled={isLoading || !banInfo?.banned}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white border-0 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    🔓 Unban This Device
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Permissions */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TestTube className="w-5 h-5 text-green-500" />
                  Test Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={testPostAction}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg"
                    size="lg"
                  >
                    🧪 Test Post Permission
                  </Button>

                  <Button
                    onClick={testCommentAction}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg"
                    size="lg"
                  >
                    🧪 Test Comment Permission
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-sm ${
                          result.success
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{result.action}</span>
                          <span className="text-xs opacity-70">{result.timestamp}</span>
                        </div>
                        <div className="text-xs">{result.details}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Note:</strong> This is a testing interface for the ban system.<br />
                Only authorized administrators should have access to ban/unban functionality.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}