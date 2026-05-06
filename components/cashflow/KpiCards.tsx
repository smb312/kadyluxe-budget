"use client";

import { formatCurrency } from "@/lib/calculations";
import type { CashflowKpis } from "@/lib/cashflow/types";

interface Props {
  kpis: CashflowKpis;
}

interface Card {
  label: string;
  value: string;
  hint: string;
}

export default function KpiCards({ kpis }: Props) {
  const cards: Card[] = [
    {
      label: "Annual marketing investment",
      value: formatCurrency(kpis.annualMarketingInvestment),
      hint: "Full year: Jan–Apr manual outflows + May–Dec modeled outflows",
    },
    {
      label: "Annual gross revenue",
      value: formatCurrency(kpis.annualGrossRevenue),
      hint: "Jan–Apr manual gross + May–Dec modeled gross",
    },
    {
      label: "Blended ROAS",
      value: kpis.blendedRoas > 0 ? `${kpis.blendedRoas.toFixed(2)}x` : "—",
      hint: "May–Dec modeled gross ÷ paid working spend (ex-fees, manual months excluded)",
    },
    {
      label: "Blended CAC",
      value: kpis.blendedCac > 0 ? `$${Math.round(kpis.blendedCac).toLocaleString()}` : "—",
      hint: `Variable spend ÷ customers (revenue ÷ AOV → ${Math.round(kpis.customers).toLocaleString()})`,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white border border-black/10 rounded-md px-4 py-4"
        >
          <div className="mono-font text-[10px] tracking-[0.12em] uppercase text-black/55">
            {c.label}
          </div>
          <div
            className="display-font font-medium mt-1 leading-none"
            style={{ fontSize: 26 }}
          >
            {c.value}
          </div>
          <div className="text-[11px] text-black/45 mt-2 leading-snug">
            {c.hint}
          </div>
        </div>
      ))}
    </div>
  );
}
