"use client";

import type { TeamOperator } from "@/lib/team/types";

interface Props {
  operator: TeamOperator;
  readOnly: boolean;
  onUpdate: (patch: Partial<TeamOperator>) => void;
}

export default function OperatorBlock({ operator, readOnly, onUpdate }: Props) {
  return (
    <div>
      <div className="label-mono mb-3 !text-[10px]">The operator</div>
      <div className="bg-lavender-bg border border-lavender-border rounded-md px-6 py-5 text-center text-lavender-text">
        <input
          value={operator.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          disabled={readOnly}
          className="ghost-input text-center display-font font-medium text-[18px]"
        />
        <textarea
          value={operator.tagline}
          onChange={(e) => onUpdate({ tagline: e.target.value })}
          disabled={readOnly}
          rows={1}
          className="ghost-input text-center text-[13px] mt-1 resize-none overflow-hidden"
        />
        <textarea
          value={operator.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          disabled={readOnly}
          rows={1}
          className="ghost-input text-center text-[13px] mt-0.5 opacity-80 resize-none overflow-hidden"
        />
      </div>
    </div>
  );
}
