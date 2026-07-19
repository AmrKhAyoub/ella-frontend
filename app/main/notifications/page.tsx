"use client";

import { useEffect, useState } from "react";
import { BellIcon, CheckCircle2Icon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error("Failed to load notifications");

                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // 1. New function to handle marking notifications as read
    const markAllAsRead = async () => {
        if (unreadCount === 0) return; // Prevent unnecessary API calls

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            
            // Assuming your Django endpoint expects a POST request
            const response = await fetch(`${baseUrl}/api/notifications/mark-read/`, {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                // 2. Optimistically update the UI so it feels instant
                setUnreadCount(0);
                setNotifications((prev) => 
                    prev.map((notif) => ({ ...notif, is_read: true }))
                );
            } else {
                console.error("Failed to mark notifications as read on the server.");
            }
        } catch (err) {
            console.error("Network error while marking as read:", err);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
        }).format(date);
    };

    if (loading) return <div className="text-sm text-muted-foreground animate-pulse">Loading notifications...</div>;
    if (error) return <div className="text-sm text-red-500">{error}</div>;

    return (
        <div className="flex flex-col gap-4 max-w-3xl">
            {/* Header: Unread Count + Action Button */}
            <div className="flex items-center justify-between border-b pb-4">
                <span className="text-sm font-medium">
                    You have <strong className="text-primary">{unreadCount}</strong> unread message(s)
                </span>
                
                {/* 3. The button that triggers the function */}
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
                    {notifications.map((notification) => (
                        <div 
                            key={notification.id}
                            className={`flex gap-4 p-4 border rounded-lg transition-colors ${
                                notification.is_read 
                                    ? "bg-white text-muted-foreground dark:bg-zinc-950" 
                                    : "bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900"
                            }`}
                        >
                            <div className="mt-1">
                                {notification.is_read ? (
                                    <CheckCircle2Icon className="h-5 w-5 text-zinc-400" />
                                ) : (
                                    <BellIcon className="h-5 w-5 text-blue-500" />
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <h3 className={`text-sm font-semibold ${!notification.is_read && "text-blue-900 dark:text-blue-100"}`}>
                                    {notification.title}
                                </h3>
                                <p className="text-sm">
                                    {notification.message}
                                </p>
                                <span className="text-xs text-muted-foreground mt-1">
                                    {formatDate(notification.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}