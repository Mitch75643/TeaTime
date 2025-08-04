import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BanNoticeProps {
  banReason?: string;
  isTemporary?: boolean;
  expiresAt?: string;
}

export function BanNotice({ banReason, isTemporary, expiresAt }: BanNoticeProps) {
  return (
    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertDescription className="text-red-800 dark:text-red-200">
        <div className="space-y-2">
          <p className="font-medium">🔕 You've been banned from posting on Tfess.</p>
          <p className="text-sm">
            If you think this was a mistake, please wait for your ban to expire or contact support.
          </p>
          {isTemporary && expiresAt && (
            <p className="text-xs text-red-600 dark:text-red-400">
              This is a temporary ban that expires on {new Date(expiresAt).toLocaleDateString()}.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}