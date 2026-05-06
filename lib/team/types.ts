export type TeamStatus = "confirmed" | "recommended" | "vision";

export type StageSlug =
  | "awareness"
  | "consideration"
  | "conversion"
  | "retention"
  | "advocacy";

export interface TeamStage {
  id: string;
  slug: StageSlug;
  name: string;
  sub_label: string;
  kpi: string;
  sort_order: number;
}

export interface TeamPartner {
  id: string;
  stage_id: string;
  stage_slug: StageSlug;
  name: string;
  vendor: string;
  status: TeamStatus;
  sort_order: number;
}

export interface TeamFoundation {
  id: string;
  name: string;
  vendor: string;
  status: TeamStatus;
  sort_order: number;
}

export interface TeamOperator {
  id: string;
  name: string;
  tagline: string;
  body: string;
}

export interface TeamCapability {
  id: string;
  section_title: string;
  callout_title: string;
  callout_body: string;
}

export interface TeamCulture {
  id: string;
  is_list: string[];
  is_not_list: string[];
}

export interface TeamData {
  stages: TeamStage[];
  partners: TeamPartner[];
  foundation: TeamFoundation[];
  operator: TeamOperator | null;
  capability: TeamCapability | null;
  culture: TeamCulture | null;
}

export const MAX_PARTNERS_PER_STAGE = 6;
