import { createServiceClient } from "@/lib/supabase/server";
import {
  SEED_FOUNDATION,
  SEED_PARTNERS,
  SEED_STAGES,
} from "./constants";
import type {
  TeamData,
  TeamFoundation,
  TeamPartner,
  TeamSettings,
  TeamStage,
  TeamStatus,
} from "./types";

const isStatus = (s: unknown): s is TeamStatus =>
  s === "confirmed" || s === "recommended" || s === "vision";

const seedIfEmpty = async (userId: string) => {
  const admin = createServiceClient();

  const { data: existingStages } = await admin
    .from("team_stages")
    .select("id, position");

  let positionToId: Map<number, string>;

  if (!existingStages || existingStages.length === 0) {
    const { data: inserted, error } = await admin
      .from("team_stages")
      .insert(SEED_STAGES)
      .select("id, position");
    if (error) {
      console.error("seed team_stages error", error);
      return;
    }
    positionToId = new Map(
      (inserted ?? []).map((r) => [Number(r.position), String(r.id)]),
    );
  } else {
    positionToId = new Map(
      existingStages.map((r) => [Number(r.position), String(r.id)]),
    );
  }

  const { count: partnerCount } = await admin
    .from("team_partners")
    .select("id", { count: "exact", head: true });
  if ((partnerCount ?? 0) === 0) {
    const rows = SEED_PARTNERS.map((p) => ({
      stage_id: positionToId.get(p.stage_position),
      name: p.name,
      partner: p.partner,
      status: p.status,
      position: p.position,
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

  const { data: existingSettings } = await admin
    .from("team_settings")
    .select("user_id")
    .limit(1)
    .maybeSingle();
  if (!existingSettings) {
    // Column defaults populate the textual fields; we only need user_id.
    const { error } = await admin
      .from("team_settings")
      .insert({ user_id: userId });
    if (error) console.error("seed team_settings error", error);
  }
};

export const loadTeam = async (
  userId: string | null,
  options: { seed?: boolean } = {},
): Promise<TeamData> => {
  const seed = options.seed ?? Boolean(userId);
  if (seed && userId) {
    await seedIfEmpty(userId);
  }

  const admin = createServiceClient();
  const [
    { data: stages },
    { data: partners },
    { data: foundation },
    { data: settings },
  ] = await Promise.all([
    admin.from("team_stages").select("*").order("position", { ascending: true }),
    admin.from("team_partners").select("*").order("position", { ascending: true }),
    admin.from("team_foundation").select("*").order("position", { ascending: true }),
    admin.from("team_settings").select("*").limit(1).maybeSingle(),
  ]);

  const stageRows: TeamStage[] = (stages ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    kpi: String(r.kpi ?? ""),
    position: Number(r.position ?? 0),
  }));

  const partnerRows: TeamPartner[] = (partners ?? []).map((r) => ({
    id: String(r.id),
    stage_id: String(r.stage_id ?? ""),
    name: String(r.name ?? ""),
    partner: String(r.partner ?? ""),
    status: isStatus(r.status) ? r.status : "recommended",
    position: Number(r.position ?? 0),
  }));

  const foundationRows: TeamFoundation[] = (foundation ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    partner: String(r.partner ?? ""),
    status: isStatus(r.status) ? r.status : "recommended",
    position: Number(r.position ?? 0),
  }));

  const settingsRow: TeamSettings | null = settings
    ? {
        user_id: String(settings.user_id),
        operator_name: String(settings.operator_name ?? ""),
        operator_description: String(settings.operator_description ?? ""),
        lever_title: String(settings.lever_title ?? ""),
        lever_description: String(settings.lever_description ?? ""),
        what_it_is: Array.isArray(settings.what_it_is)
          ? (settings.what_it_is as unknown[]).map((x) => String(x))
          : [],
        what_it_is_not: Array.isArray(settings.what_it_is_not)
          ? (settings.what_it_is_not as unknown[]).map((x) => String(x))
          : [],
      }
    : null;

  return {
    stages: stageRows,
    partners: partnerRows,
    foundation: foundationRows,
    settings: settingsRow,
  };
};
