function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

// Detect environment
const isDev = process.env.NODE_ENV === "development";

// Different URLs
const LOCALHOST = "http://localhost:5001";
const LOCAL_IP = "http://10.116.87.98:5001"; //  IP
const PROD_URL = "https://gym-management-system-ig7y.onrender.com"; //  deployed URL

// Decide base URL
let baseUrl = PROD_URL;

if (isDev) {
  // If running on web → localhost
  if (typeof window !== "undefined") {
    baseUrl = LOCALHOST;
  } else {
    // If running on mobile (Expo)
    baseUrl = LOCAL_IP;
  }
}

export const API_BASE_URL = trimTrailingSlash(baseUrl);
export const API_BASE_URL_WITH_API_PREFIX = `${API_BASE_URL}/api`;