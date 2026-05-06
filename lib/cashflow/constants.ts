import type { CashflowAssumptions, MonthMap } from "./types";

export const DEFAULT_SEASONALITY: MonthMap = {
  May: 0.5, Jun: 0.6, Jul: 0.8, Aug: 1.4,
  Sep: 1.6, Oct: 1.4, Nov: 1.8, Dec: 1.5,
};

export const DEFAULT_PAID_ROAS: MonthMap = {
  May: 2.0, Jun: 2.2, Jul: 2.5, Aug: 3.0,
  Sep: 3.5, Oct: 3.5, Nov: 3.5, Dec: 3.0,
};

export const DEFAULT_EMAIL_PCT: MonthMap = {
  May: 0.05, Jun: 0.07, Jul: 0.10, Aug: 0.12,
  Sep: 0.15, Oct: 0.18, Nov: 0.20, Dec: 0.20,
};

export const DEFAULT_ASSUMPTIONS: Omit<CashflowAssumptions, "user_id"> = {
  baseline_dtc_monthly: 40_000,
  seasonality: DEFAULT_SEASONALITY,
  paid_roas_by_month: DEFAULT_PAID_ROAS,
  influencer_roas: 2.5,
  email_pct_by_month: DEFAULT_EMAIL_PCT,
  aov: 155,
  site_cvr: 0.013,
  contribution_margin: 0.35,
  paid_lag_weeks: 3,
  influencer_lag_weeks: 6,
  scott_fee_monthly: 12_000,
  broncos_included: false,
  broncos_amount: 150_000,
  selected_scenario_slug: "option3",
};

export const TOOLTIPS = {
  baseline_dtc_monthly:
    "Monthly DTC revenue from organic + repeat traffic with no marketing spend. $40K is the floor implied by recent owned-channel performance.",
  seasonality:
    "Multiplier on the baseline for each month. Reflects football-season concentration (Aug–Dec peak).",
  paid_roas:
    "Blended ROAS across Meta + Google + TikTok by month. Lower in May/Jun (cold audiences, learning), peaks Sep–Nov.",
  influencer_roas:
    "Single ROAS multiplier on influencer/creator working spend. Conservative versus paid social due to attribution uncertainty.",
  email_pct:
    "Email + SMS as a % of total revenue. Industry benchmark for premium DTC apparel is 25–35% at peak; we ramp from 5% to 20%.",
  aov:
    "Average order value. Used in CAC math and as a sanity check.",
  site_cvr:
    "Site-wide conversion rate. Displayed only — not used in revenue math, which goes through ROAS.",
  contribution_margin:
    "(Revenue − COGS − royalty) / revenue. Conservative 35% reflects the licensing structure.",
  paid_lag:
    "Weeks between ad spend and attributed revenue. 3 weeks ≈ first impression → consideration → purchase. Modeled as: revenue this month = paid spend last month × ROAS this month.",
  influencer_lag:
    "Weeks between influencer post and attributed revenue. Longer than paid: content has to circulate. Modeled as a 2-month shift.",
  scott_fee:
    "Fractional CMO retainer. Fixed monthly cash outflow.",
  broncos:
    "Sponsorship is now categorized as licensing. Toggle on if you want it in the marketing cash flow.",
};
