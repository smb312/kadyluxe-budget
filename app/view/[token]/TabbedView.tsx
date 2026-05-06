"use client";

import { useState } from "react";
import BudgetTool from "@/components/BudgetTool";
import TeamArchitecture from "@/components/TeamArchitecture";
import type { BudgetData } from "@/lib/data";
import type { TeamData } from "@/lib/team/types";

type Tab = "budget" | "team";

interface Props {
  ownerEmail: string | null;
  budget: BudgetData;
  team: TeamData;
}

export default function TabbedView({ ownerEmail, budget, team }: Props) {
  const [tab, setTab] = useState<Tab>("budget");

  return (
    <div>
      <div className="bg-ink text-cream sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-8 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="mono-font text-[10px] tracking-[0.18em] uppercase mr-3">
              VIEW ONLY
            </span>
            <button
              onClick={() => setTab("budget")}
              className={
                "px-3 py-1 rounded-sm text-xs transition-colors " +
                (tab === "budget"
                  ? "bg-cream text-ink"
                  : "text-cream/70 hover:text-cream hover:bg-white/10")
              }
            >
              Budget
            </button>
            <button
              onClick={() => setTab("team")}
              className={
                "px-3 py-1 rounded-sm text-xs transition-colors " +
                (tab === "team"
                  ? "bg-cream text-ink"
                  : "text-cream/70 hover:text-cream hover:bg-white/10")
              }
            >
              Team
            </button>
          </div>
          {ownerEmail && (
            <div className="mono-font text-[11px] text-cream/70">
              Owner: {ownerEmail}
            </div>
          )}
        </div>
      </div>

      {tab === "budget" ? (
        <BudgetTool
          scenarios={budget.scenarios}
          initialBundle={budget.bundle}
          initialShareLinks={[]}
          userEmail={ownerEmail}
          mode="view"
        />
      ) : (
        <TeamArchitecture
          initial={team}
          userEmail={ownerEmail}
          mode="view"
        />
      )}
    </div>
  );
}
