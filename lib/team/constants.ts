import type { StageSlug, TeamStatus } from "./types";

export const STATUS_LABEL: Record<TeamStatus, string> = {
  confirmed: "Confirmed / live by June",
  recommended: "Recommended for 2026",
  vision: "2027 vision",
};

export const STAGE_SLUGS: StageSlug[] = [
  "awareness",
  "consideration",
  "conversion",
  "retention",
  "advocacy",
];

interface SeedStage {
  slug: StageSlug;
  name: string;
  sub_label: string;
  kpi: string;
  sort_order: number;
}

interface SeedPartner {
  stage_slug: StageSlug;
  name: string;
  vendor: string;
  status: TeamStatus;
  sort_order: number;
}

interface SeedFoundation {
  name: string;
  vendor: string;
  status: TeamStatus;
  sort_order: number;
}

export const SEED_STAGES: SeedStage[] = [
  { slug: "awareness",     name: "Awareness",     sub_label: "Reached",   kpi: "Reach, CPM",        sort_order: 0 },
  { slug: "consideration", name: "Consideration", sub_label: "Engaged",   kpi: "CTR, sessions",     sort_order: 1 },
  { slug: "conversion",    name: "Conversion",    sub_label: "Purchased", kpi: "CVR, ROAS",         sort_order: 2 },
  { slug: "retention",     name: "Retention",     sub_label: "Repeat",    kpi: "Repeat rate, LTV",  sort_order: 3 },
  { slug: "advocacy",      name: "Advocacy",      sub_label: "Referred",  kpi: "Referral, UGC",     sort_order: 4 },
];

export const SEED_PARTNERS: SeedPartner[] = [
  // Awareness
  { stage_slug: "awareness", name: "Meta paid social", vendor: "Marketer.com",         status: "recommended", sort_order: 0 },
  { stage_slug: "awareness", name: "TikTok organic",   vendor: "Savannah + Marketer",  status: "recommended", sort_order: 1 },
  { stage_slug: "awareness", name: "Influencer TOF",   vendor: "10pm Curfew",          status: "vision",      sort_order: 2 },
  { stage_slug: "awareness", name: "PR + earned",      vendor: "2027 vision",          status: "vision",      sort_order: 3 },

  // Consideration
  { stage_slug: "consideration", name: "Google Ads",      vendor: "Marketer.com",  status: "confirmed",   sort_order: 0 },
  { stage_slug: "consideration", name: "SEO + content",   vendor: "Kait",          status: "confirmed",   sort_order: 1 },
  { stage_slug: "consideration", name: "Retargeting",     vendor: "Marketer.com",  status: "confirmed",   sort_order: 2 },
  { stage_slug: "consideration", name: "Creator content", vendor: "10pm Curfew",   status: "recommended", sort_order: 3 },

  // Conversion
  { stage_slug: "conversion", name: "Site CRO",            vendor: "D2C Design",        status: "recommended", sort_order: 0 },
  { stage_slug: "conversion", name: "PDP / landing pages", vendor: "D2C + Coast",       status: "confirmed",   sort_order: 1 },
  { stage_slug: "conversion", name: "Cart + checkout",     vendor: "Shopify + Klaviyo", status: "confirmed",   sort_order: 2 },
  { stage_slug: "conversion", name: "TikTok Shop",         vendor: "Somerce",           status: "vision",      sort_order: 3 },

  // Retention
  { stage_slug: "retention", name: "Email lifecycle", vendor: "Klaviyo + Josh",   status: "confirmed", sort_order: 0 },
  { stage_slug: "retention", name: "SMS",             vendor: "Klaviyo SMS",      status: "confirmed", sort_order: 1 },
  { stage_slug: "retention", name: "VIP / loyalty",   vendor: "Klaviyo segments", status: "confirmed", sort_order: 2 },
  { stage_slug: "retention", name: "Subscription",    vendor: "2027 vision",      status: "vision",    sort_order: 3 },

  // Advocacy
  { stage_slug: "advocacy", name: "UGC reviews",        vendor: "10pm Curfew",  status: "recommended", sort_order: 0 },
  { stage_slug: "advocacy", name: "Affiliate",          vendor: "Somerce",      status: "vision",      sort_order: 1 },
  { stage_slug: "advocacy", name: "Cheerleader posts",  vendor: "Direct + Joel", status: "confirmed",  sort_order: 2 },
  { stage_slug: "advocacy", name: "Ambassador",         vendor: "2027 vision",  status: "vision",      sort_order: 3 },
];

export const SEED_FOUNDATION: SeedFoundation[] = [
  { name: "Tracking + attribution", vendor: "PAZ Analytics — pixel + UTM",     status: "recommended", sort_order: 0 },
  { name: "Creative production",    vendor: "Keghan + Tacy + BTS Design",      status: "confirmed",   sort_order: 1 },
  { name: "Brand + storytelling",   vendor: "Keghan — campaign direction",     status: "confirmed",   sort_order: 2 },
];

export const SEED_OPERATOR = {
  name: "Scott Bauer — fractional CMO via Coast",
  tagline: "Strategy. Vendor coordination. Budget allocation. Channel integration.",
  body: "The connective tissue across every stage above and every partner below.",
};

export const SEED_CAPABILITY = {
  section_title: "Lever-pulling capability — the August 2026 deliverable",
  callout_title: "24-hour team-specific deployment",
  callout_body:
    "When LSU goes 4-0 in week 4, the system deploys a full LSU campaign — paid ads, team-segmented email, influencer activations, and landing page — within 24 hours. Not 2 weeks. This is what the foundation buys: speed at peak season.",
};

export const SEED_CULTURE = {
  is_list: [
    "Senior strategy, junior to mid execution",
    "Specialist vendors per channel",
    "Integrated under one operator",
    "Built to scale into 2027",
  ],
  is_not_list: [
    "A single agency of record",
    "Full in-house team",
    "Generalist branding shop",
    "Discount-driven Fanatics-style ops",
  ],
};
