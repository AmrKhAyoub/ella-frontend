// src/lib/api.ts

const API_BASE_URL = "https://ella-v1.onrender.com";

export const fetchAssessmentAPI = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  // Guarding against server-side rendering crashes
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Ensure leading slash and prefix consistency
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE_URL}/api/assessments${cleanEndpoint}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Access token expired or invalid.");
    }
    // Surface the actual backend error message instead of generic catch block
    throw new Error(
      data.message || data.error || `Server error: ${response.status}`,
    );
  }

  return data as T;
};
