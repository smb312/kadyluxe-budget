"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
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
          disabled={status === "sending" || status === "sent"}
        />
      </label>
      <button
        type="submit"
        className="btn-primary justify-center"
        disabled={status === "sending" || status === "sent"}
      >
        {status === "sending" ? "Sending…" : status === "sent" ? "Check your email" : "Send magic link"}
      </button>
      {status === "sent" && (
        <p className="text-xs text-forest leading-relaxed">
          Magic link sent to <strong>{email}</strong>. Check your inbox and click the link to continue.
        </p>
      )}
      {status === "error" && error && (
        <p className="text-xs text-clay leading-relaxed">{error}</p>
      )}
    </form>
  );
}
