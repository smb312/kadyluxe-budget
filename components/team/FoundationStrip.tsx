"use client";

import type { TeamFoundation, TeamStatus } from "@/lib/team/types";
import StatusPicker from "./StatusPicker";

interface Props {
  rows: TeamFoundation[];
  readOnly: boolean;
  onUpdate: (id: string, patch: Partial<TeamFoundation>) => void;
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

export default function FoundationStrip({ rows, readOnly, onUpdate }: Props) {
  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="label-mono mb-3 !text-[10px]">
        Foundation — cross-stage infrastructure
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${sorted.length}, 1fr)` }}
      >
        {sorted.map((row) => (
          <div
            key={row.id}
            className={
              "group relative rounded-md border px-4 py-3 text-center " +
              stylesFor(row.status)
            }
          >
            <input
              value={row.name}
              onChange={(e) => onUpdate(row.id, { name: e.target.value })}
              disabled={readOnly}
              className="ghost-input text-center font-medium text-[14px]"
            />
            <input
              value={row.vendor}
              onChange={(e) => onUpdate(row.id, { vendor: e.target.value })}
              disabled={readOnly}
              className="ghost-input text-center text-[12px] mt-1 opacity-80"
            />
            {!readOnly && (
              <div className="absolute bottom-1.5 right-1.5 reveal-on-hover">
                <StatusPicker
                  value={row.status}
                  onChange={(s) => onUpdate(row.id, { status: s })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
