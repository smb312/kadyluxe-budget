import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_PARTNERS_BY_PCT,
  DEFAULT_VARIABLE_BY_PCT,
  MONTHS,
} from "@/lib/constants";
import type {
  Month,
  Partner,
  Scenario,
  ScenarioBundle,
  ScenarioState,
} from "@/lib/types";

const emptyVariable = (): Record<Month, number> =>
  MONTHS.reduce((acc, m) => {
    acc[m] = 0;
    return acc;
  }, {} as Record<Month, number>);

export const fetchScenarios = async (): Promise<Scenario[]> => {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("scenarios")
    .select("id, slug, name, pct, realistic_dtc, hits_goal, note, color, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchScenarios error", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    pct: Number(r.pct),
    realistic_dtc: String(r.realistic_dtc ?? ""),
    hits_goal: String(r.hits_goal ?? ""),
    note: String(r.note ?? ""),
    color: String(r.color ?? "#1A1A1A"),
    sort_order: Number(r.sort_order ?? 0),
  }));
};

const seedScenarioIfEmpty = async (scenario: Scenario): Promise<void> => {
  const admin = createServiceClient();
  const pct = Math.round(scenario.pct);

  const [{ count: partnerCount }, { count: monthlyCount }] = await Promise.all([
    admin
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("scenario_id", scenario.id),
    admin
      .from("monthly_variable")
      .select("scenario_id", { count: "exact", head: true })
      .eq("scenario_id", scenario.id),
  ]);

  if ((partnerCount ?? 0) === 0) {
    const seed = DEFAULT_PARTNERS_BY_PCT[pct];
    if (seed) {
      const rows = seed.map((p, idx) => ({
        scenario_id: scenario.id,
        name: p.name,
        category: p.category,
        cost: p.cost,
        type: p.type,
        months: p.months,
        included: p.included,
        notes: p.notes,
        sort_order: idx,
      }));
      const { error } = await admin.from("partners").insert(rows);
      if (error) console.error("seed partners error", error);
    }
  }

  if ((monthlyCount ?? 0) === 0) {
    const seed = DEFAULT_VARIABLE_BY_PCT[pct];
    if (seed) {
      const rows = MONTHS.map((m) => ({
        scenario_id: scenario.id,
        month: m,
        amount: seed[m] ?? 0,
      }));
      const { error } = await admin.from("monthly_variable").insert(rows);
      if (error) console.error("seed monthly error", error);
    }
  }
};

export const ensureSeed = async (scenarios: Scenario[]): Promise<void> => {
  await Promise.all(scenarios.map(seedScenarioIfEmpty));
};

export const fetchBundle = async (
  scenarios: Scenario[],
): Promise<ScenarioBundle> => {
  const admin = createServiceClient();
  const ids = scenarios.map((s) => s.id);
  if (ids.length === 0) return {};

  const [{ data: partnerRows }, { data: monthlyRows }] = await Promise.all([
    admin
      .from("partners")
      .select("*")
      .in("scenario_id", ids)
      .order("sort_order", { ascending: true }),
    admin.from("monthly_variable").select("*").in("scenario_id", ids),
  ]);

  const idToSlug = new Map(scenarios.map((s) => [s.id, s.slug]));

  const bundle: ScenarioBundle = {};
  for (const s of scenarios) {
    bundle[s.slug] = { partners: [], variable: emptyVariable() };
  }

  for (const row of partnerRows ?? []) {
    const slug = idToSlug.get(String(row.scenario_id));
    if (!slug) continue;
    const partner: Partner = {
      id: String(row.id),
      scenario_id: String(row.scenario_id),
      scenario_slug: slug,
      name: String(row.name ?? ""),
      category: String(row.category ?? ""),
      cost: Number(row.cost ?? 0),
      type: row.type === "annual" ? "annual" : "monthly",
      months: row.months == null ? null : Number(row.months),
      included: Boolean(row.included),
      notes: row.notes == null ? null : String(row.notes),
      sort_order: Number(row.sort_order ?? 0),
    };
    bundle[slug].partners.push(partner);
  }

  for (const row of monthlyRows ?? []) {
    const slug = idToSlug.get(String(row.scenario_id));
    if (!slug) continue;
    const m = row.month as Month;
    if (!MONTHS.includes(m)) continue;
    bundle[slug].variable[m] = Number(row.amount ?? 0);
  }

  return bundle;
};

export interface BudgetData {
  scenarios: Scenario[];
  bundle: ScenarioBundle;
}

export const loadBudget = async (): Promise<BudgetData> => {
  const scenarios = await fetchScenarios();
  await ensureSeed(scenarios);
  const bundle = await fetchBundle(scenarios);
  return { scenarios, bundle };
};

export const validateShareToken = async (
  token: string,
): Promise<{ ownerEmail: string | null } | null> => {
  const admin = createServiceClient();
  const { data: link } = await admin
    .from("share_links")
    .select("created_by, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!link) return null;
  if (link.expires_at && new Date(link.expires_at) <= new Date()) return null;

  let ownerEmail: string | null = null;
  if (link.created_by) {
    const { data: u } = await admin.auth.admin.getUserById(String(link.created_by));
    ownerEmail = u?.user?.email ?? null;
  }
  return { ownerEmail };
};

export const loadBudgetForShareToken = async (
  token: string,
): Promise<{ data: BudgetData; ownerEmail: string | null } | null> => {
  const meta = await validateShareToken(token);
  if (!meta) return null;
  const data = await loadBudget();
  return { data, ownerEmail: meta.ownerEmail };
};
