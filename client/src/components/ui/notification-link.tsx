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

  return null;
}