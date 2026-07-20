// components/CapacitorSetup.tsx
"use client";

import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";

export function CapacitorSetup() {
  useEffect(() => {
    // Only attempt to hide the splash screen natively on a phone
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch((err) => console.error(err));
    }
  }, []);

  // This component doesn't render any UI
  return null; 
}