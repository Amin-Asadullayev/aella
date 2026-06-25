import { useState, ChangeEvent, FormEvent } from "react";
import { generateKeyPair } from "@/lib/crypto";
import { useAuth } from "@/lib/AuthContext";
import { RegisterResponse } from "@/types/api";

const KEYS_API = "http://localhost:3141/api/keys";

type Mode = "login" | "register";

interface FormState {
  username: string;
  email: string;
  password: string;
}

export default function Login() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>({ username: "", email: "", password: "" });
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      if (mode === "login") {
        await login(form.username, form.password);
      } else {
        const res: RegisterResponse = await register(form.username, form.email, form.password);

        if (!res.success) {
          throw new Error(res.message || "Registration failed");
        }

        const { user, token } = res.data;

        const { publicKey } = await generateKeyPair(
          user.id,
          form.username,
          form.password
        );

        const keyRes = await fetch(KEYS_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ publicKey }),
        });

        if (!keyRes.ok) {
          const keyData = await keyRes.json();
          throw new Error(keyData.message || "Failed to upload public key");
        }

        setMessage("Account created! You can now log in.");
        setMode("login");
        setForm({ username: "", email: "", password: "" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      setError(message);
    }
  }

  return (
    <div className="w-screen h-screen bg-c2 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-c1 p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-bold text-center text-white mb-6">
          <span className="tracking-[20px]">
            AELL<span className="text-[#DE6449]">A</span>
          </span>
          <span className="-ml-[10px] text-[#DE6449]">.</span>
        </h1>

        <div className="h-px bg-white/10 mb-6" />

        <h2 className="text-xl font-semibold text-white mb-6 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>

        {message && (
          <p className="text-green-400 text-sm text-center mb-3">{message}</p>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-white">

          {mode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/80">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="p-3 rounded-lg bg-c2/40 outline-none focus:ring-2 focus:ring-[#7D98A1] text-white"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/80">
              {mode === "login" ? "Email or Username" : "Username"}
            </label>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              className="p-3 rounded-lg bg-c2/40 outline-none focus:ring-2 focus:ring-[#7D98A1] text-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/80">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="p-3 rounded-lg bg-c2/40 outline-none focus:ring-2 focus:ring-[#7D98A1] text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-[#DE6449] hover:bg-[#c9553f] transition-colors text-white font-semibold py-3 rounded-lg"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-sm text-white/70 mt-3">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); setMessage(""); }}
                  className="text-[#DE6449] hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  className="text-[#DE6449] hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}