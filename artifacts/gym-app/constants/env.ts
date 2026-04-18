function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

if (!rawApiBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in gym-app environment variables.");
}

export const API_BASE_URL = trimTrailingSlash(rawApiBaseUrl);
export const API_BASE_URL_WITH_API_PREFIX = `${API_BASE_URL}/api`;
