import { MONTHS } from "./constants";
import type { Month, Partner } from "./types";

// Months a partner is active = start_month through end of fiscal year (Apr).
// MONTHS array runs [May, Jun, ..., Apr] so a slice from the start works.
export const partnerActiveMonths = (startMonth: Month): Month[] => {
  const idx = MONTHS.indexOf(startMonth);
  if (idx < 0) return MONTHS;
  return MONTHS.slice(idx);
};

const isActiveInMonth = (partner: Partner, month: Month): boolean =>
  partnerActiveMonths(partner.start_month).includes(month);

// Total annual cost (used for the "Annual" column in the budget table).
//   Monthly partner: cost × number of active months
//   Annual partner: cost (fixed regardless of start_month)
export const calculateAnnualCost = (partner: Partner): number => {
  if (!partner.included) return 0;
  if (partner.type === "annual") return partner.cost;
  return partner.cost * partnerActiveMonths(partner.start_month).length;
};

// Cash outflow for this partner in a specific month.
//   Monthly partner: cost in active months, 0 otherwise
//   Annual partner: total cost spread evenly across active months
export const partnerCostInMonth = (partner: Partner, month: Month): number => {
  if (!partner.included) return 0;
  if (!isActiveInMonth(partner, month)) return 0;
  const active = partnerActiveMonths(partner.start_month).length;
  if (active === 0) return 0;
  if (partner.type === "annual") return partner.cost / active;
  return partner.cost;
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
