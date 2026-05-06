import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ALLOWED = ["name", "kpi"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (k in body) patch[k] = String(body[k] ?? "");
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }
  patch.updated_at = new Date().toISOString();

  const admin = createServiceClient();
  const { error } = await admin
    .from("team_stages")
    .update(patch)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
