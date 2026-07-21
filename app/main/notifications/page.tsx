"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckCircle2Icon, CheckIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingSessionId, setCreatingSessionId] = useState<number | null>(
    null,
  );

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
          const latestNotif = data.notifications[0]; // Assuming [0] is the newest
          const lastNotifiedId = localStorage.getItem("lastNotifiedId");

          // Check if it's unread AND we haven't already notified the user about it
          if (
            !latestNotif.is_read &&
            latestNotif.id.toString() !== lastNotifiedId
          ) {
            if (Capacitor.isNativePlatform()) {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: latestNotif.title,
                    body: latestNotif.message,
                    id: latestNotif.id,
                    schedule: { at: new Date(Date.now() + 1000) }, // Show in 1 second
                    actionTypeId: "",
                    extra: null,
                  },
                ],
              });
            }

            // Save the ID so we don't trigger it again on the next fetch
            localStorage.setItem("lastNotifiedId", latestNotif.id.toString());
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Run this fetch on an interval (e.g., every 30 seconds)
    // to catch new notifications while the app is open.
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const baseUrl = "https://ella-v1.onrender.com";

      const response = await fetch(`${baseUrl}/api/notifications/mark-read/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true })),
        );
      } else {
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
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create dictation session");
      }

      const data = await response.json();
      const sessionId = data.session_id || data.id || data.session?.id;

      if (!sessionId) {
        throw new Error("Session ID not returned from server");
      }

      // Cache session type so sidebar clicks remember it later
      localStorage.setItem(`session_type_${sessionId}`, "dictation");

      router.push(`/main/chat?session=${sessionId}&type=dictation`);
    } catch (err) {
      console.error("Error creating dictation session:", err);
      alert("Failed to start dictation session. Please try again.");
    } finally {
      setCreatingSessionId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  if (loading)
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Loading notifications...
      </div>
    );
  if (error) return <div className="text-sm text-red-500">{error}</div>;

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Header: Unread Count + Action Button */}
      <div className="flex items-center justify-between border-b pb-4">
        <span className="text-sm font-medium">
          You have <strong className="text-primary">{unreadCount}</strong>{" "}
          unread message(s)
        </span>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-muted-foreground hover:text-foreground"
          >
            <CheckIcon className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* List of notifications */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
          No notifications yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const isCreating = creatingSessionId === notification.id;

            return (
              <div
                key={notification.id}
                onClick={() =>
                  !isCreating && handleNotificationClick(notification.id)
                }
                className={`cursor-pointer flex items-center justify-between gap-4 p-4 border rounded-lg transition-colors hover:opacity-80 ${
                  notification.is_read
                    ? "bg-white text-muted-foreground dark:bg-zinc-950"
                    : "bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900"
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div className="mt-1">
                    {notification.is_read ? (
                      <CheckCircle2Icon className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <BellIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3
                      className={`text-sm font-semibold ${
                        !notification.is_read &&
                        "text-blue-900 dark:text-blue-100"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <p className="text-sm">{notification.message}</p>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                </div>

                {isCreating && (
                  <div className="flex items-center text-blue-600 text-xs gap-1 shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
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
