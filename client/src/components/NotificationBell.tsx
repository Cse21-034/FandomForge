import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_video":
        return "bg-blue-50 dark:bg-blue-900";
      case "new_subscriber":
        return "bg-green-50 dark:bg-green-900";
      case "new_comment":
        return "bg-purple-50 dark:bg-purple-900";
      case "new_message":
        return "bg-pink-50 dark:bg-pink-900";
      case "subscription_expiring":
        return "bg-yellow-50 dark:bg-yellow-900";
      default:
        return "bg-slate-50 dark:bg-slate-900";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount?.count > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount.count > 9 ? "9+" : unreadCount.count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length === 0 ? (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
              No notifications
            </div>
          ) : (
            notifications.map((notif: any) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg ${getNotificationColor(notif.type)} ${
                  !notif.isRead ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notif.content}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {format(new Date(notif.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notif.id)}
                      className="ml-2 text-blue-500 hover:text-blue-700 transition"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
