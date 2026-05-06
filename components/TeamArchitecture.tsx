"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useDebouncedCallback } from "@/lib/hooks";
import type {
  TeamCapability,
  TeamCulture,
  TeamData,
  TeamFoundation,
  TeamOperator,
  TeamPartner,
  TeamStage,
} from "@/lib/team/types";
import TopNav from "./TopNav";
import Legend from "./team/Legend";
import JourneyStages from "./team/JourneyStages";
import PartnerGrid from "./team/PartnerGrid";
import FoundationStrip from "./team/FoundationStrip";
import OperatorBlock from "./team/OperatorBlock";
import CapabilityCallout from "./team/CapabilityCallout";
import CultureColumns from "./team/CultureColumns";

interface Props {
  initial: TeamData;
  userEmail: string | null;
  mode: "edit" | "view";
}

export default function TeamArchitecture({ initial, userEmail, mode }: Props) {
  const readOnly = mode === "view";
  const [stages, setStages] = useState<TeamStage[]>(initial.stages);
  const [partners, setPartners] = useState<TeamPartner[]>(initial.partners);
  const [foundation, setFoundation] = useState<TeamFoundation[]>(initial.foundation);
  const [operator, setOperator] = useState<TeamOperator | null>(initial.operator);
  const [capability, setCapability] = useState<TeamCapability | null>(initial.capability);
  const [culture, setCulture] = useState<TeamCulture | null>(initial.culture);

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
          headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        });
        if (!res.ok) {
          console.error("team api error", res.status, await res.text().catch(() => ""));
        }
        return res;
      } finally {
        setSavingFlag(-1);
      }
    },
    [readOnly, setSavingFlag],
  );

  // ---- Stage edits ------------------------------------------------------

  const debouncedStageSave = useDebouncedCallback(
    (id: string, patch: Partial<TeamStage>) => {
      void apiCall(`/api/team/stages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    500,
  );

  const updateStage = (id: string, patch: Partial<TeamStage>) => {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    debouncedStageSave(id, patch);
  };

  // ---- Partner edits ----------------------------------------------------

  const debouncedPartnerSave = useDebouncedCallback(
    (id: string, patch: Partial<TeamPartner>) => {
      void apiCall(`/api/team/partners/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    500,
  );

  const updatePartner = (id: string, patch: Partial<TeamPartner>) => {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    debouncedPartnerSave(id, patch);
  };

  const removePartner = async (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    await apiCall(`/api/team/partners/${id}`, { method: "DELETE" });
  };

  const addPartner = async (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    const inStage = partners.filter((p) => p.stage_id === stageId);
    const tempId = `temp-${Date.now()}`;
    const optimistic: TeamPartner = {
      id: tempId,
      stage_id: stageId,
      stage_slug: stage.slug,
      name: "",
      vendor: "",
      status: "recommended",
      sort_order: inStage.length,
    };
    setPartners((prev) => [...prev, optimistic]);

    const res = await apiCall("/api/team/partners", {
      method: "POST",
      body: JSON.stringify({
        stage_id: stageId,
        name: "",
        vendor: "",
        status: "recommended",
      }),
    });
    if (!res || !res.ok) return;
    const created = await res.json();
    setPartners((prev) =>
      prev.map((p) =>
        p.id === tempId
          ? {
              ...optimistic,
              id: String(created.id),
              sort_order: Number(created.sort_order ?? optimistic.sort_order),
            }
          : p,
      ),
    );
  };

  // ---- Foundation -------------------------------------------------------

  const debouncedFoundationSave = useDebouncedCallback(
    (id: string, patch: Partial<TeamFoundation>) => {
      void apiCall(`/api/team/foundation/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    500,
  );

  const updateFoundation = (id: string, patch: Partial<TeamFoundation>) => {
    setFoundation((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    debouncedFoundationSave(id, patch);
  };

  // ---- Operator / Capability / Culture ---------------------------------

  const debouncedOperatorSave = useDebouncedCallback(
    (id: string, patch: Partial<TeamOperator>) => {
      void apiCall("/api/team/operator", {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch }),
      });
    },
    500,
  );
  const updateOperator = (patch: Partial<TeamOperator>) => {
    if (!operator) return;
    setOperator({ ...operator, ...patch });
    debouncedOperatorSave(operator.id, patch);
  };

  const debouncedCapabilitySave = useDebouncedCallback(
    (id: string, patch: Partial<TeamCapability>) => {
      void apiCall("/api/team/capability", {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch }),
      });
    },
    500,
  );
  const updateCapability = (patch: Partial<TeamCapability>) => {
    if (!capability) return;
    setCapability({ ...capability, ...patch });
    debouncedCapabilitySave(capability.id, patch);
  };

  const debouncedCultureSave = useDebouncedCallback(
    (id: string, patch: Partial<Pick<TeamCulture, "is_list" | "is_not_list">>) => {
      void apiCall("/api/team/culture", {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch }),
      });
    },
    500,
  );
  const updateCulture = (patch: Partial<Pick<TeamCulture, "is_list" | "is_not_list">>) => {
    if (!culture) return;
    setCulture({ ...culture, ...patch });
    debouncedCultureSave(culture.id, patch);
  };

  // ---- Warn before nav while saving ------------------------------------

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

  // ---- PNG export ------------------------------------------------------

  const visualRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportPng = async () => {
    if (!visualRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(visualRef.current, {
        pixelRatio: 2,
        backgroundColor: "#F4F1EA",
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `kadyluxe-team-architecture-${new Date().toISOString().split("T")[0]}.png`;
      a.click();
    } catch (err) {
      console.error("png export failed", err);
      alert("Couldn't export PNG. Check console for details.");
    } finally {
      setExporting(false);
    }
  };

  // ---- Render ---------------------------------------------------------

  if (stages.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-black/60">
        No team data found.
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
                FRACTIONAL CMO · TEAM ARCHITECTURE
              </div>
              <h1
                className="display-font font-medium leading-none tracking-tight m-0"
                style={{ fontSize: 40 }}
              >
                Marketing <em className="italic font-normal">operating system</em>
              </h1>
              <div className="mt-2 text-sm text-black/60 leading-relaxed max-w-2xl">
                From traffic to advocacy — channels, partners, and KPIs by
                journey stage.
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={exportPng}
                className="btn-primary"
                disabled={exporting}
              >
                <ImageIcon size={14} /> {exporting ? "Exporting…" : "Export PNG"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={visualRef} className="bg-cream">
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
          <Legend />

          <div>
            <div className="label-mono mb-3 !text-[10px]">Customer journey</div>
            <JourneyStages
              stages={stages}
              readOnly={readOnly}
              onUpdate={updateStage}
            />
          </div>

          <div>
            <div className="label-mono mb-3 !text-[10px]">Channels &amp; partners</div>
            <PartnerGrid
              stages={stages}
              partners={partners}
              readOnly={readOnly}
              onUpdate={updatePartner}
              onRemove={removePartner}
              onAdd={addPartner}
            />
          </div>

          <FoundationStrip
            rows={foundation}
            readOnly={readOnly}
            onUpdate={updateFoundation}
          />

          {operator && (
            <OperatorBlock
              operator={operator}
              readOnly={readOnly}
              onUpdate={updateOperator}
            />
          )}

          {capability && (
            <CapabilityCallout
              capability={capability}
              readOnly={readOnly}
              onUpdate={updateCapability}
            />
          )}

          {culture && (
            <CultureColumns
              culture={culture}
              readOnly={readOnly}
              onUpdate={updateCulture}
            />
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 pt-4 pb-10 mono-font text-[11px] text-black/40 tracking-wider">
        KADYLUXE × COAST · TEAM ARCHITECTURE ·{" "}
        {readOnly ? "READ-ONLY VIEW" : "AUTO-SAVES TO POSTGRES"}
      </div>
    </div>
  );
}
