"use client";

import { useEffect, useState } from "react";
import { Bell, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  unread_count: number;
  notifications: NotificationItem[];
}

export function NotificationsList() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);

        if (!response.ok) {
          throw new Error("Failed to load notifications");
        }

        const data: NotificationsResponse = await response.json();
        setItems(data.notifications ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading notifications...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
        <Bell className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {items.map((item) => (
        <Card key={item.id} className={item.is_read ? "border-border/60" : "border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20"}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {!item.is_read ? <Circle className="size-2.5 fill-emerald-500 text-emerald-500" /> : null}
                <CardTitle className="text-base">{item.title}</CardTitle>
              </div>
              {!item.is_read ? <Badge variant="secondary">New</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p className="text-sm text-muted-foreground">{item.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
