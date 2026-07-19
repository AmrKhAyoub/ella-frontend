"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";
import type {
  BackgroundGeolocationPlugin,
  Location,
} from "@capacitor-community/background-geolocation";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

export async function StartBackgroundTracking() {
  if (typeof window === "undefined" || Capacitor.getPlatform() === "web") {
    console.info("Background location tracking is only available on mobile apps.");
    return null;
  }

  try {
    const watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage:
          "Ella AI is tracking your location to provide better assistance.",
        backgroundTitle: "Location Tracking Active",
        requestPermissions: true,
        stale: false,
        distanceFilter: 500,
      },
      (location: Location | undefined, error: any) => {
        if (error) {
          console.error("Location error:", error);
          return;
        }

        if (location) {
          console.log(
            "New location received:",
            location.latitude,
            location.longitude,
          );
          void sendLocationToBackend(location);
        } else {
          console.log(
            "Location is undefined (GPS might be disabled or unavailable)",
          );
          void sendLocationToBackend(null);
        }
      },
    );

    return watcherId;
  } catch (err) {
    console.error("Failed to start watcher:", err);
    return null;
  }
}

async function sendLocationToBackend(location: Location | null | undefined) {
  try {
    await fetch("http://127.0.0.1:8000/api/update-location/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to send location to backend:", error);
  }
}

export function BackgroundTrackingInitializer() {
  useEffect(() => {
    void StartBackgroundTracking();
  }, []);

  return null;
}
