import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const SCALAR_KEYS = [
  "baseline_dtc_monthly",
  "influencer_roas",
  "aov",
  "site_cvr",
  "contribution_margin",
  "paid_lag_weeks",
  "influencer_lag_weeks",
  "scott_fee_monthly",
  "broncos_amount",
] as const;

const JSONB_KEYS = [
  "seasonality",
  "paid_roas_by_month",
  "email_pct_by_month",
] as const;

const sanitizeMap = (v: unknown): Record<string, number> | null => {
  if (!v || typeof v !== "object") return null;
  const out: Record<string, number> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
};

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};

  for (const k of SCALAR_KEYS) {
    if (k in body) {
      const n = Number(body[k]);
      if (Number.isFinite(n)) patch[k] = n;
    }
  }

  for (const k of JSONB_KEYS) {
    if (k in body) {
      const map = sanitizeMap(body[k]);
      if (map) patch[k] = map;
    }
  }

  if ("broncos_included" in body) {
    patch.broncos_included = Boolean(body.broncos_included);
  }
  if ("selected_scenario_slug" in body) {
    patch.selected_scenario_slug = String(body.selected_scenario_slug ?? "");
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
  patch.updated_at = new Date().toISOString();

  const admin = createServiceClient();

  // Ensure a row exists, then patch it.
  const { data: existing } = await admin
    .from("cashflow_assumptions")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) {
    const { error: insertErr } = await admin
      .from("cashflow_assumptions")
      .insert({ user_id: user.id });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  const { error } = await admin
    .from("cashflow_assumptions")
    .update(patch)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
