import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/changeLog";
import type { Partner } from "@/lib/types";

const SCENARIO_KEYS = new Set(["option1", "option2", "option3"]);

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!SCENARIO_KEYS.has(body.scenario_key)) {
    return NextResponse.json({ error: "invalid scenario_key" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { count } = await admin
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("scenario_key", body.scenario_key);

  const insertRow = {
    user_id: user.id,
    scenario_key: body.scenario_key,
    name: String(body.name ?? ""),
    category: String(body.category ?? ""),
    cost: Number(body.cost ?? 0),
    type: body.type === "annual" ? "annual" : "monthly",
    months: body.type === "annual" ? null : Number(body.months ?? 12),
    included: body.included !== false,
    notes: body.notes ?? null,
    position: count ?? 0,
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
    scenario_key: data.scenario_key,
    name: data.name,
    category: data.category,
    cost: Number(data.cost),
    type: data.type,
    months: data.months,
    included: Boolean(data.included),
    notes: data.notes,
    position: Number(data.position),
  };

  await recordChange({
    userId: user.id,
    table: "partners",
    recordId: partner.id,
    action: "create",
    after: partner,
  });

  return NextResponse.json(partner);
}
