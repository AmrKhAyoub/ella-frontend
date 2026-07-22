"use client";

import * as React from "react";
import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { useUpdateLocation } from "@/app/hooks/useUpdateLocation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  GalleryVerticalEndIcon,
  BotIcon,
  BookOpenIcon,
  ListCheckIcon,
  Gamepad,
  Settings,
  MessageCircleCheckIcon,
  UserIcon,
  MessageSquareIcon,
  Trash2Icon,
  Loader2Icon,
  TicketsIcon,
  SearchIcon,
  MapPinIcon,
} from "lucide-react";

const API_BASE_URL = "https://ella-v1.onrender.com";

const data = {
  teams: [
    {
      name: "Ella Ai",
      logo: <GalleryVerticalEndIcon />,
      plan: "Your language companion",
    },
  ],
  navMain: [
    {
      title: "New Chat",
      url: "/main/chat",
      icon: <MessageCircleCheckIcon />,
      isActive: true,
    },
    {
      title: "Notifications",
      url: "/main/notifications",
      icon: <BotIcon />,
    },
    {
      title: "Analytics",
      url: "/main/analyticsandmistakes",
      icon: <TicketsIcon />,
    },
    {
      title: "Tests & Questions",
      url: "/main/questions",
      icon: <BookOpenIcon />,
    },
    {
      title: "My Vocabulary",
      url: "/main/vocabulary",
      icon: <ListCheckIcon />,
    },
    {
      title: "My Assessment",
      url: "/main/assessment",
      icon: <UserIcon />,
    },
  ],
  Game: [
    {
      name: "Word Hunt Game",
      url: "/main/HunterGame",
      icon: <Gamepad />,
    },
    {
      name: "Game settings",
      url: "/main/gameSettings",
      icon: <Settings />,
    },
  ],
};

interface ChatSession {
  id: string;
  topic: string;
  created_at: string;
}

// Helper: Group sessions into ChatGPT / Claude style relative time categories
function groupSessionsByTime(sessions: ChatSession[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const last7DaysStart = new Date(todayStart);
  last7DaysStart.setDate(last7DaysStart.getDate() - 7);

  const last30DaysStart = new Date(todayStart);
  last30DaysStart.setDate(last30DaysStart.getDate() - 30);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Previous 30 Days", items: [] },
    { label: "Older", items: [] },
  ];

  sessions.forEach((session) => {
    const sessionDate = new Date(session.created_at || Date.now());

    if (sessionDate >= todayStart) {
      groups[0].items.push(session);
    } else if (sessionDate >= yesterdayStart) {
      groups[1].items.push(session);
    } else if (sessionDate >= last7DaysStart) {
      groups[2].items.push(session);
    } else if (sessionDate >= last30DaysStart) {
      groups[3].items.push(session);
    } else {
      groups[4].items.push(session);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

function AppSidebarContent({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get("session");

  const {
    updateLocation,
    isUpdating,
    isSimulating,
    startSimulation,
    stopSimulation,
  } = useUpdateLocation();

  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    avatar: "",
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLocationTools, setShowLocationTools] = useState(false);

  const fetchSessions = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setLoadingSessions(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/sessions/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const sessionsData = await res.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const profileData = await res.json();
          setUserProfile({
            name: profileData.username,
            email: profileData.email,
            avatar: profileData.avatar || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile in sidebar:", error);
      }
    }

    fetchProfile();
    fetchSessions();

    const handleRefreshSessions = () => fetchSessions();
    window.addEventListener("refresh-sessions", handleRefreshSessions);

    return () => {
      window.removeEventListener("refresh-sessions", handleRefreshSessions);
    };
  }, []);

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    // Optimistic UI update
    const previousSessions = [...sessions];
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/sessions/${sessionId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete session");
      }
    } catch (error) {
      console.error(error);
      setSessions(previousSessions);
    }
  };

  // Filtered and grouped sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    return sessions.filter((s) =>
      (s.topic || "New Conversation").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  const groupedSessions = useMemo(() => {
    return groupSessionsByTime(filteredSessions);
  }, [filteredSessions]);

  return (
    <Sidebar collapsible="icon" {...props} className="flex flex-col h-full border-r">
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto px-1 space-y-2">
        <NavMain items={data.navMain} />
        <NavProjects projects={data.Game} />

        {/* RECENT CHATS SECTION */}
        <SidebarGroup className="mt-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Recent Chats
            </SidebarGroupLabel>
          </div>

          {/* Quick Search Filter (Only show if multiple sessions exist) */}
          {sessions.length > 5 && (
            <div className="relative px-2 mb-3">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs bg-sidebar-accent/50 border-none focus-visible:ring-1 focus-visible:ring-sidebar-ring rounded-md"
              />
            </div>
          )}

          {/* LOADING STATE */}
          {loadingSessions ? (
            <div className="space-y-2 px-2 py-1">
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-7 w-[80%] rounded-md" />
            </div>
          ) : sessions.length === 0 ? (
            /* EMPTY STATE */
            <div className="text-center py-6 px-4">
              <MessageSquareIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground font-medium">No recent chats</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Start a new conversation above!
              </p>
            </div>
          ) : groupedSessions.length === 0 ? (
            /* NO SEARCH RESULTS */
            <div className="text-xs text-muted-foreground px-4 py-3 text-center">
              No chats matching "{searchQuery}"
            </div>
          ) : (
            /* GROUPED SESSION LIST */
            <div className="space-y-4">
              {groupedSessions.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-3 text-[11px] font-medium text-muted-foreground/70">
                    {group.label}
                  </div>
                  <SidebarMenu>
                    {group.items.map((session) => {
                      const isActive = currentSessionId === String(session.id);

                      return (
                        <SidebarMenuItem key={session.id} className="group relative">
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={`h-8 px-2.5 text-xs rounded-md transition-colors ${
                              isActive
                                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                            }`}
                          >
                            <Link
                              href={`/main/chat?session=${session.id}`}
                              className="flex items-center gap-2.5 w-full pr-6"
                            >
                              <MessageSquareIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate flex-1">
                                {session.topic || "New Conversation"}
                              </span>
                            </Link>
                          </SidebarMenuButton>

                          {/* Hover Delete Action Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete chat"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </button>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </div>
              ))}
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER SECTION */}
      <SidebarFooter className="border-t border-sidebar-border pt-2 space-y-2">
        <NavUser user={userProfile} />

        {/* Collapsible/Compact Location Debugging Tools */}
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => setShowLocationTools(!showLocationTools)}
            className="flex items-center justify-between w-full text-[11px] text-muted-foreground hover:text-foreground py-1 px-2 rounded hover:bg-sidebar-accent/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-3 w-3" />
              Location Settings
            </span>
            <span className="text-[10px]">{showLocationTools ? "Hide" : "Show"}</span>
          </button>

          {showLocationTools && (
            <div className="mt-2 space-y-1.5 pt-1 border-t border-sidebar-border/50">
              <Button
                onClick={updateLocation}
                disabled={isUpdating || isSimulating}
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs justify-center"
              >
                {isUpdating && !isSimulating ? "Updating..." : "Update Location"}
              </Button>

              <Button
                onClick={isSimulating ? stopSimulation : startSimulation}
                variant={isSimulating ? "destructive" : "secondary"}
                size="sm"
                className="w-full h-7 text-xs justify-center"
              >
                {isSimulating ? "Stop Simulation" : "Simulate Location (30s)"}
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Suspense
      fallback={
        <Sidebar collapsible="icon" {...props} className="flex flex-col h-full border-r">
          <div className="flex h-full items-center justify-center p-4">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </Sidebar>
      }
    >
      <AppSidebarContent {...props} />
    </Suspense>
  );
}