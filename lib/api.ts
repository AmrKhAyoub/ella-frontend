// src/lib/api.ts

const API_BASE_URL = "http://127.0.0.1:8000/api/assessments";

export const fetchAssessmentAPI = async <T,>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // 👇 Guarding against server-side rendering crashes
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Access token expired or invalid.");
    }
    throw new Error(data.message || data.error || "An API error occurred");
  }

  return data as T;
};