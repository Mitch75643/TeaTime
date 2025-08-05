import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, AlertTriangle, Shield, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";

interface SpamStats {
  totalDetections: number;
  recentDetections: number;
  blockedSessions: number;
  throttledSessions: number;
  detectionsByType: Record<string, number>;
  topViolationReasons: Array<{ reason: string; count: number }>;
}

interface SpamViolation {
  sessionId: string;
  timestamp: number;
  violationType: string;
  reason: string;
  action: string;
  severity: string;
  contentType: string;
}

export default function AdminSpamStats() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/admin/spam/stats", refreshKey],
    queryFn: async () => {
      const response = await fetch("/api/admin/spam/stats", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch spam stats");
      return response.json() as Promise<SpamStats>;
    },
    enabled: process.env.NODE_ENV === 'development'
  });

  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ["/api/admin/spam/violations", refreshKey],
    queryFn: async () => {
      const response = await fetch("/api/admin/spam/violations?limit=20", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch violations");
      return response.json() as Promise<SpamViolation[]>;
    },
    enabled: process.env.NODE_ENV === 'development'
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block': return 'destructive';
      case 'throttle': return 'secondary';
      case 'warn': return 'outline';
      default: return 'outline';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              Spam monitoring is only available in development mode.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Spam Detection Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor and analyze spam detection patterns
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {statsError ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load spam statistics</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Detections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalDetections ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recent (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {statsLoading ? "..." : stats?.recentDetections ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Blocked Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {statsLoading ? "..." : stats?.blockedSessions ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Throttled Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {statsLoading ? "..." : stats?.throttledSessions ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Violations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Violations
            </CardTitle>
            <CardDescription>
              Latest spam detection incidents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {violationsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading violations...</div>
              ) : violations && violations.length > 0 ? (
                <div className="space-y-3">
                  {violations.map((violation, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <Badge variant={getActionColor(violation.action)}>
                            {violation.action}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {violation.contentType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {format(new Date(violation.timestamp), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {violation.violationType}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {violation.reason}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Session: {violation.sessionId.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No violations detected recently
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detection Patterns */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Detection Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.detectionsByType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Violation Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topViolationReasons?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.reason}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}