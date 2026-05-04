"use client";

import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { ShareLink } from "@/lib/types";

interface Props {
  links: ShareLink[];
  onCreate: () => Promise<void>;
  onRevoke: (token: string) => Promise<void>;
}

export default function ShareLinkPanel({ links, onCreate, onRevoke }: Props) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const active = links.filter((l) => !l.revoked_at);

  const buildUrl = (token: string) => {
    if (typeof window === "undefined") return `/view/${token}`;
    return `${window.location.origin}/view/${token}`;
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(buildUrl(token));
      setCopied(token);
      setTimeout(() => setCopied((c) => (c === token ? null : c)), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mb-10">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h2 className="display-font text-2xl font-medium tracking-tight">
            View-only share links
          </h2>
          <div className="mono-font text-[11px] text-black/50 mt-1 tracking-wider">
            {active.length} ACTIVE · ANYONE WITH THE LINK CAN VIEW
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={async () => {
            setBusy(true);
            try {
              await onCreate();
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          <Plus size={14} /> Create link
        </button>
      </div>

      <div className="bg-white border border-black/10 rounded overflow-hidden">
        {active.length === 0 ? (
          <div className="p-10 text-center text-black/40 text-sm">
            No active share links. Create one to give read-only access without login.
          </div>
        ) : (
          active.map((l) => (
            <div
              key={l.token}
              className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.05] last:border-b-0"
            >
              <div className="mono-font text-[13px] truncate flex-1">
                {buildUrl(l.token)}
              </div>
              <span className="mono-font text-[10px] text-black/40 tracking-wider">
                {new Date(l.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => copy(l.token)}
                className="btn-secondary"
                title="Copy URL"
              >
                <Copy size={13} />
                {copied === l.token ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => onRevoke(l.token)}
                className="btn-icon"
                title="Revoke link"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
