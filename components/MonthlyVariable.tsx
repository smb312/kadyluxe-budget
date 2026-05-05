"use client";

import {
  BUILD_MONTHS,
  MAINT_MONTHS,
  MONTHS,
  PEAK_MONTHS,
} from "@/lib/constants";
import { formatCurrency, sumMonths } from "@/lib/calculations";
import type { Month, Scenario } from "@/lib/types";

interface Props {
  variable: Record<Month, number>;
  total: number;
  scenario: Scenario;
  readOnly: boolean;
  onChange: (month: Month, value: number) => void;
}

export default function MonthlyVariable({
  variable,
  total,
  scenario,
  readOnly,
  onChange,
}: Props) {
  const max = Math.max(...Object.values(variable), 0);
  const peakSum = sumMonths(variable, PEAK_MONTHS);

  return (
    <div className="mb-10">
      <div className="mb-4">
        <h2 className="display-font text-2xl font-medium tracking-tight">
          Monthly Variable Spend
        </h2>
        <div className="mono-font text-[11px] text-black/50 mt-1 tracking-wider">
          PAID MEDIA · INFLUENCER ACTIVATIONS · RESERVE · {formatCurrency(total)} ANNUAL
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded p-6">
        <div
          className="grid items-end h-40 mb-4"
          style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 8 }}
        >
          {MONTHS.map((m) => {
            const v = variable[m] || 0;
            const heightPct = max > 0 ? (v / max) * 100 : 0;
            const isPeak = PEAK_MONTHS.includes(m);
            return (
              <div key={m} className="flex flex-col items-center justify-end h-full">
                <div className="mono-font text-[10px] text-black/50 mb-1">
                  {formatCurrency(v)}
                </div>
                <div
                  className="month-bar w-full"
                  style={{
                    height: `${heightPct}%`,
                    background: isPeak ? scenario.color : "rgba(0,0,0,0.25)",
                    borderRadius: "2px 2px 0 0",
                    minHeight: v > 0 ? 4 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          className="grid border-t border-black/10 pt-3"
          style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 8 }}
        >
          {MONTHS.map((m) => {
            const isPeak = PEAK_MONTHS.includes(m);
            return (
              <div key={m} className="flex flex-col items-center gap-1">
                <div
                  className="mono-font font-semibold tracking-wider"
                  style={{
                    fontSize: 11,
                    color: isPeak ? scenario.color : "#1A1A1A",
                  }}
                >
                  {m.toUpperCase()}
                </div>
                <input
                  type="number"
                  value={variable[m] || 0}
                  onChange={(e) => onChange(m, parseFloat(e.target.value) || 0)}
                  className="editable-input w-full text-center"
                  style={{ fontSize: 12 }}
                  disabled={readOnly}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3.5 border-t border-black/10 flex justify-between flex-wrap gap-3 text-xs text-black/60">
          <div>
            <span className="mono-font tracking-wider">BUILD MAY-JUL: </span>
            <strong className="text-ink">
              {formatCurrency(sumMonths(variable, BUILD_MONTHS))}
            </strong>
          </div>
          <div>
            <span className="mono-font tracking-wider">PEAK AUG-JAN: </span>
            <strong style={{ color: scenario.color }}>{formatCurrency(peakSum)}</strong>
          </div>
          <div>
            <span className="mono-font tracking-wider">MAINT FEB-APR: </span>
            <strong className="text-ink">
              {formatCurrency(sumMonths(variable, MAINT_MONTHS))}
            </strong>
          </div>
          <div>
            <span className="mono-font tracking-wider">PEAK % OF TOTAL: </span>
            <strong className="text-ink">
              {total > 0 ? ((peakSum / total) * 100).toFixed(0) : 0}%
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
