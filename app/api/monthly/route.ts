import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/changeLog";
import { MONTHS } from "@/lib/constants";
import type { Month } from "@/lib/types";

const SCENARIO_KEYS = new Set(["option1", "option2", "option3"]);

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const scenarioKey = body.scenario_key;
  const month = body.month as Month;
  const amount = Number(body.amount);

  if (!SCENARIO_KEYS.has(scenarioKey)) {
    return NextResponse.json({ error: "invalid scenario_key" }, { status: 400 });
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
    .eq("user_id", user.id)
    .eq("scenario_key", scenarioKey)
    .eq("month", month)
    .maybeSingle();

  const { error } = await admin.from("monthly_variable").upsert(
    {
      user_id: user.id,
      scenario_key: scenarioKey,
      month,
      amount,
    },
    { onConflict: "user_id,scenario_key,month" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordChange({
    userId: user.id,
    table: "monthly_variable",
    recordId: `${scenarioKey}:${month}`,
    action: before ? "update" : "create",
    before: before ?? null,
    after: { scenario_key: scenarioKey, month, amount },
  });

  return NextResponse.json({ ok: true });
}
