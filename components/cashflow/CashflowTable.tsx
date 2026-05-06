"use client";

import type { CashflowAssumptions, MonthlyRow } from "@/lib/cashflow/types";
import { CASHFLOW_MONTHS } from "@/lib/cashflow/types";

interface Props {
  rows: MonthlyRow[];
  assumptions: CashflowAssumptions;
}

const fmt = (n: number): string => {
  if (n === 0) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

interface DataRowProps {
  label: string;
  values: number[];
  total?: number;
  bold?: boolean;
  italic?: boolean;
  highlight?: "outflow" | "inflow" | "net" | null;
  cumulative?: boolean;
  rowIndex: number;
}

function DataRow({
  label,
  values,
  total,
  bold,
  italic,
  highlight,
  cumulative,
  rowIndex,
}: DataRowProps) {
  const sum = total ?? values.reduce((s, v) => s + v, 0);
  const labelColor =
    highlight === "outflow"
      ? "text-clay"
      : highlight === "inflow"
        ? "text-teal-text"
        : highlight === "net"
          ? "text-ink"
          : "text-ink";
  const zebra = rowIndex % 2 === 1 ? "bg-black/[0.025]" : "bg-transparent";
  const fontWeight = bold ? "font-semibold" : italic ? "italic font-normal" : "font-normal";

  return (
    <tr className={zebra}>
      <td
        className={`px-3 py-1.5 text-[11.5px] ${fontWeight} ${labelColor} whitespace-nowrap`}
      >
        {label}
      </td>
      {values.map((v, i) => {
        const isNeg = cumulative && v < 0;
        return (
          <td
            key={i}
            className={`px-2 py-1.5 mono-font text-[11.5px] text-right tabular-nums ${
              isNeg ? "text-clay" : ""
            } ${bold ? "font-semibold" : ""}`}
          >
            {fmt(v)}
          </td>
        );
      })}
      <td
        className={`px-3 py-1.5 mono-font text-[11.5px] text-right tabular-nums border-l border-black/10 ${
          bold ? "font-semibold" : ""
        }`}
      >
        {fmt(sum)}
      </td>
    </tr>
  );
}

interface SectionHeaderProps {
  label: string;
  accent: "outflow" | "inflow" | "net";
}

function SectionHeader({ label, accent }: SectionHeaderProps) {
  const color =
    accent === "outflow"
      ? "text-clay border-clay/40"
      : accent === "inflow"
        ? "text-teal-text border-teal-border"
        : "text-ink border-black/30";
  return (
    <tr>
      <td
        colSpan={CASHFLOW_MONTHS.length + 2}
        className={`mono-font text-[10px] tracking-[0.18em] uppercase pt-4 pb-1.5 px-3 border-b ${color}`}
      >
        {label}
      </td>
    </tr>
  );
}

export default function CashflowTable({ rows, assumptions }: Props) {
  const out = (key: keyof MonthlyRow["out"]) => rows.map((r) => r.out[key]);
  const inn = (key: keyof MonthlyRow["in"]) => rows.map((r) => r.in[key]);
  const monthlyNet = rows.map((r) => r.monthlyNet);
  const cumulativeNet = rows.map((r) => r.cumulativeNet);

  return (
    <div className="bg-white border border-black/10 rounded-md overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-black/[0.04] border-b border-black/15">
            <th className="text-left px-3 py-2 mono-font text-[10px] tracking-[0.12em] uppercase text-black/55 font-normal">
              Line item
            </th>
            {CASHFLOW_MONTHS.map((m) => (
              <th
                key={m}
                className="px-2 py-2 mono-font text-[10px] tracking-[0.12em] uppercase text-black/55 font-normal text-right"
              >
                {m}
              </th>
            ))}
            <th className="px-3 py-2 mono-font text-[10px] tracking-[0.12em] uppercase text-black/55 font-normal text-right border-l border-black/10">
              Annual
            </th>
          </tr>
        </thead>
        <tbody>
          <SectionHeader label="Outflows" accent="outflow" />
          <DataRow
            label="Fixed partner retainers"
            values={out("fixedRetainer")}
            highlight="outflow"
            rowIndex={0}
          />
          <DataRow
            label="Variable working spend"
            values={out("variableWorking")}
            highlight="outflow"
            rowIndex={1}
          />
          <DataRow
            label="Scott Bauer fee"
            values={out("scottFee")}
            highlight="outflow"
            rowIndex={2}
          />
          {assumptions.broncos_included && (
            <DataRow
              label="Broncos sponsorship"
              values={out("broncos")}
              highlight="outflow"
              rowIndex={3}
            />
          )}
          <DataRow
            label="TOTAL OUTFLOWS"
            values={out("total")}
            bold
            highlight="outflow"
            rowIndex={assumptions.broncos_included ? 4 : 3}
          />

          <SectionHeader label="Inflows" accent="inflow" />
          <DataRow
            label="Baseline organic revenue"
            values={inn("baseline")}
            highlight="inflow"
            rowIndex={0}
          />
          <DataRow
            label="Paid-driven revenue (3-wk lag)"
            values={inn("paid")}
            highlight="inflow"
            rowIndex={1}
          />
          <DataRow
            label="Email-driven revenue"
            values={inn("email")}
            highlight="inflow"
            rowIndex={2}
          />
          <DataRow
            label="Influencer-driven revenue (6-wk lag)"
            values={inn("influencer")}
            highlight="inflow"
            rowIndex={3}
          />
          <DataRow
            label="GROSS REVENUE"
            values={inn("gross")}
            bold
            highlight="inflow"
            rowIndex={4}
          />

          <SectionHeader label="Net position" accent="net" />
          <tr className="bg-black/[0.04]">
            <td className="px-3 py-2 text-[11.5px] font-semibold whitespace-nowrap">
              Monthly net (gross revenue − outflows)
            </td>
            {monthlyNet.map((v, i) => (
              <td
                key={i}
                className={`px-2 py-2 mono-font text-[11.5px] text-right tabular-nums font-semibold ${
                  v < 0 ? "text-clay" : ""
                }`}
              >
                {fmt(v)}
              </td>
            ))}
            <td className="px-3 py-2 mono-font text-[11.5px] text-right tabular-nums font-semibold border-l border-black/10">
              {fmt(monthlyNet.reduce((s, v) => s + v, 0))}
            </td>
          </tr>
          <tr className="bg-ink text-cream">
            <td className="px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap">
              Cumulative net position
            </td>
            {cumulativeNet.map((v, i) => (
              <td
                key={i}
                className={`px-2 py-2.5 mono-font text-[12px] text-right tabular-nums font-semibold ${
                  v < 0 ? "text-clay" : ""
                }`}
              >
                {fmt(v)}
              </td>
            ))}
            <td className="px-3 py-2.5 mono-font text-[12px] text-right tabular-nums font-semibold border-l border-cream/20">
              {fmt(cumulativeNet[cumulativeNet.length - 1] ?? 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
