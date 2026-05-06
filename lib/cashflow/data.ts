import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_ASSUMPTIONS, DEFAULT_MANUAL_JAN_APR } from "./constants";
import type { CashflowAssumptions, ManualJanApr, MonthMap } from "./types";

const toNumber = (v: unknown, fallback: number): number => {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toMonthMap = (v: unknown, fallback: MonthMap): MonthMap => {
  if (!v || typeof v !== "object") return fallback;
  const out: MonthMap = { ...fallback };
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
};

const toManualJanApr = (v: unknown, fallback: ManualJanApr): ManualJanApr => {
  if (!v || typeof v !== "object") return fallback;
  const out: ManualJanApr = {
    Jan: { ...fallback.Jan },
    Feb: { ...fallback.Feb },
    Mar: { ...fallback.Mar },
    Apr: { ...fallback.Apr },
  };
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const cell = raw as Record<string, unknown>;
    const outflows = Number(cell.outflows);
    const gross = Number(cell.gross);
    out[k] = {
      outflows: Number.isFinite(outflows) ? outflows : 0,
      gross: Number.isFinite(gross) ? gross : 0,
    };
  }
  return out;
};

const rowToAssumptions = (row: Record<string, unknown>): CashflowAssumptions => ({
  user_id: String(row.user_id ?? ""),
  baseline_dtc_monthly: toNumber(
    row.baseline_dtc_monthly,
    DEFAULT_ASSUMPTIONS.baseline_dtc_monthly,
  ),
  seasonality: toMonthMap(row.seasonality, DEFAULT_ASSUMPTIONS.seasonality),
  paid_roas_by_month: toMonthMap(
    row.paid_roas_by_month,
    DEFAULT_ASSUMPTIONS.paid_roas_by_month,
  ),
  influencer_roas: toNumber(
    row.influencer_roas,
    DEFAULT_ASSUMPTIONS.influencer_roas,
  ),
  email_pct_by_month: toMonthMap(
    row.email_pct_by_month,
    DEFAULT_ASSUMPTIONS.email_pct_by_month,
  ),
  aov: toNumber(row.aov, DEFAULT_ASSUMPTIONS.aov),
  site_cvr: toNumber(row.site_cvr, DEFAULT_ASSUMPTIONS.site_cvr),
  contribution_margin: toNumber(
    row.contribution_margin,
    DEFAULT_ASSUMPTIONS.contribution_margin,
  ),
  paid_lag_weeks: toNumber(row.paid_lag_weeks, DEFAULT_ASSUMPTIONS.paid_lag_weeks),
  influencer_lag_weeks: toNumber(
    row.influencer_lag_weeks,
    DEFAULT_ASSUMPTIONS.influencer_lag_weeks,
  ),
  scott_fee_monthly: toNumber(
    row.scott_fee_monthly,
    DEFAULT_ASSUMPTIONS.scott_fee_monthly,
  ),
  broncos_included: Boolean(row.broncos_included ?? DEFAULT_ASSUMPTIONS.broncos_included),
  broncos_amount: toNumber(row.broncos_amount, DEFAULT_ASSUMPTIONS.broncos_amount),
  selected_scenario_slug: String(
    row.selected_scenario_slug ?? DEFAULT_ASSUMPTIONS.selected_scenario_slug,
  ),
  manual_jan_apr: toManualJanApr(row.manual_jan_apr, DEFAULT_MANUAL_JAN_APR),
});

export const loadCashflowAssumptions = async (
  userId: string,
): Promise<CashflowAssumptions> => {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("cashflow_assumptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return rowToAssumptions(existing);

  // Insert defaults. Column defaults populate the textual JSONB shape; we still
  // pass user_id explicitly. Re-read to materialize the row with column defaults.
  const { error: insertError } = await admin
    .from("cashflow_assumptions")
    .insert({ user_id: userId });
  if (insertError) {
    console.error("seed cashflow_assumptions error", insertError);
    return { user_id: userId, ...DEFAULT_ASSUMPTIONS };
  }

  const { data: row } = await admin
    .from("cashflow_assumptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return row
    ? rowToAssumptions(row)
    : { user_id: userId, ...DEFAULT_ASSUMPTIONS };
};
