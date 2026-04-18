import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { secureStorage } from "@/services/secureStorage";
import { API_BASE_URL } from "@/constants/env";

export interface Admin {
  _id: string;
  fullName: string;
  email: string;
  gymName: string;
  gymAddress?: string;
  gymPhone?: string;
  gymLogo?: string;
}

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  accessToken: string | null;
  login: (accessToken: string, refreshToken: string, admin: Admin) => Promise<void>;
  logout: () => Promise<void>;
  updateAdmin: (admin: Partial<Admin>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await secureStorage.deleteItem("accessToken");
    await secureStorage.deleteItem("refreshToken");
    setAdmin(null);
    setAccessToken(null);
  }, []);

  const login = useCallback(async (token: string, refreshToken: string, adminData: Admin) => {
    await secureStorage.setItem("accessToken", token);
    await secureStorage.setItem("refreshToken", refreshToken);
    setAdmin(adminData);
    setAccessToken(token);
  }, []);

  const updateAdmin = useCallback((updates: Partial<Admin>) => {
    setAdmin((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  useEffect(() => {
    async function loadAuth() {
      try {
        const token = await secureStorage.getItem("accessToken");
        const refresh = await secureStorage.getItem("refreshToken");

        if (!token && !refresh) {
          setIsLoading(false);
          return;
        }

        if (token) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const data = await response.json();
              setAdmin(data.data);
              setAccessToken(token);
              setIsLoading(false);
              return;
            }
          } catch {}
        }

        if (refresh) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: refresh }),
            });
            if (response.ok) {
              const data = await response.json();
              await secureStorage.setItem("accessToken", data.data.accessToken);
              await secureStorage.setItem("refreshToken", data.data.refreshToken);
              setAdmin(data.data.admin);
              setAccessToken(data.data.accessToken);
            } else {
              await logout();
            }
          } catch {
            await logout();
          }
        } else {
          await logout();
        }
      } catch {
        await logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadAuth();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ admin, isLoading, accessToken, login, logout, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
