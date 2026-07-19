import { useEffect, useState, useCallback, useRef } from "react";

// 30 seconds interval constant (in milliseconds)
const SIMULATION_INTERVAL_MS = 30000; 

// 5 dummy coordinate presets
const DUMMY_LOCATIONS = [
    { name: "Paris, France", latitude: 48.8566, longitude: 2.3522 },
    { name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
    { name: "New York, USA", latitude: 40.7128, longitude: -74.0060 },
    { name: "Sydney, Australia", latitude: -33.8688, longitude: 151.2093 },
    { name: "Cairo, Egypt", latitude: 30.0444, longitude: 31.2357 }
];

export function useUpdateLocation() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Core helper to send coordinates to the API
    const sendLocationToAPI = useCallback(async (coords: { latitude?: number; longitude?: number } = {}) => {
        setIsUpdating(true);
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
            setIsUpdating(false);
            return;
        }

        try {
            const baseUrl = "https://ella-v1.onrender.com";
            
            const response = await fetch(`${baseUrl}/api/update-location/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(coords) 
            });

            if (!response.ok) {
                console.error("Failed to update location. Status:", response.status);
            } else {
                console.log(`Location updated successfully! Coordinates:`, coords);
            }
        } catch (error) {
            console.error("API connection error while updating location:", error);
        } finally {
            setIsUpdating(false);
        }
    }, []);

    // 1. Manual update (Original button behavior)
    const updateLocation = useCallback(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    sendLocationToAPI({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn("Geolocation denied/failed. Falling back to IP.", error.message);
                    sendLocationToAPI({}); 
                },
                { timeout: 10000 }
            );
        } else {
            sendLocationToAPI({}); 
        }
    }, [sendLocationToAPI]);

    // Helper to send a random dummy location
    const sendRandomDummyLocation = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * DUMMY_LOCATIONS.length);
        const randomLocation = DUMMY_LOCATIONS[randomIndex];
        
        console.log(`[Simulation Mode] Sending: ${randomLocation.name}`);
        sendLocationToAPI({
            latitude: randomLocation.latitude,
            longitude: randomLocation.longitude
        });
    }, [sendLocationToAPI]);

    // Start / Stop Simulation controls
    const startSimulation = useCallback(() => {
        setIsSimulating(true);
        // Send the first location instantly when the simulation starts
        sendRandomDummyLocation();
    }, [sendRandomDummyLocation]);

    const stopSimulation = useCallback(() => {
        setIsSimulating(false);
    }, []);

    // Effect to manage the active simulation interval
    useEffect(() => {
        if (isSimulating) {
            intervalRef.current = setInterval(() => {
                sendRandomDummyLocation();
            }, SIMULATION_INTERVAL_MS);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        // Cleanup on unmount or state change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isSimulating, sendRandomDummyLocation]);

    // Run automatically when the layout/page mounts
    useEffect(() => {
        updateLocation();
    }, [updateLocation]);

    return { 
        updateLocation, 
        isUpdating, 
        isSimulating, 
        startSimulation, 
        stopSimulation 
    };
}