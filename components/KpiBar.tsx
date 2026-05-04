"use client";

import { formatCurrency, formatCurrencyExact, type Totals } from "@/lib/calculations";
import { DTC_GOAL } from "@/lib/constants";
import type { ScenarioMeta } from "@/lib/types";

interface Props {
  totals: Totals;
  meta: ScenarioMeta;
}

export default function KpiBar({ totals, meta }: Props) {
  const targetBudget = (DTC_GOAL * meta.pct) / 100;
  const variance = totals.total - targetBudget;
  const varianceColor =
    Math.abs(variance) > targetBudget * 0.05 ? "#B23A48" : "#2D5F3F";
  const fixedPct = totals.total > 0 ? (totals.fixed / totals.total) * 100 : 0;

  const cells = [
    {
      label: "Target Budget",
      value: formatCurrency(targetBudget),
      sub: `${meta.pct}% of $3M DTC goal`,
    },
    {
      label: "Current Total",
      value: formatCurrency(totals.total),
      sub: formatCurrencyExact(totals.total),
    },
    {
      label: "Variance",
      value: (variance >= 0 ? "+" : "") + formatCurrency(variance),
      sub: variance >= 0 ? "Over target" : "Under target",
      color: varianceColor,
    },
    {
      label: "Fixed / Variable",
      value: `${formatCurrency(totals.fixed)} / ${formatCurrency(totals.variable)}`,
      sub: `${fixedPct.toFixed(0)}% fixed`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-black/10 rounded mb-6 overflow-hidden">
      {cells.map((kpi, i) => (
        <div
          key={i}
          className="px-6 py-5"
          style={{
            borderRight: i < cells.length - 1 ? "1px solid rgba(0,0,0,0.08)" : "none",
          }}
        >
          <div className="label-mono mb-2">{kpi.label}</div>
          <div
            className="display-font font-medium leading-none tracking-tight"
            style={{ fontSize: "28px", color: kpi.color || "#1A1A1A" }}
          >
            {kpi.value}
          </div>
          <div className="text-[11px] text-black/50 mt-1.5">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}
