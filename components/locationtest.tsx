// Define two distinct test coordinates
const COORDINATE_A = { latitude: 40.7128, longitude: -74.0060 }; // e.g., NYC
const COORDINATE_B = { latitude: 34.0522, longitude: -118.2437 }; // e.g., LA

export async function runTimedLocationTest() {
  const DJANGO_ENDPOINT = "http://127.0.0.1:8000/api/update-location/";

  // Helper function to handle the raw HTTP post
  const sendLocation = async (coords: { latitude: number; longitude: number }, testLabel: string) => {
    try {
      
      
      const response = await fetch(DJANGO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(coords), // Sending only lat and long
      });

      if (response.ok) {
        const data = await response.json();
      } else {
      }
    } catch (error) {
    }
  };

  // 1. Send the first coordinate immediately
  await sendLocation(COORDINATE_A, "BATCH 1/2");

  // 2. Start the 30-second countdown
  console.log("⏱️ Waiting 30 seconds before firing the next location tracking payload...");
  
  await new Promise((resolve) => setTimeout(resolve, 30000)); // 30,000 milliseconds = 30 seconds

  // 3. Send the second coordinate after the timer finishes
  await sendLocation(COORDINATE_B, "BATCH 2/2");
  
  console.log("🏁 Timed location test sequence complete.");
}