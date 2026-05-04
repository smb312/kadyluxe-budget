"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import {
  calculateAnnualCost,
  formatCurrency,
} from "@/lib/calculations";
import type { Partner, PartnerType } from "@/lib/types";

interface Props {
  partners: Partner[];
  fixedTotal: number;
  readOnly: boolean;
  onUpdate: (id: string, patch: Partial<Partner>) => void;
  onRemove: (id: string) => void;
  onAddClick: () => void;
}

const COLS = "40px 2fr 1.5fr 100px 100px 80px 1fr 80px";

export default function PartnersTable({
  partners,
  fixedTotal,
  readOnly,
  onUpdate,
  onRemove,
  onAddClick,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const activeCount = partners.filter((p) => p.included).length;

  return (
    <div className="mb-10">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h2 className="display-font text-2xl font-medium tracking-tight">
            Partners & Fixed Costs
          </h2>
          <div className="mono-font text-[11px] text-black/50 mt-1 tracking-wider">
            {activeCount} ACTIVE · {formatCurrency(fixedTotal)} ANNUAL
          </div>
        </div>
        <button onClick={onAddClick} className="btn-primary" disabled={readOnly}>
          <Plus size={14} /> Add partner
        </button>
      </div>

      <div className="bg-white border border-black/10 rounded overflow-hidden">
        <div
          className="grid items-center px-4 py-3 bg-black/[0.03] border-b border-black/10"
          style={{ gridTemplateColumns: COLS }}
        >
          {["", "Partner", "Category", "Cost", "Type", "Months", "Annual", ""].map(
            (h, i) => (
              <div key={i} className="label-mono">
                {h}
              </div>
            ),
          )}
        </div>
        {partners.map((p) => {
          const annual = calculateAnnualCost(p);
          return (
            <div key={p.id}>
              <div
                className="partner-row grid items-center px-4 py-3 border-b border-black/[0.05]"
                style={{
                  gridTemplateColumns: COLS,
                  opacity: p.included ? 1 : 0.4,
                }}
              >
                <input
                  type="checkbox"
                  checked={p.included}
                  onChange={(e) => onUpdate(p.id, { included: e.target.checked })}
                  className="checkbox"
                  disabled={readOnly}
                />
                <input
                  className="editable-input w-full"
                  style={{ fontFamily: "Inter", fontSize: 14, fontWeight: 500 }}
                  value={p.name}
                  onChange={(e) => onUpdate(p.id, { name: e.target.value })}
                  disabled={readOnly}
                />
                <input
                  className="editable-input w-full"
                  value={p.category}
                  onChange={(e) => onUpdate(p.id, { category: e.target.value })}
                  disabled={readOnly}
                />
                <input
                  type="number"
                  className="editable-input w-[90px] text-right"
                  value={p.cost}
                  onChange={(e) =>
                    onUpdate(p.id, { cost: parseFloat(e.target.value) || 0 })
                  }
                  disabled={readOnly}
                />
                <select
                  className="editable-input w-[90px]"
                  value={p.type}
                  onChange={(e) =>
                    onUpdate(p.id, {
                      type: e.target.value as PartnerType,
                      months:
                        e.target.value === "annual" ? null : p.months ?? 12,
                    })
                  }
                  disabled={readOnly}
                >
                  <option value="annual">annual</option>
                  <option value="monthly">monthly</option>
                </select>
                <input
                  type="number"
                  className="editable-input w-[60px] text-right"
                  value={p.months ?? (p.type === "monthly" ? 12 : "")}
                  onChange={(e) =>
                    onUpdate(p.id, { months: parseFloat(e.target.value) || 12 })
                  }
                  disabled={readOnly || p.type === "annual"}
                  placeholder="—"
                />
                <div className="mono-font text-sm font-medium text-right pr-3">
                  {formatCurrency(annual)}
                </div>
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() =>
                      setExpanded({ ...expanded, [p.id]: !expanded[p.id] })
                    }
                    className="btn-icon"
                    title="Toggle notes"
                  >
                    {expanded[p.id] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="btn-icon"
                    title="Remove"
                    disabled={readOnly}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expanded[p.id] && (
                <div className="px-4 py-3 pl-14 bg-black/[0.02] border-b border-black/[0.05]">
                  <textarea
                    value={p.notes ?? ""}
                    onChange={(e) => onUpdate(p.id, { notes: e.target.value })}
                    placeholder="Add notes about this partner..."
                    className="w-full min-h-[60px] px-2.5 py-2 border border-black/10 rounded text-[13px] bg-white resize-y focus:outline-none focus:border-ink"
                    disabled={readOnly}
                  />
                </div>
              )}
            </div>
          );
        })}
        {partners.length === 0 && (
          <div className="p-10 text-center text-black/40 text-sm">
            No partners yet. Click &quot;Add partner&quot; to start.
          </div>
        )}
      </div>
    </div>
  );
}
