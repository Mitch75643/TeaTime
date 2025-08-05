import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import * as React from "react";
import { Alert, AlertDescription } from "./alert";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface SpamWarningProps {
  message: string;
  severity?: 'low' | 'medium' | 'high';
  onDismiss?: () => void;
  className?: string;
}

export function SpamWarning({ message, severity = 'medium', onDismiss, className }: SpamWarningProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const severityStyles = {
    low: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
    medium: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
    high: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
  };

  return (
    <Alert className={cn(
      "border-l-4 shadow-sm animate-in slide-in-from-top-2 duration-300",
      severityStyles[severity],
      className
    )}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1 text-sm font-medium">{message}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 ml-2 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Dismiss warning</span>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Toast-style spam warning that appears temporarily
export function SpamWarningToast({ message, severity = 'medium', duration = 5000 }: {
  message: string;
  severity?: 'low' | 'medium' | 'high';
  duration?: number;
}) {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const severityStyles = {
    low: "border-yellow-400 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200",
    medium: "border-orange-400 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-900/40 dark:text-orange-200",
    high: "border-red-400 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200"
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className={cn(
        "rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-4 duration-300",
        severityStyles[severity]
      )}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{message}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}