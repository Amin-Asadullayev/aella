import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { LoginResponse, RegisterResponse, MeResponse, TokenResponse, User, AuthContextType } from "../types/api";

const AuthContext = createContext<AuthContextType | null>(null);

const API = "http://localhost:3141/api/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restore() {
      try {
        const [meRes, tokenRes] = await Promise.all([
          fetch(`${API}/me`, { credentials: "include" }),
          fetch(`${API}/token`, { credentials: "include" }),
        ]);

        if (meRes.ok && tokenRes.ok) {
          const meData: MeResponse = await meRes.json();
          const tokenData: TokenResponse = await tokenRes.json();

          if (meData.success && tokenData.success) {
            setUser(meData.data.user);
            setToken(tokenData.data.token);
            setPassphrase(sessionStorage.getItem("pp"));
          }
        }
      } finally {
        setLoading(false);
      }
    }

    restore();
  }, []);

  async function login(emailOrName: string, password: string): Promise<User> {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emailOrName, password }),
    });

    const data: LoginResponse = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }

    const tokenRes = await fetch(`${API}/token`, {
      credentials: "include",
    });

    const tokenData: TokenResponse = await tokenRes.json();

    if (!tokenData.success) {
      throw new Error(tokenData.message);
    }

    setUser(data.data.user);
    setToken(tokenData.data.token);
    setPassphrase(password);

    sessionStorage.setItem("pp", password);

    window.location.href = "/";

    return data.data.user;
  }

  async function register(
    username: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data: RegisterResponse = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Registration failed");
    }

    return data;
  }

  function logout(): void {
    setUser(null);
    setToken(null);
    setPassphrase(null);
    sessionStorage.removeItem("pp");
  }

  return (
    <AuthContext.Provider
      value={{ user, token, passphrase, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}