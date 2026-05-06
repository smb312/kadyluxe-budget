"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { CASHFLOW_MONTHS } from "@/lib/cashflow/types";
import type { CashflowAssumptions, MonthMap } from "@/lib/cashflow/types";
import { TOOLTIPS } from "@/lib/cashflow/constants";

interface Props {
  assumptions: CashflowAssumptions;
  onPatch: (patch: Partial<CashflowAssumptions>) => void;
}

const Tip = ({ text }: { text: string }) => (
  <span title={text} className="inline-flex items-center text-black/35 hover:text-black/70 cursor-help align-middle">
    <HelpCircle size={11} />
  </span>
);

interface NumInputProps {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  width?: number;
  prefix?: string;
  suffix?: string;
}

function NumInput({ value, onChange, step = 1, width = 80, prefix, suffix }: NumInputProps) {
  return (
    <div className="inline-flex items-center gap-1">
      {prefix && <span className="mono-font text-[11px] text-black/45">{prefix}</span>}
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="mono-font text-[11.5px] tabular-nums text-right bg-white border border-black/15 rounded px-1.5 py-1 focus:outline-none focus:border-ink"
        style={{ width }}
      />
      {suffix && <span className="mono-font text-[11px] text-black/45">{suffix}</span>}
    </div>
  );
}

interface MonthlyRowProps {
  label: string;
  tooltip: string;
  values: MonthMap;
  onChange: (next: MonthMap) => void;
  step: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => number;
  display?: (n: number) => number;
}

function MonthlyRow({
  label,
  tooltip,
  values,
  onChange,
  step,
  prefix,
  suffix,
  format,
  display,
}: MonthlyRowProps) {
  return (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px repeat(8, 1fr)" }}>
      <div className="text-[11.5px] flex items-center gap-1.5">
        {label} <Tip text={tooltip} />
      </div>
      {CASHFLOW_MONTHS.map((m) => {
        const raw = values[m] ?? 0;
        const shown = display ? display(raw) : raw;
        return (
          <NumInput
            key={m}
            value={shown}
            step={step}
            prefix={prefix}
            suffix={suffix}
            width={70}
            onChange={(n) => {
              const stored = format ? format(n) : n;
              onChange({ ...values, [m]: stored });
            }}
          />
        );
      })}
    </div>
  );
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-black/10 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-2.5 text-left mono-font text-[10px] tracking-[0.18em] uppercase text-black/60 hover:text-ink"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div className="pb-4 flex flex-col gap-2.5">{children}</div>}
    </div>
  );
}

export default function AssumptionsPanel({ assumptions, onPatch }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white border border-black/10 rounded-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="display-font font-medium text-[15px]">Assumptions</span>
          <span className="mono-font text-[10px] tracking-[0.12em] uppercase text-black/45">
            editable · auto-saves
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <Section title="Baseline organic & seasonality">
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Baseline DTC monthly <Tip text={TOOLTIPS.baseline_dtc_monthly} />
              </div>
              <div>
                <NumInput
                  value={assumptions.baseline_dtc_monthly}
                  step={1000}
                  prefix="$"
                  width={110}
                  onChange={(n) => onPatch({ baseline_dtc_monthly: n })}
                />
              </div>
            </div>
            <MonthlyRow
              label="Seasonality multiplier"
              tooltip={TOOLTIPS.seasonality}
              values={assumptions.seasonality}
              step={0.1}
              onChange={(next) => onPatch({ seasonality: next })}
            />
          </Section>

          <Section title="Paid media ROAS">
            <MonthlyRow
              label="Paid ROAS"
              tooltip={TOOLTIPS.paid_roas}
              values={assumptions.paid_roas_by_month}
              step={0.1}
              suffix="x"
              onChange={(next) => onPatch({ paid_roas_by_month: next })}
            />
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Paid revenue lag <Tip text={TOOLTIPS.paid_lag} />
              </div>
              <div>
                <NumInput
                  value={assumptions.paid_lag_weeks}
                  step={1}
                  suffix="weeks"
                  width={70}
                  onChange={(n) => onPatch({ paid_lag_weeks: n })}
                />
                <span className="ml-3 text-[11px] text-black/45">
                  (display only — math uses 1-month shift)
                </span>
              </div>
            </div>
          </Section>

          <Section title="Email" defaultOpen={false}>
            <MonthlyRow
              label="Email % of total revenue"
              tooltip={TOOLTIPS.email_pct}
              values={assumptions.email_pct_by_month}
              step={1}
              suffix="%"
              format={(n) => n / 100}
              display={(n) => Math.round(n * 100)}
              onChange={(next) => onPatch({ email_pct_by_month: next })}
            />
          </Section>

          <Section title="Influencer" defaultOpen={false}>
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Influencer ROAS <Tip text={TOOLTIPS.influencer_roas} />
              </div>
              <div>
                <NumInput
                  value={assumptions.influencer_roas}
                  step={0.1}
                  suffix="x"
                  width={70}
                  onChange={(n) => onPatch({ influencer_roas: n })}
                />
              </div>
            </div>
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Influencer revenue lag <Tip text={TOOLTIPS.influencer_lag} />
              </div>
              <div>
                <NumInput
                  value={assumptions.influencer_lag_weeks}
                  step={1}
                  suffix="weeks"
                  width={70}
                  onChange={(n) => onPatch({ influencer_lag_weeks: n })}
                />
                <span className="ml-3 text-[11px] text-black/45">
                  (display only — math uses 2-month shift)
                </span>
              </div>
            </div>
          </Section>

          <Section title="Unit economics" defaultOpen={false}>
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                AOV <Tip text={TOOLTIPS.aov} />
              </div>
              <NumInput
                value={assumptions.aov}
                step={5}
                prefix="$"
                width={90}
                onChange={(n) => onPatch({ aov: n })}
              />
            </div>
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Site CVR <Tip text={TOOLTIPS.site_cvr} />
              </div>
              <NumInput
                value={Number((assumptions.site_cvr * 100).toFixed(2))}
                step={0.1}
                suffix="%"
                width={70}
                onChange={(n) => onPatch({ site_cvr: n / 100 })}
              />
            </div>
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Contribution margin <Tip text={TOOLTIPS.contribution_margin} />
              </div>
              <NumInput
                value={Math.round(assumptions.contribution_margin * 100)}
                step={1}
                suffix="%"
                width={70}
                onChange={(n) => onPatch({ contribution_margin: n / 100 })}
              />
            </div>
          </Section>

          <Section title="Outflow overrides" defaultOpen={false}>
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Scott Bauer fee / month <Tip text={TOOLTIPS.scott_fee} />
              </div>
              <NumInput
                value={assumptions.scott_fee_monthly}
                step={500}
                prefix="$"
                width={110}
                onChange={(n) => onPatch({ scott_fee_monthly: n })}
              />
            </div>
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="text-[11.5px] flex items-center gap-1.5">
                Broncos sponsorship <Tip text={TOOLTIPS.broncos} />
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-[11.5px]">
                  <input
                    type="checkbox"
                    checked={assumptions.broncos_included}
                    onChange={(e) => onPatch({ broncos_included: e.target.checked })}
                  />
                  Include
                </label>
                <NumInput
                  value={assumptions.broncos_amount}
                  step={5000}
                  prefix="$"
                  suffix="annual"
                  width={110}
                  onChange={(n) => onPatch({ broncos_amount: n })}
                />
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
