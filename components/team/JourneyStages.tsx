"use client";

import type { TeamStage } from "@/lib/team/types";

interface Props {
  stages: TeamStage[];
  readOnly: boolean;
  onUpdate: (id: string, patch: Partial<TeamStage>) => void;
}

export default function JourneyStages({ stages, readOnly, onUpdate }: Props) {
  return (
    <div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}
      >
        {stages.map((s, i) => (
          <div key={s.id} className="relative">
            <div className="bg-black/[0.04] border border-black/10 rounded px-3 py-3 text-center group">
              <input
                value={s.name}
                onChange={(e) => onUpdate(s.id, { name: e.target.value })}
                disabled={readOnly}
                className="ghost-input text-center display-font font-medium text-[15px] leading-tight"
              />
            </div>
            {i < stages.length - 1 && (
              <div
                className="absolute top-1/2 -right-2 -translate-y-1/2 text-black/30 select-none pointer-events-none"
                aria-hidden
              >
                ›
              </div>
            )}
            <div className="mt-2 px-1 text-[11px] text-black/55 group">
              <span className="mono-font text-black/45">KPI: </span>
              <input
                value={s.kpi}
                onChange={(e) => onUpdate(s.id, { kpi: e.target.value })}
                disabled={readOnly}
                className="ghost-input inline-block w-[calc(100%-2.5rem)] !text-[11px]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
