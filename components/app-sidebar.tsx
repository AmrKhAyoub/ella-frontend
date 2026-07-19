"use client";

import * as React from "react";
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
} from "lucide-react";

const data = {
  user: {
    name: "Development Account",
    email: "dev@example.com",
    avatar: "",
  },
  teams: [
    {
      name: "Ella Ai",
      logo: <GalleryVerticalEndIcon />,
      plan: "Your language companion",
    },
  ],
  navMain: [
    {
      title: "Chat",
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { 
    updateLocation, 
    isUpdating, 
    isSimulating, 
    startSimulation, 
    stopSimulation 
  } = useUpdateLocation();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.Game} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
        {/* Footer actions area */}
        <div className="p-2 flex flex-col gap-2">
            {/* 1. Original Manual Location Update Button */}
            <Button 
                onClick={updateLocation} 
                disabled={isUpdating || isSimulating}
                variant="outline"
                className="w-full"
            >
                {isUpdating && !isSimulating ? "Updating..." : "Update Location"}
            </Button>

            {/* 2. New Simulation Button */}
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