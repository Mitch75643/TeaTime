import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface NotificationLinkProps {
  className?: string;
}

export function NotificationLink({ className = "" }: NotificationLinkProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation('/settings');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <Settings className="h-3 w-3 mr-1" />
      Manage your notifications in Settings →
    </Button>
  );
}