import type { TeamStatus } from "./types";

export const STATUS_LABEL: Record<TeamStatus, string> = {
  confirmed: "Confirmed / live by June",
  recommended: "Recommended for 2026",
  vision: "2027 vision",
};

interface SeedStage {
  name: string;
  kpi: string;
  position: number;
}

interface SeedPartner {
  stage_position: number;
  name: string;
  partner: string;
  status: TeamStatus;
  position: number;
}

interface SeedFoundation {
  name: string;
  partner: string;
  status: TeamStatus;
  position: number;
}

export const SEED_STAGES: SeedStage[] = [
  { name: "Awareness",     kpi: "Reach, CPM",        position: 0 },
  { name: "Consideration", kpi: "CTR, sessions",     position: 1 },
  { name: "Conversion",    kpi: "CVR, ROAS",         position: 2 },
  { name: "Retention",     kpi: "Repeat rate, LTV",  position: 3 },
  { name: "Advocacy",      kpi: "Referral, UGC",     position: 4 },
];

export const SEED_PARTNERS: SeedPartner[] = [
  // Awareness (0)
  { stage_position: 0, name: "Meta paid social", partner: "Marketer.com",         status: "recommended", position: 0 },
  { stage_position: 0, name: "TikTok organic",   partner: "Savannah + Marketer",  status: "recommended", position: 1 },
  { stage_position: 0, name: "Influencer TOF",   partner: "10pm Curfew",          status: "vision",      position: 2 },
  { stage_position: 0, name: "PR + earned",      partner: "2027 vision",          status: "vision",      position: 3 },

  // Consideration (1)
  { stage_position: 1, name: "Google Ads",      partner: "Marketer.com",  status: "confirmed",   position: 0 },
  { stage_position: 1, name: "SEO + content",   partner: "Kait",          status: "confirmed",   position: 1 },
  { stage_position: 1, name: "Retargeting",     partner: "Marketer.com",  status: "confirmed",   position: 2 },
  { stage_position: 1, name: "Creator content", partner: "10pm Curfew",   status: "recommended", position: 3 },

  // Conversion (2)
  { stage_position: 2, name: "Site CRO",            partner: "D2C Design",        status: "recommended", position: 0 },
  { stage_position: 2, name: "PDP / landing pages", partner: "D2C + Coast",       status: "confirmed",   position: 1 },
  { stage_position: 2, name: "Cart + checkout",     partner: "Shopify + Klaviyo", status: "confirmed",   position: 2 },
  { stage_position: 2, name: "TikTok Shop",         partner: "Somerce",           status: "vision",      position: 3 },

  // Retention (3)
  { stage_position: 3, name: "Email lifecycle", partner: "Klaviyo + Josh",   status: "confirmed", position: 0 },
  { stage_position: 3, name: "SMS",             partner: "Klaviyo SMS",      status: "confirmed", position: 1 },
  { stage_position: 3, name: "VIP / loyalty",   partner: "Klaviyo segments", status: "confirmed", position: 2 },
  { stage_position: 3, name: "Subscription",    partner: "2027 vision",      status: "vision",    position: 3 },

  // Advocacy (4)
  { stage_position: 4, name: "UGC reviews",        partner: "10pm Curfew",   status: "recommended", position: 0 },
  { stage_position: 4, name: "Affiliate",          partner: "Somerce",       status: "vision",      position: 1 },
  { stage_position: 4, name: "Cheerleader posts",  partner: "Direct + Joel", status: "confirmed",   position: 2 },
  { stage_position: 4, name: "Ambassador",         partner: "2027 vision",   status: "vision",      position: 3 },
];

export const SEED_FOUNDATION: SeedFoundation[] = [
  { name: "Tracking + attribution", partner: "PAZ Analytics — pixel + UTM",     status: "recommended", position: 0 },
  { name: "Creative production",    partner: "Keghan + Tacy + BTS Design",      status: "confirmed",   position: 1 },
  { name: "Brand + storytelling",   partner: "Keghan — campaign direction",     status: "confirmed",   position: 2 },
];
