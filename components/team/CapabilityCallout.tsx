"use client";

import type { TeamCapability } from "@/lib/team/types";

interface Props {
  capability: TeamCapability;
  readOnly: boolean;
  onUpdate: (patch: Partial<TeamCapability>) => void;
}

export default function CapabilityCallout({ capability, readOnly, onUpdate }: Props) {
  return (
    <div>
      <div className="mb-3 group">
        <input
          value={capability.section_title}
          onChange={(e) => onUpdate({ section_title: e.target.value })}
          disabled={readOnly}
          className="ghost-input label-mono !text-[10px] !text-black/55"
        />
      </div>
      <div className="bg-clay/[0.06] border-2 border-clay/40 rounded-md px-6 py-5 text-center">
        <input
          value={capability.callout_title}
          onChange={(e) => onUpdate({ callout_title: e.target.value })}
          disabled={readOnly}
          className="ghost-input text-center display-font font-medium text-[18px] text-clay"
        />
        <textarea
          value={capability.callout_body}
          onChange={(e) => onUpdate({ callout_body: e.target.value })}
          disabled={readOnly}
          rows={3}
          className="ghost-input text-center text-[13px] text-clay/85 mt-2 resize-y w-full max-w-3xl mx-auto block"
        />
      </div>
    </div>
  );
}
