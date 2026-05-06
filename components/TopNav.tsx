"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  email: string | null;
  saving: boolean;
}

export default function TopNav({ email, saving }: Props) {
  const pathname = usePathname() || "";

  const tabs = [
    { href: "/budget", label: "Budget" },
    { href: "/team", label: "Team" },
  ];

  return (
    <div className="border-b border-black/10 bg-cream/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-8 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <div className="mono-font text-[10px] tracking-[0.18em] uppercase text-black/45 mr-4">
            KADYLUXE × COAST
          </div>
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "px-3 py-1.5 rounded-sm text-sm transition-colors " +
                  (active
                    ? "bg-ink text-cream"
                    : "text-black/60 hover:text-ink hover:bg-black/[0.04]")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="mono-font text-[10px] tracking-[0.12em] uppercase"
            style={{ color: saving ? "#C97B2A" : "rgba(0,0,0,0.4)" }}
          >
            {saving ? "Saving…" : "Saved"}
          </span>
          {email && (
            <span className="mono-font text-[11px] text-black/60 hidden sm:inline">
              {email}
            </span>
          )}
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="btn-secondary !py-1.5 !px-3 !text-[11px]">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
