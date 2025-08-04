import { AlertTriangle, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BanScreenProps {
  banReason?: string;
  isTemporary?: boolean;
  expiresAt?: string;
  onRetry?: () => void;
}

export function BanScreen({ banReason, isTemporary, expiresAt, onRetry }: BanScreenProps) {
  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
    } catch {
      return null;
    }
  };

  const getTimeRemaining = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const expiration = new Date(dateString);
      const now = new Date();
      const diff = expiration.getTime() - now.getTime();
      
      if (diff <= 0) return "Expired";
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
      return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <Card className="w-full max-w-md border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-red-800 dark:text-red-200">
            Access Restricted
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            This device is currently banned from Tfess
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Ban Type Badge */}
          <div className="flex justify-center">
            <Badge variant={isTemporary ? "secondary" : "destructive"} className="flex items-center gap-1">
              {isTemporary ? (
                <>
                  <Clock className="w-3 h-3" />
                  Temporary Ban
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  Permanent Ban
                </>
              )}
            </Badge>
          </div>

          {/* Ban Reason */}
          {banReason && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Reason:</h4>
              <p className="text-sm text-red-700 dark:text-red-300">{banReason}</p>
            </div>
          )}

          {/* Expiration Info for Temporary Bans */}
          {isTemporary && expiresAt && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-center">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  {getTimeRemaining(expiresAt)}
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Expires: {formatExpirationDate(expiresAt)}
                </p>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">About Device Bans</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Bans are tied to your device, not personal information</li>
              <li>• We maintain complete user anonymity</li>
              <li>• Appeals can be submitted to Tfess support</li>
              {isTemporary && <li>• Temporary bans expire automatically</li>}
            </ul>
          </div>

          {/* Retry Button for Temporary Bans */}
          {isTemporary && onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              Check Ban Status
            </Button>
          )}

          {/* Support Information */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For appeals or questions, contact Tfess support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for showing access denied messages in modals/forms
export function AccessDeniedMessage({ 
  banReason, 
  isTemporary, 
  compact = false 
}: { 
  banReason?: string; 
  isTemporary?: boolean; 
  compact?: boolean; 
}) {
  if (compact) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <Shield className="w-4 h-4" />
          <span className="font-medium text-sm">Access Denied</span>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {banReason || "This device is banned from performing this action"}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
              Action Not Allowed
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              {banReason || "This device is currently banned from Tfess"}
            </p>
            <Badge variant={isTemporary ? "secondary" : "destructive"} className="text-xs">
              {isTemporary ? "Temporary Ban" : "Permanent Ban"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}