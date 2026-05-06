import type { Month, Partner } from "@/lib/types";
import { calculateAnnualCost } from "@/lib/calculations";
import {
  ALL_CASHFLOW_MONTHS,
  CASHFLOW_MONTHS,
  JAN_APR_MONTHS,
  type CashflowAssumptions,
  type CashflowKpis,
  type CashflowMonth,
  type MonthlyRow,
} from "./types";

const BRONCOS_RE = /broncos/i;
const INFLUENCER_RE = /influencer/i;

// Annual fixed retainer cost for the active scenario, with Broncos excluded
// so the cashflow page's own Broncos toggle is the single source of truth.
export const annualFixedRetainer = (partners: Partner[]): number =>
  partners
    .filter((p) => !BRONCOS_RE.test(p.name))
    .reduce((s, p) => s + calculateAnnualCost(p), 0);

// Annual influencer working spend, auto-detected by category.
export const annualInfluencerSpend = (partners: Partner[]): number =>
  partners
    .filter((p) => INFLUENCER_RE.test(p.category))
    .reduce((s, p) => s + calculateAnnualCost(p), 0);

// Per-month allocation: spread evenly over 12 months (per CFO confirmation).
export const monthlyFixedRetainer = (partners: Partner[]): number =>
  annualFixedRetainer(partners) / 12;

export const monthlyInfluencerSpend = (partners: Partner[]): number =>
  annualInfluencerSpend(partners) / 12;

// Lag helpers. Spend in months before May is not modeled, so lag-driven
// revenue in those positions is $0.
const monthShifted = (m: CashflowMonth, n: number): CashflowMonth | null => {
  const idx = CASHFLOW_MONTHS.indexOf(m);
  return idx >= n ? CASHFLOW_MONTHS[idx - n] : null;
};

// Baseline organic revenue for a month.
export const baselineRevenue = (
  month: CashflowMonth,
  a: CashflowAssumptions,
): number => a.baseline_dtc_monthly * (a.seasonality[month] ?? 1);

// Paid revenue this month = paid_spend[lastMonth] × ROAS[thisMonth] (3-week lag).
export const paidRevenue = (
  month: CashflowMonth,
  variable: Record<Month, number>,
  a: CashflowAssumptions,
): number => {
  const src = monthShifted(month, 1);
  if (!src) return 0;
  const roas = a.paid_roas_by_month[month] ?? 0;
  return (variable[src] ?? 0) * roas;
};

// Influencer revenue this month = inf_spend[2 months ago] × inf_ROAS (6-week lag).
export const influencerRevenue = (
  month: CashflowMonth,
  monthlyInf: number,
  a: CashflowAssumptions,
): number => {
  const src = monthShifted(month, 2);
  if (!src) return 0;
  return monthlyInf * a.influencer_roas;
};

// Email is a % of GROSS, where Gross includes email. Solve algebraically.
export const grossAndEmail = (
  baseline: number,
  paid: number,
  influencer: number,
  emailPct: number,
): { gross: number; email: number } => {
  const sub = baseline + paid + influencer;
  if (emailPct >= 1) return { gross: sub, email: 0 };
  const gross = sub / (1 - emailPct);
  return { gross, email: gross - sub };
};

// Build a single Jan–Apr row from manual user input. Net cash = gross × margin
// stays consistent with the May–Dec model; outflows total comes through as-is.
const manualRow = (
  month: (typeof JAN_APR_MONTHS)[number],
  a: CashflowAssumptions,
): Omit<MonthlyRow, "cumulativeNet"> => {
  const data = a.manual_jan_apr[month] ?? { outflows: 0, gross: 0 };
  const outflows = Number.isFinite(data.outflows) ? data.outflows : 0;
  const gross = Number.isFinite(data.gross) ? data.gross : 0;
  const netCash = gross * a.contribution_margin;
  return {
    month,
    manual: true,
    out: {
      fixedRetainer: 0,
      variableWorking: 0,
      scottFee: 0,
      broncos: 0,
      total: outflows,
    },
    in: { baseline: 0, paid: 0, email: 0, influencer: 0, gross, netCash },
    monthlyNet: netCash - outflows,
  };
};

const modeledRow = (
  month: CashflowMonth,
  partners: Partner[],
  variable: Record<Month, number>,
  a: CashflowAssumptions,
  fixedMonthly: number,
  infMonthly: number,
): Omit<MonthlyRow, "cumulativeNet"> => {
  const variableWorking = variable[month] ?? 0;
  const broncos = a.broncos_included ? a.broncos_amount / 12 : 0;
  const outTotal =
    fixedMonthly + variableWorking + a.scott_fee_monthly + broncos;

  const baseline = baselineRevenue(month, a);
  const paid = paidRevenue(month, variable, a);
  const influencer = influencerRevenue(month, infMonthly, a);
  const emailPct = a.email_pct_by_month[month] ?? 0;
  const { gross, email } = grossAndEmail(baseline, paid, influencer, emailPct);
  const netCash = gross * a.contribution_margin;

  return {
    month,
    manual: false,
    out: {
      fixedRetainer: fixedMonthly,
      variableWorking,
      scottFee: a.scott_fee_monthly,
      broncos,
      total: outTotal,
    },
    in: { baseline, paid, email, influencer, gross, netCash },
    monthlyNet: netCash - outTotal,
  };
};

export const computeCashflow = (
  partners: Partner[],
  variable: Record<Month, number>,
  a: CashflowAssumptions,
): MonthlyRow[] => {
  const fixedMonthly = monthlyFixedRetainer(partners);
  const infMonthly = monthlyInfluencerSpend(partners);

  const partial: Omit<MonthlyRow, "cumulativeNet">[] = ALL_CASHFLOW_MONTHS.map(
    (m) => {
      if ((JAN_APR_MONTHS as readonly string[]).includes(m)) {
        return manualRow(m as (typeof JAN_APR_MONTHS)[number], a);
      }
      return modeledRow(
        m as CashflowMonth,
        partners,
        variable,
        a,
        fixedMonthly,
        infMonthly,
      );
    },
  );

  let cumulative = 0;
  return partial.map((row) => {
    cumulative += row.monthlyNet;
    return { ...row, cumulativeNet: cumulative };
  });
};

// KPIs reflect the full 12-month picture. Annual marketing investment sums
// manual Jan–Apr outflows + modeled May–Dec outflows. Annual gross revenue
// likewise. Blended ROAS uses paid working spend over the May–Dec window
// only (the only window where we have paid spend data per spec G).
export const computeKpis = (
  rows: MonthlyRow[],
  a: CashflowAssumptions,
): CashflowKpis => {
  const annualMarketingInvestment = rows.reduce(
    (s, r) => s + r.out.total,
    0,
  );
  const annualGrossRevenue = rows.reduce((s, r) => s + r.in.gross, 0);

  const variableSpendInWindow = rows.reduce(
    (s, r) => s + r.out.variableWorking,
    0,
  );
  const grossInWindow = rows
    .filter((r) => !r.manual)
    .reduce((s, r) => s + r.in.gross, 0);

  const blendedRoas =
    variableSpendInWindow > 0 ? grossInWindow / variableSpendInWindow : 0;

  const customers = a.aov > 0 ? annualGrossRevenue / a.aov : 0;
  const blendedCac = customers > 0 ? variableSpendInWindow / customers : 0;

  return {
    annualMarketingInvestment,
    annualGrossRevenue,
    blendedRoas,
    blendedCac,
    customers,
    variableSpendInWindow,
  };
};
