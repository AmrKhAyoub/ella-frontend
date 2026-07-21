"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; // <-- Added to track active URL

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { useUpdateLocation } from "@/app/hooks/useUpdateLocation";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
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
      // Clicking this triggers a blank slate "New Chat"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // --- ADDED: Track active session from URL ---
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

  // --- REUSABLE fetchSessions function ---
  const fetchSessions = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

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

    // --- ADDED: Listen for the custom event to refresh sessions instantly ---
    const handleRefreshSessions = () => {
      fetchSessions();
    };
    window.addEventListener("refresh-sessions", handleRefreshSessions);

    return () => {
      window.removeEventListener("refresh-sessions", handleRefreshSessions);
    };
  }, []);

  const handleDeleteSession = async (sessionId: string) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    const previousSessions = [...sessions];
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chats/sessions/${sessionId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to delete session");
      }
    } catch (error) {
      console.error(error);
      setSessions(previousSessions);
      alert("Failed to delete the chat. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Sidebar collapsible="icon" {...props} className="flex flex-col h-full">
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto">
          <NavMain items={data.navMain} />
          <NavProjects projects={data.Game} />

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>

            {loadingSessions ? (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                <span className="text-xs">Loading sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-xs text-gray-400 px-4 py-2">
                No recent chats found.
              </div>
            ) : (
              <SidebarMenu>
                {sessions.map((session) => {
                  // --- ADDED: Check if this session is the active one ---
                  const isActive = currentSessionId === String(session.id);

                  return (
                    <SidebarMenuItem
                      key={session.id}
                      className="group relative"
                    >
                      {/* --- ADDED: Pass isActive prop to Shadcn's SidebarMenuButton --- */}
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="pr-8 h-auto"
                      >
                        <Link
                          href={`/main/chat?session=${session.id}`}
                          className="flex flex-col items-start gap-0.5 py-2"
                        >
                          <div className="flex items-center w-full gap-2">
                            <MessageSquareIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate font-medium text-sm">
                              {session.topic || "New Conversation"}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 pl-6 w-full truncate">
                            {formatDate(session.created_at)}
                          </span>
                        </Link>
                      </SidebarMenuButton>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteSession(session.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userProfile} />

        <div className="p-2 flex flex-col gap-2">
          <Button
            onClick={updateLocation}
            disabled={isUpdating || isSimulating}
            variant="outline"
            className="w-full"
          >
            {isUpdating && !isSimulating ? "Updating..." : "Update Location"}
          </Button>

          <Button
            onClick={isSimulating ? stopSimulation : startSimulation}
            variant={isSimulating ? "destructive" : "secondary"}
            className="w-full"
          >
            {isSimulating ? "Stop Simulation" : "Simulate Location (30s)"}
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
