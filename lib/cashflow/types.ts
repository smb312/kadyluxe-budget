import type { Month } from "@/lib/types";

export const JAN_APR_MONTHS = ["Jan", "Feb", "Mar", "Apr"] as const;
export type JanAprMonth = (typeof JAN_APR_MONTHS)[number];

export const CASHFLOW_MONTHS = [
  "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;
export type CashflowMonth = (typeof CASHFLOW_MONTHS)[number];

export const ALL_CASHFLOW_MONTHS = [
  ...JAN_APR_MONTHS,
  ...CASHFLOW_MONTHS,
] as const;
export type AnyCashflowMonth = (typeof ALL_CASHFLOW_MONTHS)[number];

// JSONB columns are stored with the 8 cashflow months as keys.
// Using string for runtime safety (extra/missing keys won't crash the math).
export type MonthMap = Record<string, number>;

export interface ManualMonthData {
  outflows: number;
  gross: number;
}
export type ManualJanApr = Record<string, ManualMonthData>;

export interface CashflowAssumptions {
  user_id: string;
  baseline_dtc_monthly: number;
  seasonality: MonthMap;
  paid_roas_by_month: MonthMap;
  influencer_roas: number;
  email_pct_by_month: MonthMap;
  aov: number;
  site_cvr: number;
  contribution_margin: number;
  paid_lag_weeks: number;
  influencer_lag_weeks: number;
  scott_fee_monthly: number;
  broncos_included: boolean;
  broncos_amount: number;
  selected_scenario_slug: string;
  manual_jan_apr: ManualJanApr;
}

export interface MonthlyOutflows {
  fixedRetainer: number;
  variableWorking: number;
  scottFee: number;
  broncos: number;
  total: number;
}

export interface MonthlyInflows {
  baseline: number;
  paid: number;
  email: number;
  influencer: number;
  gross: number;
  netCash: number;
}

export interface MonthlyRow {
  month: AnyCashflowMonth;
  manual: boolean;
  out: MonthlyOutflows;
  in: MonthlyInflows;
  monthlyNet: number;
  cumulativeNet: number;
}

export interface CashflowKpis {
  annualMarketingInvestment: number;
  annualGrossRevenue: number;
  blendedRoas: number;
  blendedCac: number;
  customers: number;
  variableSpendInWindow: number;
}

// Helper for the Month-typed variable lookup from the budget bundle.
export const isCashflowMonth = (m: Month): m is CashflowMonth =>
  (CASHFLOW_MONTHS as readonly string[]).includes(m);

