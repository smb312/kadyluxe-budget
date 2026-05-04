import type { Month, Partner } from "./types";

export const calculateAnnualCost = (partner: Partner): number => {
  if (!partner.included) return 0;
  if (partner.type === "annual") return partner.cost;
  const months = partner.months ?? 12;
  return partner.cost * months;
};

export interface Totals {
  fixed: number;
  variable: number;
  total: number;
}

export const calculateTotals = (
  partners: Partner[],
  variable: Record<Month, number>,
): Totals => {
  const fixed = partners.reduce((sum, p) => sum + calculateAnnualCost(p), 0);
  const variableTotal = Object.values(variable).reduce(
    (sum, v) => sum + (v || 0),
    0,
  );
  return { fixed, variable: variableTotal, total: fixed + variableTotal };
};

export const formatCurrency = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const formatCurrencyExact = (n: number): string =>
  `$${Math.round(n).toLocaleString()}`;

export const sumMonths = (
  variable: Record<Month, number>,
  months: Month[],
): number => months.reduce((s, m) => s + (variable[m] || 0), 0);
