export type ScenarioSlug = string;

export type PartnerType = "annual" | "monthly";

export type Month =
  | "May" | "Jun" | "Jul" | "Aug" | "Sep" | "Oct"
  | "Nov" | "Dec" | "Jan" | "Feb" | "Mar" | "Apr";

export interface Scenario {
  id: string;
  slug: ScenarioSlug;
  name: string;
  pct: number;
  realistic_dtc: string;
  hits_goal: string;
  note: string;
  color: string;
  sort_order: number;
}

export interface Partner {
  id: string;
  scenario_id: string;
  scenario_slug: ScenarioSlug;
  name: string;
  category: string;
  cost: number;
  type: PartnerType;
  months: number | null;
  start_month: Month;
  included: boolean;
  notes: string | null;
  sort_order: number;
}

export interface MonthlyVariableRow {
  scenario_id: string;
  scenario_slug: ScenarioSlug;
  month: Month;
  amount: number;
}

export interface ShareLink {
  token: string;
  created_at: string;
  expires_at: string | null;
  label: string | null;
}

export interface ScenarioState {
  partners: Partner[];
  variable: Record<Month, number>;
}

export type ScenarioBundle = Record<ScenarioSlug, ScenarioState>;
