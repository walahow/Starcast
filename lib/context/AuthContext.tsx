'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, ApiUser } from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  loading: boolean;
  logoutLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; address?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("starcast_token");
    const savedUser = localStorage.getItem("starcast_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem("starcast_token", data.token);
    localStorage.setItem("starcast_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (regData: { name: string; email: string; password: string; phone?: string; address?: string }) => {
    const data = await authApi.register(regData);
    localStorage.setItem("starcast_token", data.token);
    localStorage.setItem("starcast_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setLogoutLoading(true);
    localStorage.removeItem("starcast_token");
    localStorage.removeItem("starcast_user");
    localStorage.removeItem("starcast_cart_guest");
    localStorage.removeItem("starcast_cart");
    setToken(null);
    setUser(null);
    setLogoutLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        logoutLoading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
