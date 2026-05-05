import type { Month } from "./types";

export const DTC_GOAL = 3_000_000;

export const MONTHS: Month[] = [
  "May", "Jun", "Jul", "Aug", "Sep", "Oct",
  "Nov", "Dec", "Jan", "Feb", "Mar", "Apr",
];

export const PEAK_MONTHS: Month[] = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
export const BUILD_MONTHS: Month[] = ["May", "Jun", "Jul"];
export const MAINT_MONTHS: Month[] = ["Feb", "Mar", "Apr"];

interface SeedPartner {
  name: string;
  category: string;
  cost: number;
  type: "annual" | "monthly";
  months: number | null;
  included: boolean;
  notes: string;
}

const basePartners: SeedPartner[] = [
  {
    name: "Broncos Sponsorship",
    category: "Licensing/Access",
    cost: 150_000,
    type: "annual",
    months: null,
    included: true,
    notes: "Year 2 commit. Flag: could be carved out as license cost.",
  },
  {
    name: "Marketer.com",
    category: "Paid Media Mgmt",
    cost: 3_900,
    type: "monthly",
    months: 12,
    included: true,
    notes: "90-day pilot active. Meta + Google + TikTok.",
  },
  {
    name: "Kait",
    category: "SEO + GMC + Amazon",
    cost: 4_000,
    type: "monthly",
    months: 12,
    included: true,
    notes: "$3K SEO + $1K Amazon storefront.",
  },
  {
    name: "Email Vendor (Josh or Homestead)",
    category: "Email/SMS",
    cost: 5_000,
    type: "monthly",
    months: 12,
    included: true,
    notes: "Avg of off-season $4.5K + peak $5.5K. SMS layer adds $1.5K starting Aug.",
  },
  {
    name: "PAZ Analytics",
    category: "Tracking/Pixel Audit",
    cost: 15_000,
    type: "annual",
    months: null,
    included: true,
    notes: "Audit + light retainer.",
  },
];

// Keyed by pct so seeding is independent of slug naming.
export const DEFAULT_PARTNERS_BY_PCT: Record<number, SeedPartner[]> = {
  10: basePartners.map((p) => (p.name === "PAZ Analytics" ? { ...p, cost: 10_000 } : p)),
  15: [
    ...basePartners.map((p) => (p.name === "PAZ Analytics" ? { ...p, cost: 12_000 } : p)),
    {
      name: "D2C Design",
      category: "CRO + Landing Pages",
      cost: 9_000,
      type: "monthly",
      months: 6,
      included: true,
      notes: "Coast network. Jun-Nov only.",
    },
  ],
  20: [
    ...basePartners,
    {
      name: "D2C Design",
      category: "CRO + Landing Pages",
      cost: 9_000,
      type: "monthly",
      months: 7,
      included: true,
      notes: "Coast network. Jun-Dec.",
    },
    {
      name: "10pm Curfew",
      category: "Influencer/Creator Program",
      cost: 6_500,
      type: "monthly",
      months: 6,
      included: true,
      notes: "Coast network. Jul-Dec. Cheerleader + NIL + sorority creators.",
    },
    {
      name: "Incremental Creative Production",
      category: "Photo/Video",
      cost: 25_000,
      type: "annual",
      months: null,
      included: true,
      notes: "Project-based shoots, UGC sourcing.",
    },
  ],
};

export const DEFAULT_VARIABLE_BY_PCT: Record<number, Record<Month, number>> = {
  10: { May: 1000, Jun: 1500, Jul: 2000, Aug: 4000, Sep: 5500, Oct: 5000, Nov: 6000, Dec: 3500, Jan: 2500, Feb: 500, Mar: 250, Apr: 250 },
  15: { May: 4000, Jun: 6000, Jul: 7000, Aug: 13000, Sep: 17000, Oct: 17000, Nov: 20000, Dec: 14000, Jan: 10000, Feb: 4000, Mar: 2000, Apr: 2000 },
  20: { May: 7000, Jun: 12000, Jul: 21000, Aug: 37000, Sep: 46000, Oct: 39000, Nov: 45000, Dec: 28000, Jan: 21000, Feb: 6000, Mar: 2000, Apr: 0 },
};
