// components/MapImplementation.tsx
"use client";

import { useState } from "react";
import Map, { 
  Marker, 
  NavigationControl, 
  GeolocateControl, 
  FullscreenControl 
} from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";

// Required CSS stylesheet
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapImplementation() {
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-border shadow-xl">
        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude: 2.3522,
            latitude: 48.8566,
            zoom: 12,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        >
          {/* Built-in Controls */}
          <FullscreenControl position="top-right" />
          <NavigationControl position="top-right" showCompass showZoom />
          
          {/*
            GeolocateControl manages browser permissions, high-accuracy GPS, 
            and renders the pulsing location dot on the canvas natively.
          */}
          <GeolocateControl
            position="bottom-right"
            trackUserLocation={true}
            showAccuracyCircle={true}
            showUserLocation={true}
            onGeolocate={(e) => {
              setUserLocation({
                lng: e.coords.longitude,
                lat: e.coords.latitude,
              });
            }}
          />

          {/* Example Custom Marker */}
          <Marker longitude={2.3600} latitude={48.8600} anchor="bottom">
            <div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
              <div className="bg-red-500 px-3 py-1 text-[10px] font-bold text-white rounded-md shadow-lg mb-1 uppercase tracking-wider">
                Target
              </div>
              <div className="w-4 h-4 bg-red-600 border-2 border-white rounded-full shadow-md animate-bounce" />
            </div>
          </Marker>
        </Map>
      </div>

      {userLocation && (
        <div className="rounded-lg bg-muted p-4 text-sm font-mono border">
          <span className="text-blue-500 font-bold">Hunter GPS Locked:</span>{" "}
          {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}