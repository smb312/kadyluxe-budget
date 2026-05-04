import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_PARTNERS,
  DEFAULT_VARIABLE,
  MONTHS,
  SCENARIO_KEYS,
  SCENARIO_META,
} from "@/lib/constants";
import type {
  Month,
  Partner,
  ScenarioBundle,
  ScenarioKey,
} from "@/lib/types";

const isScenarioKey = (k: string): k is ScenarioKey =>
  k === "option1" || k === "option2" || k === "option3";

const emptyVariable = (): Record<Month, number> =>
  MONTHS.reduce(
    (acc, m) => {
      acc[m] = 0;
      return acc;
    },
    {} as Record<Month, number>,
  );

export interface UserBudget {
  bundle: ScenarioBundle;
}

export const ensureUserSeed = async (userId: string): Promise<void> => {
  const admin = createServiceClient();

  const { data: existing } = await admin
    .from("scenarios")
    .select("key")
    .eq("user_id", userId);

  const have = new Set((existing ?? []).map((r) => r.key as string));
  const missing = SCENARIO_KEYS.filter((k) => !have.has(k));
  if (missing.length === 0) return;

  const scenarioRows = missing.map((key) => ({
    user_id: userId,
    key,
    name: SCENARIO_META[key].name,
    pct: SCENARIO_META[key].pct,
  }));

  await admin.from("scenarios").insert(scenarioRows);

  const partnerRows = missing.flatMap((key) =>
    DEFAULT_PARTNERS[key].map((p, idx) => ({
      user_id: userId,
      scenario_key: key,
      name: p.name,
      category: p.category,
      cost: p.cost,
      type: p.type,
      months: p.months,
      included: p.included,
      notes: p.notes,
      position: idx,
    })),
  );
  if (partnerRows.length > 0) {
    await admin.from("partners").insert(partnerRows);
  }

  const monthlyRows = missing.flatMap((key) =>
    MONTHS.map((m) => ({
      user_id: userId,
      scenario_key: key,
      month: m,
      amount: DEFAULT_VARIABLE[key][m],
    })),
  );
  if (monthlyRows.length > 0) {
    await admin.from("monthly_variable").insert(monthlyRows);
  }
};

export const fetchUserBundle = async (userId: string): Promise<ScenarioBundle> => {
  const admin = createServiceClient();

  const [{ data: partners }, { data: monthly }] = await Promise.all([
    admin
      .from("partners")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true }),
    admin.from("monthly_variable").select("*").eq("user_id", userId),
  ]);

  return assembleBundle(partners ?? [], monthly ?? []);
};

export const fetchBundleForUser = async (userId: string): Promise<ScenarioBundle> => {
  await ensureUserSeed(userId);
  return fetchUserBundle(userId);
};

const assembleBundle = (
  partnerRows: Array<Record<string, unknown>>,
  monthlyRows: Array<Record<string, unknown>>,
): ScenarioBundle => {
  const bundle: ScenarioBundle = {
    option1: { partners: [], variable: emptyVariable() },
    option2: { partners: [], variable: emptyVariable() },
    option3: { partners: [], variable: emptyVariable() },
  };

  for (const row of partnerRows) {
    const key = row.scenario_key as string;
    if (!isScenarioKey(key)) continue;
    const partner: Partner = {
      id: String(row.id),
      scenario_key: key,
      name: String(row.name ?? ""),
      category: String(row.category ?? ""),
      cost: Number(row.cost ?? 0),
      type: row.type === "annual" ? "annual" : "monthly",
      months: row.months == null ? null : Number(row.months),
      included: Boolean(row.included),
      notes: row.notes == null ? null : String(row.notes),
      position: Number(row.position ?? 0),
    };
    bundle[key].partners.push(partner);
  }

  for (const row of monthlyRows) {
    const key = row.scenario_key as string;
    if (!isScenarioKey(key)) continue;
    const m = row.month as Month;
    if (!MONTHS.includes(m)) continue;
    bundle[key].variable[m] = Number(row.amount ?? 0);
  }

  return bundle;
};

export const fetchBundleForShareToken = async (
  token: string,
): Promise<{ bundle: ScenarioBundle; ownerEmail: string | null } | null> => {
  const admin = createServiceClient();
  const { data: link } = await admin
    .from("share_links")
    .select("user_id, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!link || link.revoked_at) return null;
  const userId = link.user_id as string;

  const bundle = await fetchUserBundle(userId);

  const { data: user } = await admin.auth.admin.getUserById(userId);
  return { bundle, ownerEmail: user?.user?.email ?? null };
};
