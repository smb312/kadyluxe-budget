import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (Array.isArray(body.what_it_is)) {
    patch.what_it_is = body.what_it_is.map((x: unknown) => String(x ?? ""));
  }
  if (Array.isArray(body.what_it_is_not)) {
    patch.what_it_is_not = body.what_it_is_not.map((x: unknown) => String(x ?? ""));
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
  patch.updated_at = new Date().toISOString();

  const admin = createServiceClient();
  const { data: row } = await admin
    .from("team_settings")
    .select("user_id")
    .limit(1)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: "settings row missing" }, { status: 500 });
  }

  const { error } = await admin
    .from("team_settings")
    .update(patch)
    .eq("user_id", row.user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
