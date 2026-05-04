"use client";

import { SCENARIO_KEYS, SCENARIO_META } from "@/lib/constants";
import { calculateTotals, formatCurrency } from "@/lib/calculations";
import type { ScenarioBundle, ScenarioKey } from "@/lib/types";

interface Props {
  bundle: ScenarioBundle;
  active: ScenarioKey;
  onSelect: (key: ScenarioKey) => void;
}

export default function ScenarioTabs({ bundle, active, onSelect }: Props) {
  return (
    <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {SCENARIO_KEYS.map((key) => {
        const s = SCENARIO_META[key];
        const t = calculateTotals(bundle[key].partners, bundle[key].variable);
        const isActive = active === key;
        return (
          <div
            key={key}
            onClick={() => onSelect(key)}
            className="scenario-tab relative overflow-hidden rounded px-[22px] py-5"
            style={{
              background: isActive ? "#1A1A1A" : "white",
              color: isActive ? "#F4F1EA" : "#1A1A1A",
              border: isActive ? "1px solid #1A1A1A" : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ background: s.color }}
            />
            <div
              className="mono-font mb-1.5"
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: isActive ? "rgba(244,241,234,0.6)" : "rgba(0,0,0,0.5)",
              }}
            >
              {s.pct}% of DTC
            </div>
            <div className="display-font text-xl font-medium leading-snug mb-2">
              {s.name}
            </div>
            <div
              className="mono-font font-bold tracking-tight"
              style={{ fontSize: "24px" }}
            >
              {formatCurrency(t.total)}
            </div>
            <div
              className="text-[11px] mt-2 leading-snug"
              style={{ color: isActive ? "rgba(244,241,234,0.7)" : "rgba(0,0,0,0.55)" }}
            >
              Realistic DTC: {s.realisticDtc} · Hits goal: <strong>{s.hitsGoal}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
