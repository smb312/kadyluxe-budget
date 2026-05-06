"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Download } from "lucide-react";
import { DTC_GOAL } from "@/lib/constants";
import { calculateTotals } from "@/lib/calculations";
import { useDebouncedCallback } from "@/lib/hooks";
import type {
  Month,
  Partner,
  Scenario,
  ScenarioBundle,
  ScenarioSlug,
  ShareLink,
} from "@/lib/types";
import ScenarioTabs from "./ScenarioTabs";
import KpiBar from "./KpiBar";
import PartnersTable from "./PartnersTable";
import MonthlyVariable from "./MonthlyVariable";
import ComparisonTable from "./ComparisonTable";
import AddPartnerModal from "./AddPartnerModal";
import ShareLinkPanel from "./ShareLinkPanel";
import TopNav from "./TopNav";

interface Props {
  scenarios: Scenario[];
  initialBundle: ScenarioBundle;
  initialShareLinks: ShareLink[];
  userEmail: string | null;
  mode: "edit" | "view";
}

type PartnerDraft = Pick<
  Partner,
  "name" | "category" | "cost" | "type" | "months" | "start_month" | "included" | "notes"
>;

const pickDefaultActive = (scenarios: Scenario[]): ScenarioSlug => {
  // Prefer the 20% (Growth) scenario; otherwise the highest pct.
  const sorted = [...scenarios].sort((a, b) => b.pct - a.pct);
  return sorted[0]?.slug ?? "";
};

export default function BudgetTool({
  scenarios,
  initialBundle,
  initialShareLinks,
  userEmail,
  mode,
}: Props) {
  const readOnly = mode === "view";
  const [bundle, setBundle] = useState<ScenarioBundle>(initialBundle);
  const [active, setActive] = useState<ScenarioSlug>(() =>
    pickDefaultActive(scenarios),
  );
  const [showAdd, setShowAdd] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>(initialShareLinks);

  const inflight = useRef(0);
  const [saving, setSaving] = useState(false);
  const setSavingFlag = useCallback((delta: 1 | -1) => {
    inflight.current = Math.max(0, inflight.current + delta);
    setSaving(inflight.current > 0);
  }, []);

  const apiCall = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      if (readOnly) return null;
      setSavingFlag(1);
      try {
        const res = await fetch(input, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
          },
        });
        if (!res.ok) {
          console.error("API error", res.status, await res.text().catch(() => ""));
        }
        return res;
      } finally {
        setSavingFlag(-1);
      }
    },
    [readOnly, setSavingFlag],
  );

  const scenarioBySlug = useMemo(() => {
    const m = new Map<ScenarioSlug, Scenario>();
    for (const s of scenarios) m.set(s.slug, s);
    return m;
  }, [scenarios]);

  const currentScenario = scenarioBySlug.get(active);
  const currentState = bundle[active];

  const totals = useMemo(
    () =>
      currentState
        ? calculateTotals(currentState.partners, currentState.variable)
        : { fixed: 0, variable: 0, total: 0 },
    [currentState],
  );

  // ---- Partner mutations -------------------------------------------------

  const debouncedPartnerSave = useDebouncedCallback(
    (id: string, patch: Partial<Partner>) => {
      void apiCall(`/api/partners/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    500,
  );

  const updatePartner = (id: string, patch: Partial<Partner>) => {
    setBundle((prev) => ({
      ...prev,
      [active]: {
        ...prev[active],
        partners: prev[active].partners.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      },
    }));
    debouncedPartnerSave(id, patch);
  };

  const removePartner = async (id: string) => {
    setBundle((prev) => ({
      ...prev,
      [active]: {
        ...prev[active],
        partners: prev[active].partners.filter((p) => p.id !== id),
      },
    }));
    await apiCall(`/api/partners/${id}`, { method: "DELETE" });
  };

  const addPartner = async (draft: PartnerDraft) => {
    if (!currentScenario) return;
    setShowAdd(false);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Partner = {
      id: tempId,
      scenario_id: currentScenario.id,
      scenario_slug: currentScenario.slug,
      sort_order: bundle[active].partners.length,
      ...draft,
    };
    setBundle((prev) => ({
      ...prev,
      [active]: {
        ...prev[active],
        partners: [...prev[active].partners, optimistic],
      },
    }));

    const res = await apiCall("/api/partners", {
      method: "POST",
      body: JSON.stringify({ ...draft, scenario_id: currentScenario.id }),
    });
    if (!res || !res.ok) return;
    const created = (await res.json()) as Partner;
    setBundle((prev) => ({
      ...prev,
      [active]: {
        ...prev[active],
        partners: prev[active].partners.map((p) => (p.id === tempId ? created : p)),
      },
    }));
  };

  // ---- Monthly mutations -------------------------------------------------

  const debouncedMonthlySave = useDebouncedCallback(
    (scenarioId: string, month: Month, amount: number) => {
      void apiCall("/api/monthly", {
        method: "PATCH",
        body: JSON.stringify({ scenario_id: scenarioId, month, amount }),
      });
    },
    500,
  );

  const updateVariable = (month: Month, value: number) => {
    if (!currentScenario) return;
    setBundle((prev) => ({
      ...prev,
      [active]: {
        ...prev[active],
        variable: { ...prev[active].variable, [month]: value },
      },
    }));
    debouncedMonthlySave(currentScenario.id, month, value);
  };

  // ---- Share links -------------------------------------------------------

  const createShareLink = async () => {
    const res = await apiCall("/api/share", { method: "POST" });
    if (!res || !res.ok) return;
    const link = (await res.json()) as ShareLink;
    setShareLinks((prev) => [link, ...prev]);
  };

  const revokeShareLink = async (token: string) => {
    setShareLinks((prev) =>
      prev.map((l) =>
        l.token === token ? { ...l, expires_at: new Date().toISOString() } : l,
      ),
    );
    await apiCall("/api/share", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    });
  };

  // ---- Export ------------------------------------------------------------

  const exportData = () => {
    const data = {
      generated: new Date().toISOString(),
      dtc_goal: DTC_GOAL,
      scenarios: scenarios.reduce<Record<string, unknown>>((acc, s) => {
        const state = bundle[s.slug];
        if (!state) return acc;
        const t = calculateTotals(state.partners, state.variable);
        acc[s.slug] = {
          name: s.name,
          pct_of_dtc: s.pct,
          target_budget: (DTC_GOAL * s.pct) / 100,
          partners: state.partners,
          monthly_variable: state.variable,
          totals: t,
        };
        return acc;
      }, {}),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kadyluxe-marketing-budget-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Warn before nav while saving --------------------------------------

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

  // ---- Render ------------------------------------------------------------

  if (!currentScenario || !currentState) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-black/60">
        No scenarios found in the database.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      {!readOnly && <TopNav email={userEmail} saving={saving} />}

      <div className="grain relative border-b border-black/10 bg-cream">
        <div className="max-w-[1400px] mx-auto px-8 pt-8 pb-6 relative">
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div>
              <div className="mono-font text-[11px] tracking-[0.15em] uppercase text-black/50 mb-2">
                FRACTIONAL CMO · 2026 BUDGET
              </div>
              <h1
                className="display-font font-medium leading-none tracking-tight m-0"
                style={{ fontSize: 44 }}
              >
                2026 Marketing <em className="italic font-normal">North Star</em>
              </h1>
              <div className="mt-3 text-sm text-black/60 leading-relaxed max-w-2xl">
                Three budget scenarios against a $3M DTC goal. Edit partners,
                costs, and monthly spend live. All numbers recalculate.
                {readOnly ? " Read-only view." : " Auto-saves as you edit."}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={exportData} className="btn-primary">
                <Download size={14} /> Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8">
        <ScenarioTabs
          scenarios={scenarios}
          bundle={bundle}
          active={active}
          onSelect={setActive}
        />

        <KpiBar totals={totals} scenario={currentScenario} />

        <div
          className="bg-white px-5 py-3.5 mb-8 flex gap-3 items-start"
          style={{ borderLeft: `3px solid ${currentScenario.color}` }}
        >
          <AlertCircle
            size={18}
            style={{ color: currentScenario.color, flexShrink: 0, marginTop: 1 }}
          />
          <div className="text-sm leading-relaxed text-black/75">
            <strong className="text-ink">{currentScenario.name}.</strong>{" "}
            {currentScenario.note}
          </div>
        </div>

        <PartnersTable
          partners={currentState.partners}
          fixedTotal={totals.fixed}
          readOnly={readOnly}
          onUpdate={updatePartner}
          onRemove={removePartner}
          onAddClick={() => setShowAdd(true)}
        />

        {showAdd && !readOnly && (
          <AddPartnerModal onAdd={addPartner} onCancel={() => setShowAdd(false)} />
        )}

        <MonthlyVariable
          variable={currentState.variable}
          total={totals.variable}
          scenario={currentScenario}
          readOnly={readOnly}
          onChange={updateVariable}
        />

        <ComparisonTable
          scenarios={scenarios}
          bundle={bundle}
          active={active}
        />

        {!readOnly && (
          <ShareLinkPanel
            links={shareLinks}
            onCreate={createShareLink}
            onRevoke={revokeShareLink}
          />
        )}

        <div className="mt-16 pt-6 border-t border-black/10 flex justify-between flex-wrap gap-3">
          <div className="mono-font text-[11px] text-black/50 tracking-wider">
            KADYLUXE × COAST · INTERNAL TOOL · FRACTIONAL CMO ENGAGEMENT
          </div>
          <div className="mono-font text-[11px] text-black/50 tracking-wider">
            {readOnly ? "READ-ONLY VIEW" : "AUTO-SAVES TO POSTGRES"}
          </div>
        </div>
      </div>
    </div>
  );
}
