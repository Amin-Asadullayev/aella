import type { Settings, SettingsResponse } from "@/types/api"

const BASE_URL = "http://localhost:3141";

export async function saveSettings(settings: Settings): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/settings/save`, {
    method: 'PATCH',
    credentials: "include",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  })
  console.log("hello dorld")
}

export async function saveUsername(username: string): Promise<{ success: boolean, message: string }> {
  const res = await fetch(`${BASE_URL}/api/settings/username`, {
    method: 'PUT',
    credentials: "include",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  const body = await res.json();
  return body;
}

export async function changeAvatar(formData: FormData) {
  const response = await fetch(`${BASE_URL}/api/settings/avatar`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await response.json();
  return data;
}

export async function getUsername(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/settings/username`, { credentials: "include" });
  const data = await res.json();
  if (data.success) return data.data.username;
  else return "John Doe"
}

export async function getAvatar(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/settings/avatar`, { credentials: "include" });
  const data = await res.json();
  console.log(data)
  if (data.success) return data.data.avatarUrl;
  else return ""
}

export async function getSettings(): Promise<Settings> {
  const res = await fetch(`${BASE_URL}/api/settings/`, { credentials: "include" });
  console.log("Hello gorld")
  const data = await res.json();
  if (data.success) return data.data.settings
  else return {
    displayName: "",
    bio: "",

    privacy: {
      readReceipts: false,
      onlineStatus: false,
      lastSeen: false,
    },

    chat: {
      showTimestamps: false,
    },

    appearance: {
      darkMode: false,
    },
  }
}