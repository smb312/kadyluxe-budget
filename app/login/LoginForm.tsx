"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swap = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirm("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(
            error.message === "Invalid login credentials"
              ? "Wrong email or password."
              : error.message,
          );
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        // With "Confirm email" disabled in Supabase, signUp returns a session
        // and the user is signed in immediately. If it's enabled, there's no
        // session yet — surface a helpful message.
        if (!data.session) {
          setError(
            "Account created. Check your email to confirm before signing in.",
          );
          return;
        }
      }

      router.push("/budget");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="label-mono">Email</span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-black/15 rounded text-sm focus:outline-none focus:border-ink"
          placeholder="you@kadyluxe.com"
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="label-mono">Password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-black/15 rounded text-sm focus:outline-none focus:border-ink"
          placeholder={mode === "signup" ? "At least 8 characters" : ""}
          disabled={busy}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
      </label>

      {mode === "signup" && (
        <label className="flex flex-col gap-2">
          <span className="label-mono">Confirm password</span>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-black/15 rounded text-sm focus:outline-none focus:border-ink"
            disabled={busy}
            autoComplete="new-password"
          />
        </label>
      )}

      <button type="submit" className="btn-primary justify-center" disabled={busy}>
        {busy
          ? mode === "signin"
            ? "Signing in…"
            : "Creating account…"
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </button>

      {error && <p className="text-xs text-clay leading-relaxed">{error}</p>}

      <div className="text-xs text-black/60 pt-2 border-t border-black/10">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              type="button"
              onClick={() => swap("signup")}
              className="underline hover:text-ink"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => swap("signin")}
              className="underline hover:text-ink"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}
