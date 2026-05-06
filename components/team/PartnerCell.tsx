"use client";

import { X } from "lucide-react";
import type { TeamPartner, TeamStatus } from "@/lib/team/types";
import StatusPicker from "./StatusPicker";

interface Props {
  partner: TeamPartner;
  readOnly: boolean;
  onUpdate: (id: string, patch: Partial<TeamPartner>) => void;
  onRemove: (id: string) => void;
}

const stylesFor = (status: TeamStatus) => {
  switch (status) {
    case "confirmed":
      return "bg-teal-bg border-teal-border text-teal-text";
    case "recommended":
      return "bg-amber-bg border-amber-border text-amber-text";
    case "vision":
      return "vision-hatch border-black/20 text-black/55";
  }
};

export default function PartnerCell({ partner, readOnly, onUpdate, onRemove }: Props) {
  return (
    <div
      className={
        "group relative rounded-md border px-2.5 py-2 leading-tight " +
        stylesFor(partner.status)
      }
    >
      <input
        value={partner.name}
        onChange={(e) => onUpdate(partner.id, { name: e.target.value })}
        disabled={readOnly}
        className="ghost-input font-medium text-[12.5px] leading-tight"
        placeholder="Channel"
      />
      <input
        value={partner.vendor}
        onChange={(e) => onUpdate(partner.id, { vendor: e.target.value })}
        disabled={readOnly}
        className="ghost-input text-[11px] mt-0.5 opacity-80"
        placeholder="Vendor / partner"
      />

      {!readOnly && (
        <>
          <div className="absolute bottom-1 right-1 reveal-on-hover">
            <StatusPicker
              value={partner.status}
              onChange={(s) => onUpdate(partner.id, { status: s })}
            />
          </div>
          <button
            type="button"
            className="absolute top-1 right-1 reveal-on-hover text-black/40 hover:text-clay"
            onClick={() => {
              if (confirm(`Remove "${partner.name || "this partner"}"?`)) {
                onRemove(partner.id);
              }
            }}
            title="Remove"
          >
            <X size={12} />
          </button>
        </>
      )}
    </div>
  );
}
