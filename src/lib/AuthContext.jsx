import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API = "http://localhost:3141/api/auth";
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); const [token, setToken] = useState(null); const [passphrase, setPassphrase] = useState(null); const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function restore() {
            try {
                const [meRes, tokenRes] = await Promise.all([
                    fetch(`${API}/me`, { credentials: "include" }),
                    fetch(`${API}/token`, { credentials: "include" }),
                ]);
                if (meRes.ok && tokenRes.ok) {
                    const meData = await meRes.json();
                    const tokenData = await tokenRes.json();
                    setUser(meData);
                    setToken(tokenData.token);
                    setPassphrase(sessionStorage.getItem("pp"));
                }
            } catch {
            } finally {
                setLoading(false);
            }
        }

        restore();
    }, []);

    async function login(emailOrName, password) {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ emailOrName, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        const tokenRes = await fetch(`${API}/token`, { credentials: "include" });
        const tokenData = await tokenRes.json();
        console.log(tokenData)
        setUser(data.user);
        setToken(tokenData.token);
        setPassphrase(password);
        sessionStorage.setItem("pp", password);
        window.location.href = "/";
        return data.user;
    }

    async function register(username, email, password) {
        const res = await fetch(`${API}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        return data;
    }

    function logout() {
        setUser(null);
        setToken(null);
        setPassphrase(null);
        sessionStorage.removeItem("pp");
    }

    return (
        <AuthContext.Provider value={{ user, token, passphrase, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
