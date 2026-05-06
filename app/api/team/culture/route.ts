import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (Array.isArray(body.is_list)) {
    patch.is_list = body.is_list.map((x: unknown) => String(x ?? ""));
  }
  if (Array.isArray(body.is_not_list)) {
    patch.is_not_list = body.is_not_list.map((x: unknown) => String(x ?? ""));
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
  patch.updated_at = new Date().toISOString();

  const admin = createServiceClient();
  const { error } = await admin
    .from("team_culture")
    .update(patch)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
