import { createServiceClient } from "@/lib/supabase/server";
import {
  SEED_CAPABILITY,
  SEED_CULTURE,
  SEED_FOUNDATION,
  SEED_OPERATOR,
  SEED_PARTNERS,
  SEED_STAGES,
} from "./constants";
import type {
  StageSlug,
  TeamCapability,
  TeamCulture,
  TeamData,
  TeamFoundation,
  TeamOperator,
  TeamPartner,
  TeamStage,
  TeamStatus,
} from "./types";

const isStatus = (s: unknown): s is TeamStatus =>
  s === "confirmed" || s === "recommended" || s === "vision";

const isStageSlug = (s: unknown): s is StageSlug =>
  s === "awareness" ||
  s === "consideration" ||
  s === "conversion" ||
  s === "retention" ||
  s === "advocacy";

const seedIfEmpty = async () => {
  const admin = createServiceClient();

  const { data: existingStages } = await admin
    .from("team_stages")
    .select("id, slug");

  let stagesBySlug: Map<StageSlug, string>;

  if (!existingStages || existingStages.length === 0) {
    const { data: inserted, error } = await admin
      .from("team_stages")
      .insert(SEED_STAGES)
      .select("id, slug");
    if (error) {
      console.error("seed team_stages error", error);
      return;
    }
    stagesBySlug = new Map(
      (inserted ?? [])
        .filter((r) => isStageSlug(r.slug))
        .map((r) => [r.slug as StageSlug, String(r.id)]),
    );
  } else {
    stagesBySlug = new Map(
      existingStages
        .filter((r) => isStageSlug(r.slug))
        .map((r) => [r.slug as StageSlug, String(r.id)]),
    );
  }

  const { count: partnerCount } = await admin
    .from("team_partners")
    .select("id", { count: "exact", head: true });
  if ((partnerCount ?? 0) === 0) {
    const rows = SEED_PARTNERS.map((p) => ({
      stage_id: stagesBySlug.get(p.stage_slug),
      name: p.name,
      vendor: p.vendor,
      status: p.status,
      sort_order: p.sort_order,
    })).filter((r) => r.stage_id);
    if (rows.length > 0) {
      const { error } = await admin.from("team_partners").insert(rows);
      if (error) console.error("seed team_partners error", error);
    }
  }

  const { count: foundationCount } = await admin
    .from("team_foundation")
    .select("id", { count: "exact", head: true });
  if ((foundationCount ?? 0) === 0) {
    const { error } = await admin.from("team_foundation").insert(SEED_FOUNDATION);
    if (error) console.error("seed team_foundation error", error);
  }

  const { count: operatorCount } = await admin
    .from("team_operator")
    .select("id", { count: "exact", head: true });
  if ((operatorCount ?? 0) === 0) {
    const { error } = await admin.from("team_operator").insert(SEED_OPERATOR);
    if (error) console.error("seed team_operator error", error);
  }

  const { count: capCount } = await admin
    .from("team_capability")
    .select("id", { count: "exact", head: true });
  if ((capCount ?? 0) === 0) {
    const { error } = await admin.from("team_capability").insert(SEED_CAPABILITY);
    if (error) console.error("seed team_capability error", error);
  }

  const { count: cultureCount } = await admin
    .from("team_culture")
    .select("id", { count: "exact", head: true });
  if ((cultureCount ?? 0) === 0) {
    const { error } = await admin.from("team_culture").insert(SEED_CULTURE);
    if (error) console.error("seed team_culture error", error);
  }
};

export const loadTeam = async (): Promise<TeamData> => {
  await seedIfEmpty();

  const admin = createServiceClient();
  const [
    { data: stages },
    { data: partners },
    { data: foundation },
    { data: operator },
    { data: capability },
    { data: culture },
  ] = await Promise.all([
    admin.from("team_stages").select("*").order("sort_order", { ascending: true }),
    admin.from("team_partners").select("*").order("sort_order", { ascending: true }),
    admin.from("team_foundation").select("*").order("sort_order", { ascending: true }),
    admin.from("team_operator").select("*").limit(1).maybeSingle(),
    admin.from("team_capability").select("*").limit(1).maybeSingle(),
    admin.from("team_culture").select("*").limit(1).maybeSingle(),
  ]);

  const stageRows: TeamStage[] = (stages ?? [])
    .filter((r) => isStageSlug(r.slug))
    .map((r) => ({
      id: String(r.id),
      slug: r.slug as StageSlug,
      name: String(r.name ?? ""),
      sub_label: String(r.sub_label ?? ""),
      kpi: String(r.kpi ?? ""),
      sort_order: Number(r.sort_order ?? 0),
    }));

  const idToSlug = new Map(stageRows.map((s) => [s.id, s.slug]));

  const partnerRows: TeamPartner[] = (partners ?? [])
    .map((r) => {
      const slug = idToSlug.get(String(r.stage_id));
      if (!slug) return null;
      const status = isStatus(r.status) ? r.status : "recommended";
      return {
        id: String(r.id),
        stage_id: String(r.stage_id),
        stage_slug: slug,
        name: String(r.name ?? ""),
        vendor: String(r.vendor ?? ""),
        status,
        sort_order: Number(r.sort_order ?? 0),
      } satisfies TeamPartner;
    })
    .filter((p): p is TeamPartner => p !== null);

  const foundationRows: TeamFoundation[] = (foundation ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    vendor: String(r.vendor ?? ""),
    status: isStatus(r.status) ? r.status : "recommended",
    sort_order: Number(r.sort_order ?? 0),
  }));

  const operatorRow: TeamOperator | null = operator
    ? {
        id: String(operator.id),
        name: String(operator.name ?? ""),
        tagline: String(operator.tagline ?? ""),
        body: String(operator.body ?? ""),
      }
    : null;

  const capabilityRow: TeamCapability | null = capability
    ? {
        id: String(capability.id),
        section_title: String(capability.section_title ?? ""),
        callout_title: String(capability.callout_title ?? ""),
        callout_body: String(capability.callout_body ?? ""),
      }
    : null;

  const cultureRow: TeamCulture | null = culture
    ? {
        id: String(culture.id),
        is_list: Array.isArray(culture.is_list)
          ? (culture.is_list as unknown[]).map((x) => String(x))
          : [],
        is_not_list: Array.isArray(culture.is_not_list)
          ? (culture.is_not_list as unknown[]).map((x) => String(x))
          : [],
      }
    : null;

  return {
    stages: stageRows,
    partners: partnerRows,
    foundation: foundationRows,
    operator: operatorRow,
    capability: capabilityRow,
    culture: cultureRow,
  };
};
