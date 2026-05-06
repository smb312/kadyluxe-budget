"use client";

import { Plus } from "lucide-react";
import type { TeamPartner, TeamStage } from "@/lib/team/types";
import { MAX_PARTNERS_PER_STAGE } from "@/lib/team/types";
import PartnerCell from "./PartnerCell";

interface Props {
  stages: TeamStage[];
  partners: TeamPartner[];
  readOnly: boolean;
  onUpdate: (id: string, patch: Partial<TeamPartner>) => void;
  onRemove: (id: string) => void;
  onAdd: (stageId: string) => void;
}

export default function PartnerGrid({
  stages,
  partners,
  readOnly,
  onUpdate,
  onRemove,
  onAdd,
}: Props) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}
    >
      {stages.map((stage) => {
        const inStage = partners
          .filter((p) => p.stage_id === stage.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const canAdd = !readOnly && inStage.length < MAX_PARTNERS_PER_STAGE;

        return (
          <div key={stage.id} className="group/col flex flex-col gap-2">
            {inStage.map((p) => (
              <PartnerCell
                key={p.id}
                partner={p}
                readOnly={readOnly}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
            {canAdd && (
              <button
                type="button"
                onClick={() => onAdd(stage.id)}
                className="reveal-on-hover-col rounded-md border border-dashed border-black/15 px-2.5 py-2 text-[11px] text-black/40 hover:text-ink hover:border-black/40 transition flex items-center justify-center gap-1"
                style={{ minHeight: 48 }}
                title="Add partner"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>
        );
      })}

      <style jsx>{`
        .reveal-on-hover-col {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .group\\/col:hover .reveal-on-hover-col {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
