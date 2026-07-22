"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BellIcon, 
  CheckCircle2Icon, 
  CheckIcon, 
  Loader2, 
  BellRingIcon,
  SparklesIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Helper: Format dates like modern apps (e.g., "2m ago", "1h ago", "Yesterday")
function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  
  return new Intl.DateTimeFormat("en-US", { 
    month: "short", 
    day: "numeric" 
  }).format(date);
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingSessionId, setCreatingSessionId] = useState<number | null>(null);

  const router = useRouter();

  // 1. Request Native Notification Permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== "granted") {
          await LocalNotifications.requestPermissions();
        }
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You must be logged in to view notifications.");
        setLoading(false);
        return;
      }

      try {
        const baseUrl = "https://ella-v1.onrender.com";
        const response = await fetch(`${baseUrl}/api/notifications/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to load notifications");

        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);

        // 2. Trigger Native Notification for the newest unread message
        if (data.notifications.length > 0) {
          const latestNotif = data.notifications[0];
          const lastNotifiedId = localStorage.getItem("lastNotifiedId");

          if (!latestNotif.is_read && latestNotif.id.toString() !== lastNotifiedId) {
            if (Capacitor.isNativePlatform()) {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: latestNotif.title,
                    body: latestNotif.message,
                    id: latestNotif.id,
                    schedule: { at: new Date(Date.now() + 1000) },
                    actionTypeId: "",
                    extra: null,
                  },
                ],
              });
            }
            localStorage.setItem("lastNotifiedId", latestNotif.id.toString());
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Optimistic UI update
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, is_read: true }))
    );

    try {
      const baseUrl = "https://ella-v1.onrender.com";
      const response = await fetch(`${baseUrl}/api/notifications/mark-read/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to mark notifications as read on the server.");
      }
    } catch (err) {
      console.error("Network error while marking as read:", err);
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setCreatingSessionId(notificationId);

    try {
      const baseUrl = "https://ella-v1.onrender.com";
      const response = await fetch(
        `${baseUrl}/api/chats/sessions/dictation/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notification_id: notificationId }),
        }
      );

      if (!response.ok) throw new Error("Failed to create dictation session");

      const data = await response.json();
      const sessionId = data.session_id || data.id || data.session?.id;

      if (!sessionId) throw new Error("Session ID not returned from server");

      localStorage.setItem(`session_type_${sessionId}`, "dictation");
      router.push(`/main/chat?session=${sessionId}&type=dictation`);
    } catch (err) {
      console.error("Error creating dictation session:", err);
      alert("Failed to start dictation session. Please try again.");
    } finally {
      setCreatingSessionId(null);
    }
  };

  // --- RENDERING STATES ---

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto border rounded-xl bg-destructive/5 text-destructive">
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 transition-all">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            <CheckIcon className="mr-1.5 h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-xl bg-card">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 border-dashed">
          <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <BellRingIcon className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">You're all caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            No new notifications right now. Check back later for updates and practice reminders.
          </p>
        </div>
      ) : (
        /* Notification List */
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const isCreating = creatingSessionId === notification.id;
            const isUnread = !notification.is_read;

            return (
              <div
                key={notification.id}
                onClick={() => !isCreating && handleNotificationClick(notification.id)}
                className={`relative group flex gap-4 p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                  isUnread
                    ? "bg-blue-50/40 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900 hover:shadow-sm"
                    : "bg-card hover:bg-accent/40 hover:border-border/80 text-muted-foreground"
                } ${isCreating ? "opacity-70 pointer-events-none" : ""}`}
              >
                {/* Unread dot indicator */}
                {isUnread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
                )}

                {/* Icon Container */}
                <div className="mt-0.5 shrink-0 relative">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isUnread 
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" 
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {isUnread ? <SparklesIcon className="h-5 w-5" /> : <CheckCircle2Icon className="h-5 w-5 opacity-70" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className={`text-sm font-medium truncate ${isUnread ? "text-foreground" : ""}`}>
                      {notification.title}
                    </h3>
                    <span className="text-[11px] whitespace-nowrap text-muted-foreground shrink-0 mt-0.5">
                      {getRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  
                  <p className={`text-sm line-clamp-2 pr-4 ${isUnread ? "text-muted-foreground" : "text-muted-foreground/80"}`}>
                    {notification.message}
                  </p>
                </div>

                {/* Loading Spinner Overlay */}
                {isCreating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-blue-600 text-xs font-medium bg-background/80 px-2 py-1 rounded backdrop-blur-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}