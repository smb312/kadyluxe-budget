import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/changeLog";
import type { Partner } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const scenarioId = String(body.scenario_id ?? "");
  if (!scenarioId) {
    return NextResponse.json({ error: "missing scenario_id" }, { status: 400 });
  }

  const admin = createServiceClient();

  // Verify the scenario exists and grab the slug for the response.
  const { data: scenario } = await admin
    .from("scenarios")
    .select("id, slug")
    .eq("id", scenarioId)
    .maybeSingle();
  if (!scenario) {
    return NextResponse.json({ error: "scenario not found" }, { status: 404 });
  }

  const { count } = await admin
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("scenario_id", scenarioId);

  const insertRow = {
    scenario_id: scenarioId,
    name: String(body.name ?? ""),
    category: String(body.category ?? ""),
    cost: Number(body.cost ?? 0),
    type: body.type === "annual" ? "annual" : "monthly",
    months: body.type === "annual" ? null : Number(body.months ?? 12),
    included: body.included !== false,
    notes: body.notes ?? null,
    sort_order: count ?? 0,
  };

  const { data, error } = await admin
    .from("partners")
    .insert(insertRow)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "insert failed" },
      { status: 500 },
    );
  }

  const partner: Partner = {
    id: String(data.id),
    scenario_id: String(data.scenario_id),
    scenario_slug: String(scenario.slug),
    name: data.name,
    category: data.category,
    cost: Number(data.cost),
    type: data.type,
    months: data.months,
    included: Boolean(data.included),
    notes: data.notes,
    sort_order: Number(data.sort_order ?? 0),
  };

  await recordChange({
    scenarioId,
    userEmail: user.email ?? null,
    action: "partner.create",
    details: { partner },
  });

  return NextResponse.json(partner);
}
