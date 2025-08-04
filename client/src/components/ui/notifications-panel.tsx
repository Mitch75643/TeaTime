import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { Bell, MessageCircle, User, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

interface NotificationsPanelProps {
  className?: string;
}

export function NotificationsPanel({ className }: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = unreadData?.count || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to the post/comment
    if (notification.postId) {
      setLocation(`/?focus=${notification.postId}`);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative p-2 rounded-full hover:bg-white/10 transition-colors text-white w-10 h-10 mr-1",
            className
          )}
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] max-h-[80vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 mt-4 min-h-0">
          <ScrollArea className="flex-1 pr-2 -mr-2">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">You're all caught up! 🍵</p>
                <p className="text-sm text-gray-400 mt-1">No new notifications to show</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      notification.isRead
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-purple-200 shadow-sm"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        notification.type === 'post_reply'
                          ? "bg-gradient-to-br from-blue-400 to-purple-500"
                          : "bg-gradient-to-br from-green-400 to-blue-500"
                      )}>
                        {notification.type === 'post_reply' ? (
                          <MessageCircle className="h-4 w-4 text-white" />
                        ) : (
                          <User className="h-4 w-4 text-white" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-relaxed",
                          notification.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                        )}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt!), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}