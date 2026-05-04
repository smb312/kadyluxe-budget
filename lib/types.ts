export type ScenarioKey = "option1" | "option2" | "option3";

export type PartnerType = "annual" | "monthly";

export type Month =
  | "May" | "Jun" | "Jul" | "Aug" | "Sep" | "Oct"
  | "Nov" | "Dec" | "Jan" | "Feb" | "Mar" | "Apr";

export interface Partner {
  id: string;
  scenario_key: ScenarioKey;
  name: string;
  category: string;
  cost: number;
  type: PartnerType;
  months: number | null;
  included: boolean;
  notes: string | null;
  position: number;
}

export interface MonthlyVariableRow {
  scenario_key: ScenarioKey;
  month: Month;
  amount: number;
}

export interface ScenarioMeta {
  key: ScenarioKey;
  name: string;
  pct: number;
  realisticDtc: string;
  hitsGoal: string;
  note: string;
  color: string;
}

export interface ShareLink {
  token: string;
  created_at: string;
  revoked_at: string | null;
}

export interface ScenarioState {
  partners: Partner[];
  variable: Record<Month, number>;
}

export type ScenarioBundle = Record<ScenarioKey, ScenarioState>;
