"use client";

import { calculateTotals, formatCurrency } from "@/lib/calculations";
import type { Scenario, ScenarioBundle, ScenarioSlug } from "@/lib/types";

interface Props {
  scenarios: Scenario[];
  bundle: ScenarioBundle;
  active: ScenarioSlug;
  onSelect: (slug: ScenarioSlug) => void;
}

export default function ScenarioTabs({ scenarios, bundle, active, onSelect }: Props) {
  return (
    <div
      className="grid gap-3 mb-8"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
    >
      {scenarios.map((s) => {
        const state = bundle[s.slug];
        const t = state
          ? calculateTotals(state.partners, state.variable)
          : { fixed: 0, variable: 0, total: 0 };
        const isActive = active === s.slug;
        return (
          <div
            key={s.slug}
            onClick={() => onSelect(s.slug)}
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
            <div className="mono-font font-bold tracking-tight" style={{ fontSize: "24px" }}>
              {formatCurrency(t.total)}
            </div>
            <div
              className="text-[11px] mt-2 leading-snug"
              style={{ color: isActive ? "rgba(244,241,234,0.7)" : "rgba(0,0,0,0.55)" }}
            >
              Realistic DTC: {s.realistic_dtc} · Hits goal: <strong>{s.hits_goal}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
