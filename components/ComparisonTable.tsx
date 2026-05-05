"use client";

import { calculateTotals, formatCurrency } from "@/lib/calculations";
import type { Scenario, ScenarioBundle, ScenarioSlug } from "@/lib/types";

interface Props {
  scenarios: Scenario[];
  bundle: ScenarioBundle;
  active: ScenarioSlug;
}

export default function ComparisonTable({ scenarios, bundle, active }: Props) {
  const labelFor = (s: Scenario) => {
    const tag = s.name.split("—")[1]?.trim();
    return tag || s.name;
  };

  const cols = `2fr ${scenarios.map(() => "1fr").join(" ")}`;

  const rows: { label: string; getValue: (s: Scenario) => string }[] = [
    {
      label: "Total Budget",
      getValue: (s) =>
        formatCurrency(
          calculateTotals(bundle[s.slug]?.partners ?? [], bundle[s.slug]?.variable ?? {} as Record<string, number>).total,
        ),
    },
    {
      label: "Fixed Costs",
      getValue: (s) =>
        formatCurrency(
          calculateTotals(bundle[s.slug]?.partners ?? [], bundle[s.slug]?.variable ?? {} as Record<string, number>).fixed,
        ),
    },
    {
      label: "Variable Working Spend",
      getValue: (s) =>
        formatCurrency(
          calculateTotals(bundle[s.slug]?.partners ?? [], bundle[s.slug]?.variable ?? {} as Record<string, number>).variable,
        ),
    },
    {
      label: "Active Partners",
      getValue: (s) =>
        (bundle[s.slug]?.partners.filter((p) => p.included).length ?? 0).toString(),
    },
    { label: "Realistic DTC", getValue: (s) => s.realistic_dtc },
    { label: "Hits $3M Goal?", getValue: (s) => s.hits_goal },
  ];

  return (
    <div className="mb-10">
      <h2 className="display-font text-2xl font-medium tracking-tight mb-4">
        Side-by-side comparison
      </h2>
      <div className="bg-white border border-black/10 rounded overflow-hidden">
        <div
          className="grid px-5 py-3.5 bg-black/[0.03] border-b border-black/10"
          style={{ gridTemplateColumns: cols }}
        >
          <div className="label-mono">Metric</div>
          {scenarios.map((s) => (
            <div
              key={s.slug}
              className="label-mono"
              style={{
                color: active === s.slug ? "#1A1A1A" : undefined,
                fontWeight: active === s.slug ? 700 : 500,
              }}
            >
              {s.pct}% — {labelFor(s)}
            </div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid px-5 py-3 items-center"
            style={{
              gridTemplateColumns: cols,
              borderBottom:
                i < rows.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
            }}
          >
            <div className="text-[13px] text-black/70">{row.label}</div>
            {scenarios.map((s) => (
              <div
                key={s.slug}
                className="mono-font text-sm"
                style={{
                  fontWeight: active === s.slug ? 700 : 500,
                  color: active === s.slug ? "#1A1A1A" : "rgba(0,0,0,0.7)",
                }}
              >
                {row.getValue(s)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
