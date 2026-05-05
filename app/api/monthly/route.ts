import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/changeLog";
import { MONTHS } from "@/lib/constants";
import type { Month } from "@/lib/types";

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const scenarioId = String(body.scenario_id ?? "");
  const month = body.month as Month;
  const amount = Number(body.amount);

  if (!scenarioId) {
    return NextResponse.json({ error: "missing scenario_id" }, { status: 400 });
  }
  if (!MONTHS.includes(month)) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data: before } = await admin
    .from("monthly_variable")
    .select("amount")
    .eq("scenario_id", scenarioId)
    .eq("month", month)
    .maybeSingle();

  const { error } = await admin.from("monthly_variable").upsert(
    { scenario_id: scenarioId, month, amount },
    { onConflict: "scenario_id,month" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordChange({
    scenarioId,
    userEmail: user.email ?? null,
    action: before ? "monthly.update" : "monthly.create",
    details: { month, before: before?.amount ?? null, after: amount },
  });

  return NextResponse.json({ ok: true });
}
