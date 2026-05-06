export type TeamStatus = "confirmed" | "recommended" | "vision";

export interface TeamStage {
  id: string;
  name: string;
  kpi: string;
  position: number;
}

export interface TeamPartner {
  id: string;
  stage_id: string;
  name: string;
  partner: string;
  status: TeamStatus;
  position: number;
}

export interface TeamFoundation {
  id: string;
  name: string;
  partner: string;
  status: TeamStatus;
  position: number;
}

export interface TeamSettings {
  user_id: string;
  operator_name: string;
  operator_description: string;
  lever_title: string;
  lever_description: string;
  what_it_is: string[];
  what_it_is_not: string[];
}

export interface TeamData {
  stages: TeamStage[];
  partners: TeamPartner[];
  foundation: TeamFoundation[];
  settings: TeamSettings | null;
}

export const MAX_PARTNERS_PER_STAGE = 6;
