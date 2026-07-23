// /main/HunterGame/page.tsx
"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapImplementation"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-2xl bg-muted/30 animate-pulse flex items-center justify-center border shadow-xl">
      <div className="text-sm text-muted-foreground font-medium">Loading Map Engine...</div>
    </div>
  ),
});

export default function HunterGamePage() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Hunter Game Dashboard</h1>
      <MapComponent />
    </main>
  );
}