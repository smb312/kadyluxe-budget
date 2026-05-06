"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useDebouncedCallback } from "@/lib/hooks";
import { computeCashflow, computeKpis } from "@/lib/cashflow/calculations";
import { CASHFLOW_MONTHS } from "@/lib/cashflow/types";
import type { CashflowAssumptions } from "@/lib/cashflow/types";
import type { Scenario, ScenarioBundle, ScenarioSlug } from "@/lib/types";
import TopNav from "./TopNav";
import AssumptionsPanel from "./cashflow/AssumptionsPanel";
import CashflowTable from "./cashflow/CashflowTable";
import KpiCards from "./cashflow/KpiCards";

interface Props {
  scenarios: Scenario[];
  bundle: ScenarioBundle;
  initialAssumptions: CashflowAssumptions;
  userEmail: string | null;
}

const fmtCsvNumber = (n: number) => Math.round(n).toString();

export default function CashflowTool({
  scenarios,
  bundle,
  initialAssumptions,
  userEmail,
}: Props) {
  const [assumptions, setAssumptions] =
    useState<CashflowAssumptions>(initialAssumptions);

  const inflight = useRef(0);
  const [saving, setSaving] = useState(false);
  const setSavingFlag = useCallback((delta: 1 | -1) => {
    inflight.current = Math.max(0, inflight.current + delta);
    setSaving(inflight.current > 0);
  }, []);

  const apiCall = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      setSavingFlag(1);
      try {
        const res = await fetch(input, {
          ...init,
          headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        });
        if (!res.ok) {
          console.error("cashflow api error", res.status, await res.text().catch(() => ""));
        }
        return res;
      } finally {
        setSavingFlag(-1);
      }
    },
    [setSavingFlag],
  );

  const debouncedSave = useDebouncedCallback(
    (patch: Partial<CashflowAssumptions>) => {
      void apiCall("/api/cashflow/assumptions", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    500,
  );

  const patchAssumptions = (patch: Partial<CashflowAssumptions>) => {
    setAssumptions((prev) => ({ ...prev, ...patch }));
    debouncedSave(patch);
  };

  // Resolve the active scenario state. Fall back to the first scenario if the
  // saved slug doesn't match anything (e.g. scenario was renamed).
  const activeSlug: ScenarioSlug = useMemo(() => {
    const match = scenarios.find((s) => s.slug === assumptions.selected_scenario_slug);
    return match?.slug ?? scenarios[0]?.slug ?? assumptions.selected_scenario_slug;
  }, [scenarios, assumptions.selected_scenario_slug]);

  const activeState = bundle[activeSlug];
  const activeScenario = scenarios.find((s) => s.slug === activeSlug);

  const rows = useMemo(() => {
    if (!activeState) return [];
    return computeCashflow(activeState.partners, activeState.variable, assumptions);
  }, [activeState, assumptions]);

  const kpis = useMemo(() => {
    if (!activeState) {
      return {
        annualMarketingInvestment: 0,
        windowGrossRevenue: 0,
        blendedRoas: 0,
        blendedCac: 0,
        customers: 0,
        variableSpendInWindow: 0,
      };
    }
    return computeKpis(rows, activeState.partners, activeState.variable, assumptions);
  }, [activeState, rows, assumptions]);

  // Warn before nav while saving.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (inflight.current > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ---- CSV export ------------------------------------------------------

  const exportCsv = () => {
    if (rows.length === 0) return;
    const header = ["Line item", ...CASHFLOW_MONTHS, "Annual"];
    const totalRow = (label: string, values: number[]) => {
      const sum = values.reduce((s, v) => s + v, 0);
      return [label, ...values.map(fmtCsvNumber), fmtCsvNumber(sum)];
    };
    const lines: string[][] = [
      header,
      ["", ...CASHFLOW_MONTHS.map(() => ""), ""],
      ["OUTFLOWS"],
      totalRow("Fixed partner retainers", rows.map((r) => r.out.fixedRetainer)),
      totalRow("Variable working spend", rows.map((r) => r.out.variableWorking)),
      totalRow("Scott Bauer fee", rows.map((r) => r.out.scottFee)),
      ...(assumptions.broncos_included
        ? [totalRow("Broncos sponsorship", rows.map((r) => r.out.broncos))]
        : []),
      totalRow("TOTAL OUTFLOWS", rows.map((r) => r.out.total)),
      [""],
      ["INFLOWS"],
      totalRow("Baseline organic revenue", rows.map((r) => r.in.baseline)),
      totalRow("Paid-driven revenue (3-wk lag)", rows.map((r) => r.in.paid)),
      totalRow("Email-driven revenue", rows.map((r) => r.in.email)),
      totalRow("Influencer-driven revenue (6-wk lag)", rows.map((r) => r.in.influencer)),
      totalRow("GROSS REVENUE", rows.map((r) => r.in.gross)),
      totalRow(
        `Contribution margin × ${(assumptions.contribution_margin * 100).toFixed(0)}%`,
        rows.map((r) => r.in.netCash - r.in.gross),
      ),
      totalRow("NET CASH INFLOW", rows.map((r) => r.in.netCash)),
      [""],
      ["NET POSITION"],
      totalRow("Monthly net", rows.map((r) => r.monthlyNet)),
      [
        "Cumulative net position",
        ...rows.map((r) => fmtCsvNumber(r.cumulativeNet)),
        fmtCsvNumber(rows[rows.length - 1]?.cumulativeNet ?? 0),
      ],
    ];
    const csv = lines
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kadyluxe-cashflow-${activeSlug}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Render --------------------------------------------------------

  if (!activeState || !activeScenario) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-black/60">
        No budget data found. Visit /budget first to seed scenarios.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <TopNav email={userEmail} saving={saving} />

      <div className="grain relative border-b border-black/10 bg-cream">
        <div className="max-w-[1400px] mx-auto px-8 pt-8 pb-6 relative">
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div>
              <div className="mono-font text-[11px] tracking-[0.15em] uppercase text-black/50 mb-2">
                FRACTIONAL CMO · CASH FLOW
              </div>
              <h1
                className="display-font font-medium leading-none tracking-tight m-0"
                style={{ fontSize: 40 }}
              >
                Directional cash flow <em className="italic font-normal">projection</em>
              </h1>
              <div className="mt-2 text-sm text-black/60 leading-relaxed max-w-2xl">
                Monthly outflows from the budget tool against modeled revenue
                inflows. Assumptions are editable — this is not a forecast.
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={exportCsv} className="btn-primary">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="mono-font text-[10px] tracking-[0.15em] uppercase text-black/55">
            Outflows from scenario
          </span>
          <div className="flex gap-1">
            {scenarios.map((s) => {
              const active = s.slug === activeSlug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => patchAssumptions({ selected_scenario_slug: s.slug })}
                  className={
                    "px-3 py-1.5 rounded-sm text-[12px] mono-font tracking-wide transition-colors " +
                    (active
                      ? "bg-ink text-cream"
                      : "bg-white border border-black/15 text-black/65 hover:text-ink")
                  }
                >
                  {s.name} · {s.pct}%
                </button>
              );
            })}
          </div>
        </div>

        <AssumptionsPanel assumptions={assumptions} onPatch={patchAssumptions} />

        <CashflowTable rows={rows} assumptions={assumptions} />

        <KpiCards kpis={kpis} />

        <div className="mt-2 pt-4 border-t border-black/10 flex justify-between flex-wrap gap-3">
          <div className="mono-font text-[11px] text-black/50 tracking-wider">
            KADYLUXE × COAST · CASH FLOW · DIRECTIONAL ONLY
          </div>
          <div className="mono-font text-[11px] text-black/50 tracking-wider">
            AUTO-SAVES TO POSTGRES
          </div>
        </div>
      </div>
    </div>
  );
}
