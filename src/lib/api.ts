import type { RegisterResponse, LoginResponse, MeResponse } from "../types/api";

const API_URL = "http://localhost:3141/api/auth";

export async function register(username: string, email: string, password: string) : Promise<RegisterResponse> {
    const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
    });

    return res.json();
}

export async function login(emailOrName: string, password: string) : Promise<LoginResponse> {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ emailOrName, password })
    });

    return res.json();
}

export async function me() : Promise<MeResponse> {
    const res = await fetch(`${API_URL}/me`, {
        method: "GET",
        credentials: "include"
    });

    return res.json();
}