"use client";

import { SCENARIO_KEYS, SCENARIO_META } from "@/lib/constants";
import { calculateTotals, formatCurrency } from "@/lib/calculations";
import type { ScenarioBundle, ScenarioKey } from "@/lib/types";

interface Props {
  bundle: ScenarioBundle;
  active: ScenarioKey;
}

export default function ComparisonTable({ bundle, active }: Props) {
  const labelFor = (k: ScenarioKey) => {
    const pct = SCENARIO_META[k].pct;
    return pct === 20 ? "Growth" : pct === 15 ? "Foundation" : "Maintenance";
  };

  const rows: { label: string; getValue: (k: ScenarioKey) => string }[] = [
    {
      label: "Total Budget",
      getValue: (k) =>
        formatCurrency(calculateTotals(bundle[k].partners, bundle[k].variable).total),
    },
    {
      label: "Fixed Costs",
      getValue: (k) =>
        formatCurrency(calculateTotals(bundle[k].partners, bundle[k].variable).fixed),
    },
    {
      label: "Variable Working Spend",
      getValue: (k) =>
        formatCurrency(calculateTotals(bundle[k].partners, bundle[k].variable).variable),
    },
    {
      label: "Active Partners",
      getValue: (k) =>
        bundle[k].partners.filter((p) => p.included).length.toString(),
    },
    { label: "Realistic DTC", getValue: (k) => SCENARIO_META[k].realisticDtc },
    { label: "Hits $3M Goal?", getValue: (k) => SCENARIO_META[k].hitsGoal },
  ];

  return (
    <div className="mb-10">
      <h2 className="display-font text-2xl font-medium tracking-tight mb-4">
        Side-by-side comparison
      </h2>
      <div className="bg-white border border-black/10 rounded overflow-hidden">
        <div
          className="grid px-5 py-3.5 bg-black/[0.03] border-b border-black/10"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
        >
          <div className="label-mono">Metric</div>
          {SCENARIO_KEYS.map((k) => (
            <div
              key={k}
              className="label-mono"
              style={{
                color: active === k ? "#1A1A1A" : undefined,
                fontWeight: active === k ? 700 : 500,
              }}
            >
              {SCENARIO_META[k].pct}% — {labelFor(k)}
            </div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid px-5 py-3 items-center"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              borderBottom:
                i < rows.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
            }}
          >
            <div className="text-[13px] text-black/70">{row.label}</div>
            {SCENARIO_KEYS.map((k) => (
              <div
                key={k}
                className="mono-font text-sm"
                style={{
                  fontWeight: active === k ? 700 : 500,
                  color: active === k ? "#1A1A1A" : "rgba(0,0,0,0.7)",
                }}
              >
                {row.getValue(k)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
