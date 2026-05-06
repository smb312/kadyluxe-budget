import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ALLOWED = ["name", "partner", "status", "position"] as const;
const VALID_STATUS = new Set(["confirmed", "recommended", "vision"]);

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
    if (k in body) patch[k] = body[k];
  }
  if ("status" in patch && !VALID_STATUS.has(patch.status as string)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
  patch.updated_at = new Date().toISOString();

  const admin = createServiceClient();
  const { error } = await admin
    .from("team_partners")
    .update(patch)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createServiceClient();
  const { error } = await admin
    .from("team_partners")
    .delete()
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
