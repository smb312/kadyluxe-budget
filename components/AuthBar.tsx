"use client";

interface Props {
  email: string | null;
  saving: boolean;
}

export default function AuthBar({ email, saving }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="mono-font text-[10px] tracking-[0.12em] uppercase"
        style={{ color: saving ? "#C97B2A" : "rgba(0,0,0,0.4)" }}
      >
        {saving ? "Saving…" : "Saved"}
      </span>
      {email && (
        <span className="mono-font text-[11px] text-black/60">{email}</span>
      )}
      <form action="/auth/sign-out" method="post">
        <button type="submit" className="btn-secondary">
          Sign out
        </button>
      </form>
    </div>
  );
}
