import type { Month, Partner } from "@/lib/types";
import { calculateAnnualCost, partnerCostInMonth } from "@/lib/calculations";
import { MONTHS } from "@/lib/constants";
import {
  CASHFLOW_MONTHS,
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

// Per-month fixed retainer outflow for a specific calendar month, computed
// from each partner's start_month. Honors the budget tool's onboarding model:
// a partner contributes to month M only if M is in their active range.
export const fixedRetainerInMonth = (
  partners: Partner[],
  month: Month,
): number =>
  partners
    .filter((p) => !BRONCOS_RE.test(p.name))
    .reduce((s, p) => s + partnerCostInMonth(p, month), 0);

// Per-month influencer working spend, auto-detected by category, honoring
// each influencer partner's start_month.
export const influencerSpendInMonth = (
  partners: Partner[],
  month: Month,
): number =>
  partners
    .filter((p) => INFLUENCER_RE.test(p.category))
    .reduce((s, p) => s + partnerCostInMonth(p, month), 0);

// Lag helpers. CASHFLOW_MONTHS only spans May–Dec; spend in months before May
// is not modeled, so revenue in those lag positions is $0.
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
// The lagged spend is now month-specific (varies with start_month).
export const influencerRevenue = (
  month: CashflowMonth,
  partners: Partner[],
  a: CashflowAssumptions,
): number => {
  const src = monthShifted(month, 2);
  if (!src) return 0;
  return influencerSpendInMonth(partners, src) * a.influencer_roas;
};

// Email is a % of GROSS, where Gross includes email. Solve algebraically:
//   sub = baseline + paid + influencer
//   gross = sub / (1 - email_pct)
//   email = gross - sub
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

export const computeCashflow = (
  partners: Partner[],
  variable: Record<Month, number>,
  a: CashflowAssumptions,
): MonthlyRow[] => {
  let cumulative = 0;
  return CASHFLOW_MONTHS.map<MonthlyRow>((m) => {
    const fixedRetainer = fixedRetainerInMonth(partners, m);
    const variableWorking = variable[m] ?? 0;
    const broncos = a.broncos_included ? a.broncos_amount / 12 : 0;
    const outTotal =
      fixedRetainer + variableWorking + a.scott_fee_monthly + broncos;

    const baseline = baselineRevenue(m, a);
    const paid = paidRevenue(m, variable, a);
    const influencer = influencerRevenue(m, partners, a);
    const emailPct = a.email_pct_by_month[m] ?? 0;
    const { gross, email } = grossAndEmail(baseline, paid, influencer, emailPct);
    const monthlyNet = gross - outTotal;
    cumulative += monthlyNet;

    return {
      month: m,
      out: {
        fixedRetainer,
        variableWorking,
        scottFee: a.scott_fee_monthly,
        broncos,
        total: outTotal,
      },
      in: { baseline, paid, email, influencer, gross },
      monthlyNet,
      cumulativeNet: cumulative,
    };
  });
};

// KPIs.
//   Annual marketing investment uses full-year (12-month) data — partner
//   retainers are constant year-round, variable working spend sums all 12
//   months from the budget bundle, Scott's fee × 12, plus Broncos if included.
//
//   Revenue / ROAS / CAC use the in-window (May–Dec) projection only — that's
//   the only window we model. Blended ROAS uses paid working spend as the
//   denominator (ex-fees) per spec.
export const computeKpis = (
  rows: MonthlyRow[],
  partners: Partner[],
  variable: Record<Month, number>,
  a: CashflowAssumptions,
): CashflowKpis => {
  const fixedAnnual = annualFixedRetainer(partners);
  const variableAnnual = MONTHS.reduce((s, m) => s + (variable[m] ?? 0), 0);
  const annualMarketingInvestment =
    fixedAnnual +
    variableAnnual +
    a.scott_fee_monthly * 12 +
    (a.broncos_included ? a.broncos_amount : 0);

  const windowGrossRevenue = rows.reduce((s, r) => s + r.in.gross, 0);
  const variableSpendInWindow = rows.reduce(
    (s, r) => s + r.out.variableWorking,
    0,
  );

  const blendedRoas =
    variableSpendInWindow > 0 ? windowGrossRevenue / variableSpendInWindow : 0;

  const customers = a.aov > 0 ? windowGrossRevenue / a.aov : 0;
  const blendedCac = customers > 0 ? variableSpendInWindow / customers : 0;

  return {
    annualMarketingInvestment,
    windowGrossRevenue,
    blendedRoas,
    blendedCac,
    customers,
    variableSpendInWindow,
  };
};
