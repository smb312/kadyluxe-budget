"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Download } from "lucide-react";
import {
  DTC_GOAL,
  SCENARIO_KEYS,
  SCENARIO_META,
} from "@/lib/constants";
import { calculateTotals } from "@/lib/calculations";
import { useDebouncedCallback } from "@/lib/hooks";
import type {
  Month,
  Partner,
  ScenarioBundle,
  ScenarioKey,
  ShareLink,
} from "@/lib/types";
import ScenarioTabs from "./ScenarioTabs";
import KpiBar from "./KpiBar";
import PartnersTable from "./PartnersTable";
import MonthlyVariable from "./MonthlyVariable";
import ComparisonTable from "./ComparisonTable";
import AddPartnerModal from "./AddPartnerModal";
import AuthBar from "./AuthBar";
import ViewOnlyBanner from "./ViewOnlyBanner";
import ShareLinkPanel from "./ShareLinkPanel";

interface Props {
  initialBundle: ScenarioBundle;
  initialShareLinks: ShareLink[];
  userEmail: string | null;
  mode: "edit" | "view";
}

type PartnerDraft = Pick<
  Partner,
  "name" | "category" | "cost" | "type" | "months" | "included" | "notes"
>;

export default function BudgetTool({
  initialBundle,
  initialShareLinks,
  userEmail,
  mode,
}: Props) {
  const readOnly = mode === "view";
  const [bundle, setBundle] = useState<ScenarioBundle>(initialBundle);
  const [active, setActive] = useState<ScenarioKey>("option3");
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

  const current = bundle[active];
  const meta = SCENARIO_META[active];
  const totals = useMemo(
    () => calculateTotals(current.partners, current.variable),
    [current],
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
    setShowAdd(false);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Partner = {
      id: tempId,
      scenario_key: active,
      position: bundle[active].partners.length,
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
      body: JSON.stringify({ ...draft, scenario_key: active }),
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
    (scenarioKey: ScenarioKey, month: Month, amount: number) => {
      void apiCall("/api/monthly", {
        method: "PATCH",
        body: JSON.stringify({ scenario_key: scenarioKey, month, amount }),
      });
    },
    500,
  );

  const updateVariable = (month: Month, value: number) => {
    setBundle((prev) => ({
      ...prev,
      [active]: {
        ...prev[active],
        variable: { ...prev[active].variable, [month]: value },
      },
    }));
    debouncedMonthlySave(active, month, value);
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
        l.token === token ? { ...l, revoked_at: new Date().toISOString() } : l,
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
      scenarios: SCENARIO_KEYS.reduce<Record<string, unknown>>((acc, key) => {
        const s = bundle[key];
        const t = calculateTotals(s.partners, s.variable);
        acc[key] = {
          name: SCENARIO_META[key].name,
          pct_of_dtc: SCENARIO_META[key].pct,
          target_budget: (DTC_GOAL * SCENARIO_META[key].pct) / 100,
          partners: s.partners,
          monthly_variable: s.variable,
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

  const targetBudget = (DTC_GOAL * meta.pct) / 100;
  const variance = totals.total - targetBudget;
  void variance;

  return (
    <div className="min-h-screen bg-cream text-ink">
      {readOnly && <ViewOnlyBanner ownerEmail={userEmail} />}

      <div className="grain relative border-b border-black/10 bg-cream">
        <div className="max-w-[1400px] mx-auto px-8 pt-8 pb-6 relative">
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div>
              <div className="mono-font text-[11px] tracking-[0.15em] uppercase text-black/50 mb-2">
                KADYLUXE × COAST / FRACTIONAL CMO
              </div>
              <h1 className="display-font font-medium leading-none tracking-tight m-0" style={{ fontSize: 44 }}>
                2026 Marketing{" "}
                <em className="italic font-normal">North Star</em>
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
              {!readOnly && <AuthBar email={userEmail} saving={saving} />}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8">
        <ScenarioTabs bundle={bundle} active={active} onSelect={setActive} />

        <KpiBar totals={totals} meta={meta} />

        <div
          className="bg-white px-5 py-3.5 mb-8 flex gap-3 items-start"
          style={{ borderLeft: `3px solid ${meta.color}` }}
        >
          <AlertCircle
            size={18}
            style={{ color: meta.color, flexShrink: 0, marginTop: 1 }}
          />
          <div className="text-sm leading-relaxed text-black/75">
            <strong className="text-ink">{meta.name}.</strong> {meta.note}
          </div>
        </div>

        <PartnersTable
          partners={current.partners}
          fixedTotal={totals.fixed}
          readOnly={readOnly}
          onUpdate={updatePartner}
          onRemove={removePartner}
          onAddClick={() => setShowAdd(true)}
        />

        {showAdd && !readOnly && (
          <AddPartnerModal
            onAdd={addPartner}
            onCancel={() => setShowAdd(false)}
          />
        )}

        <MonthlyVariable
          variable={current.variable}
          total={totals.variable}
          meta={meta}
          readOnly={readOnly}
          onChange={updateVariable}
        />

        <ComparisonTable bundle={bundle} active={active} />

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
